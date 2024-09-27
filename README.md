# RTMPS Music Streaming Server with Node.js

![Screenshot](src/assets/cover.jpg)

This project is a simple for RTMPS streams music using Node.js. The bot fetches and streams `.mp3` files from a
directory on the server to users on RTMPS.

## Prerequisites

Ensure `ffmpeg` is installed on your server. You can install `ffmpeg` with the following commands:

**On Ubuntu:**

  ```bash
  sudo apt update
  sudo apt install ffmpeg
  ```

**On CentOS:**

```bash
  sudo yum install epel-release
  sudo yum install ffmpeg
  ```

## Installation

- Clone this repository:
  ```bash
  git clone https://github.com/habibi-dev/nodejs-music-stream.git
  cd nodejs-music-stream
  ```
- Install the required dependencies:
  ```bash
  npm install
  ```
- Copy the `config.example.json` file to `config.json` and update the configuration settings:
  ```bash
  cp config.example.json config.json
  ```
- Run the bot:
  ```bash 
  npm start
  ```

## JSON Configuration for Streaming

- ```servers[]:```
    - This is an array that contains multiple server configurations. Each server can have its own stream key, RTMP URL,
      media type, and other related settings.
      <br/><br/>
- ```stream_key:```
    - This is your unique stream key used for authenticating and identifying your stream on the platform. Keep this
      value secret, as anyone with access to it can stream to your channel. Each server in the array will have its own
      stream key. For example, this is provided by platforms like YouTube, Twitch, or Telegram.
      <br/><br/>
- ```url_rtmp:```
    - The URL of the RTMP (Real-Time Messaging Protocol) server to which you will send your stream. It typically
      includes the protocol (rtmp or rtmps for secure streaming) and the server address where the stream will be
      broadcast. For example, it could be a Telegram, YouTube, or other streaming platform's RTMP server.
      <br/><br/>
- ```dir:```
    - The directory that contains your media files. The full path should point to a folder where the media files (e.g.,
      .mp3 or .mp4) are stored. This directory is used by the application to load and stream the files for each server.
      <br/><br/>
- ```media_type:```
    - Specifies the type of media to be streamed. Possible values are `video` or `audio`. If you are streaming
      audio-only (with an optional cover image), use `audio`. If you are streaming a full video, use `video`.
      <br/><br/>
- ```cover:```
    - Path to the image file that will be used as a cover in case of an audio stream or as a static image in video
      streams. This image is recommended to be 1280x720 pixels in size for HD quality. If you are streaming audio, this
      cover image will be displayed as the visual component.
      <br/><br/>
- ```audio_codec:```
    - Defines the codec used for audio encoding. The default is typically `aac`, which provides good compression with
      high sound quality and is widely supported. You can use other codecs if necessary, depending on your streaming
      platform.
      <br/><br/>
- ```audio_sample_rate:```
    - Sets the sample rate for the audio stream, measured in Hz. Common values are `44100` (CD quality) or `48000` (DVD
      quality). This determines how often samples of the audio are taken per second.
      <br/><br/>
- ```audio_channels:```
    - The number of audio channels in the stream. Use `1` for mono audio (single channel) and `2` for stereo audio (dual
      channel, more immersive sound). Stereo is typically used for most music streams.
      <br/><br/>
- ```audio_bitrate:```
    - The bitrate for audio encoding, which controls the audio quality and bandwidth usage. Higher values like `192k`
      offer better audio quality but consume more bandwidth, while lower values reduce quality and bandwidth usage.
      Adjust based on your network capacity and audio quality requirements.
      <br/><br/>
- ```scale:```
    - Defines the output resolution of the video stream in width:height format. For HD streams, use `1280:720`. This
      setting is only applicable if you are streaming video and want to control the resolution. If you are streaming
      audio-only, this setting can be ignored.
      <br/><br/>
- ```ignore_directories:```
    - A list of directories to be ignored during the streaming process. Use this field to specify directories that
      should be excluded from streaming. This is useful if you have backup or temporary directories that should not be
      streamed.