(function () {
    const root = document.querySelector('[data-stream-root]');
    if (!root) return;

    const video = document.getElementById('player-video');
    const overlay = document.getElementById('player-overlay');
    const overlayMessage = document.getElementById('overlay-message');
    const overlayAction = document.getElementById('overlay-action');
    const status = document.getElementById('player-status');

    if (!(video instanceof HTMLVideoElement)) {
        return;
    }

    const playerShell = root.querySelector('.player-shell');
    const controls = root.querySelector('[data-player-controls]');
    const muteButton = controls ? controls.querySelector('[data-action="mute"]') : null;
    const fullscreenButton = controls ? controls.querySelector('[data-action="fullscreen"]') : null;
    const CONTROLS_AUTO_HIDE_DELAY = 3000;

    const streamUrl = root.dataset.streamUrl || '';
    const autoplayMuted = root.dataset.autoplayMuted === 'true';

    const TEXT = {
        preparing: 'Preparing the stream...',
        connecting: 'Connecting to the stream...',
        playing: 'Stream is live.',
        manifestPending: 'Stream is not ready yet. Retrying...',
        manifestError: 'Could not reach the stream manifest. Retrying...',
        playbackStopped: 'Playback stopped.',
        networkError: 'Network connection lost. Retrying...',
        unsupported: 'Your browser does not support HLS playback.',
        invalidUrl: 'Stream URL is invalid.',
        channelMissing: 'Channel is not available.',
        manualRetry: 'Retrying in a few seconds...',
        tapToPlay: 'Tap or click to start playback.',
        tapToUnmute: 'Tap to enable audio.',
        useDifferentBrowser: 'Use a modern browser that supports HLS or Media Source Extensions.'
    };

    let hlsInstance = null;
    let retryTimer = null;
    let manifestTimer = null;
    let overlayActionHandler = null;
    let hasInteracted = false;
    let hasAttached = false;
    let controlsHideTimer = null;
    let isNativeFullscreen = false;

    const getFullscreenElement = () =>
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement ||
        null;

    const shouldDisplayControls = () => {
        if (!controls) return false;
        if (overlay && !overlay.classList.contains('is-hidden')) {
            return false;
        }
        return true;
    };

    function clearControlsHideTimer() {
        if (controlsHideTimer !== null) {
            window.clearTimeout(controlsHideTimer);
            controlsHideTimer = null;
        }
    }

    function hideControls() {
        if (!controls) return;
        clearControlsHideTimer();
        controls.classList.remove('is-visible');
    }

    function showControls(persist = false) {
        if (!controls) return;
        if (!shouldDisplayControls()) {
            hideControls();
            return;
        }

        controls.classList.add('is-visible');
        clearControlsHideTimer();

        if (!persist) {
            controlsHideTimer = window.setTimeout(() => {
                hideControls();
            }, CONTROLS_AUTO_HIDE_DELAY);
        }
    }

    const syncMuteToggle = () => {
        if (!muteButton) return;
        const isMuted = video.muted;
        muteButton.setAttribute('aria-pressed', isMuted ? 'true' : 'false');
        const label = isMuted ? 'Unmute audio' : 'Mute audio';
        muteButton.setAttribute('aria-label', label);
        muteButton.setAttribute('title', label);
    };

    const isFullscreenActive = () => {
        const element = getFullscreenElement();
        return !!element && (element === playerShell || element === video);
    };

    const syncFullscreenToggle = () => {
        if (!fullscreenButton) return;
        const active = isFullscreenActive() || isNativeFullscreen;
        fullscreenButton.setAttribute('aria-pressed', active ? 'true' : 'false');
        const label = active ? 'Exit fullscreen' : 'Enter fullscreen';
        fullscreenButton.setAttribute('aria-label', label);
        fullscreenButton.setAttribute('title', label);
    };

    const requestFullscreen = () => {
        const target = playerShell || video;
        if (!target) return;

        if (target.requestFullscreen) {
            target.requestFullscreen().catch(() => {});
            return;
        }
        if (target.webkitRequestFullscreen) {
            target.webkitRequestFullscreen();
            return;
        }
        if (target.mozRequestFullScreen) {
            target.mozRequestFullScreen();
            return;
        }
        if (target.msRequestFullscreen) {
            target.msRequestFullscreen();
            return;
        }
        if (typeof video.webkitEnterFullscreen === 'function') {
            video.webkitEnterFullscreen();
        }
    };

    const exitFullscreen = () => {
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
            return;
        }
        if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
            return;
        }
        if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
            return;
        }
        if (document.msExitFullscreen) {
            document.msExitFullscreen();
            return;
        }
        if (typeof video.webkitExitFullscreen === 'function') {
            video.webkitExitFullscreen();
        }
    };


    const overlayUi = {
        show(message, actionText, handler) {
            if (overlayMessage) {
                overlayMessage.innerHTML = message;
            }

            overlayActionHandler = actionText && handler ? handler : null;
            if (overlayAction) {
                if (overlayActionHandler) {
                    overlayAction.textContent = actionText;
                    overlayAction.classList.remove('is-hidden');
                } else {
                    overlayAction.textContent = '';
                    overlayAction.classList.add('is-hidden');
                }
            }

            overlay?.classList.remove('is-hidden');
            hideControls();
        },
        hide() {
            overlay?.classList.add('is-hidden');
            overlayActionHandler = null;
        }
    };

    const updateStatus = (text) => {
        if (status) {
            status.textContent = text;
        }
    };

    const clearTimers = () => {
        if (retryTimer !== null) {
            clearTimeout(retryTimer);
            retryTimer = null;
        }
        if (manifestTimer !== null) {
            clearTimeout(manifestTimer);
            manifestTimer = null;
        }
    };

    const scheduleRetry = (fn, delay) => {
        clearTimers();
        retryTimer = window.setTimeout(() => {
            retryTimer = null;
            fn();
        }, delay);
    };

    const probeManifest = (delay) => {
        if (!streamUrl) return;
        manifestTimer = window.setTimeout(() => {
            manifestTimer = null;
            fetch(`${streamUrl}?_=${Date.now()}`, { method: 'HEAD', cache: 'no-store' })
                .then((response) => {
                    if (response.ok) {
                        attachPlayback();
                    } else {
                        updateStatus(TEXT.manifestPending);
                        probeManifest(3000);
                    }
                })
                .catch(() => {
                    updateStatus(TEXT.manifestError);
                    probeManifest(4000);
                });
        }, delay);
    };

    const ensureAutoplay = () => {
        video.muted = autoplayMuted && !hasInteracted;
        const playAttempt = video.play();
        if (playAttempt && typeof playAttempt.then === 'function') {
            playAttempt.catch(() => {
                overlayUi.show(TEXT.tapToPlay, 'Play', () => {
                    hasInteracted = true;
                    overlayUi.hide();
                    ensureAutoplay();
                });
            });
        }
    };

    const handleUserInteraction = () => {
        hasInteracted = true;
        video.muted = false;
        overlayUi.hide();
        ensureAutoplay();
    };

    const showTapToUnmute = () => {
        if (hasInteracted || !video.muted) {
            overlayUi.hide();
            return;
        }
        overlayUi.show(TEXT.tapToUnmute, 'Enable Audio', handleUserInteraction);
    };

    const destroyHls = () => {
        if (hlsInstance) {
            try {
                hlsInstance.destroy();
            } catch (err) {
                console.warn('Failed to destroy HLS instance', err);
            }
            hlsInstance = null;
        }
    };

    const resetPlayback = () => {
        destroyHls();
        video.removeAttribute('src');
        video.load();
        hasAttached = false;
    };

    const handleFatalError = (message) => {
        resetPlayback();
        updateStatus(message);
        overlayUi.show(`${message}<span>${TEXT.manualRetry}</span>`);
        scheduleRetry(() => attachPlayback(), 4000);
    };

    const handleHlsError = (data) => {
        if (!data) return;
        if (data.response && data.response.code === 404) {
            updateStatus(TEXT.manifestPending);
            scheduleRetry(() => {
                destroyHls();
                attachPlayback();
            }, 3000);
            return;
        }

        if (data.fatal) {
            switch (data.type) {
                case window.Hls.ErrorTypes.NETWORK_ERROR:
                    handleFatalError(TEXT.networkError);
                    break;
                case window.Hls.ErrorTypes.MEDIA_ERROR:
                    if (hlsInstance) {
                        hlsInstance.recoverMediaError();
                        ensureAutoplay();
                    }
                    break;
                default:
                    handleFatalError(TEXT.playbackStopped);
                    break;
            }
        }
    };

    const attachHls = () => {
        if (!window.Hls || !window.Hls.isSupported()) {
            updateStatus(TEXT.unsupported);
            overlayUi.show(`${TEXT.unsupported}<span>${TEXT.useDifferentBrowser}</span>`);
            return;
        }

        destroyHls();
        hlsInstance = new window.Hls({ enableWorker: true, lowLatencyMode: true, liveSyncDurationCount: 3 });
        hlsInstance.on(window.Hls.Events.MEDIA_ATTACHED, () => {
            if (!hlsInstance) return;
            hlsInstance.loadSource(streamUrl);
        });
        hlsInstance.on(window.Hls.Events.MANIFEST_PARSED, () => {
            hasAttached = true;
            updateStatus(TEXT.playing);
            ensureAutoplay();
        });
        hlsInstance.on(window.Hls.Events.ERROR, (_event, data) => handleHlsError(data));
        hlsInstance.attachMedia(video);
    };

    const attachNative = () => {
        if (hasAttached && video.src === streamUrl) {
            ensureAutoplay();
            return;
        }
        video.src = streamUrl;
        video.load();
        hasAttached = true;
        ensureAutoplay();
    };

    const attachPlayback = () => {
        clearTimers();
        updateStatus(TEXT.connecting);

        if (!streamUrl) {
            overlayUi.show(TEXT.invalidUrl);
            updateStatus(TEXT.invalidUrl);
            return;
        }

        if (video.canPlayType('application/vnd.apple.mpegurl')) {
            attachNative();
        } else {
            attachHls();
        }
    };

    if (controls) {
        controls.addEventListener('mouseenter', () => showControls(true));
        controls.addEventListener('mouseleave', () => showControls());
        controls.addEventListener('focusin', () => showControls(true));
        controls.addEventListener('focusout', () => {
            window.requestAnimationFrame(() => {
                if (!controls.contains(document.activeElement)) {
                    showControls();
                }
            });
        });
    }

    const handlePointerActivity = () => {
        showControls();
    };

    if (playerShell) {
        playerShell.addEventListener('pointermove', handlePointerActivity);
        playerShell.addEventListener('pointerdown', handlePointerActivity, { passive: true });
        playerShell.addEventListener('mouseleave', () => {
            if (!controls || !controls.contains(document.activeElement)) {
                hideControls();
            }
        });
    }

    root.addEventListener('touchstart', () => {
        showControls();
    }, { passive: true });

    if (muteButton) {
        muteButton.addEventListener('click', (event) => {
            event.stopPropagation();
            const nextMuted = !video.muted;
            video.muted = nextMuted;
            if (!nextMuted) {
                hasInteracted = true;
                overlayUi.hide();
                ensureAutoplay();
            }
            syncMuteToggle();
            showControls(true);
        });
    }

    if (fullscreenButton) {
        fullscreenButton.addEventListener('click', (event) => {
            event.stopPropagation();
            if (isFullscreenActive() || isNativeFullscreen) {
                exitFullscreen();
            } else {
                requestFullscreen();
            }
            showControls(true);
        });
    }

    const fullscreenChangeEvents = ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
    const handleFullscreenChange = () => {
        syncFullscreenToggle();
        if (isFullscreenActive()) {
            showControls();
        } else if (!isNativeFullscreen) {
            hideControls();
        }
    };
    fullscreenChangeEvents.forEach((eventName) => {
        document.addEventListener(eventName, handleFullscreenChange);
    });

    if (typeof video.webkitEnterFullscreen === 'function') {
        video.addEventListener('webkitbeginfullscreen', () => {
            isNativeFullscreen = true;
            syncFullscreenToggle();
        });
        video.addEventListener('webkitendfullscreen', () => {
            isNativeFullscreen = false;
            syncFullscreenToggle();
            hideControls();
        });
    }

    video.addEventListener('volumechange', () => {
        syncMuteToggle();
    });

    video.addEventListener('error', () => {
        handleFatalError(TEXT.playbackStopped);
    });

    video.addEventListener('playing', () => {
        updateStatus(TEXT.playing);
        showTapToUnmute();
    });

    video.addEventListener('click', () => {
        if (!hasInteracted) {
            handleUserInteraction();
        }
    }, { passive: true });

    video.addEventListener('touchstart', () => {
        if (!hasInteracted) {
            handleUserInteraction();
        }
    }, { once: true, passive: true });

    overlay?.addEventListener('click', () => {
        if (!overlayActionHandler && !hasInteracted) {
            handleUserInteraction();
        }
    });

    if (overlayAction) {
        overlayAction.addEventListener('click', (event) => {
            event.stopPropagation();
            if (overlayActionHandler) {
                overlayActionHandler();
            }
        });
    }

    document.addEventListener('keydown', () => {
        if (!hasInteracted) {
            handleUserInteraction();
        }
    }, { once: true });

    window.addEventListener('beforeunload', () => {
        clearTimers();
        destroyHls();
        clearControlsHideTimer();
    }, { once: true });

    syncMuteToggle();
    syncFullscreenToggle();
    hideControls();

    if (!streamUrl) {
        overlayUi.show(TEXT.channelMissing);
        updateStatus(TEXT.channelMissing);
        return;
    }

    updateStatus(TEXT.preparing);
    overlayUi.show(TEXT.preparing, null, null);
    probeManifest(0);
})();
