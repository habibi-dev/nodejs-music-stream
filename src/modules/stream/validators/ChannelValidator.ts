import {
    TimeType,
    ContentType,
    SortingMethod,
    SortingOrder
} from '../interfaces/ChannelInterface';
import StreamPresets from "../config/StreamPresets";
import {OverlayInterface} from "../interfaces/OverlayInterface";

export class ChannelValidator {

    static validateChannel(data: any): void {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid channel configuration: must be an object');
        }

        ChannelValidator.validateRequired(data, 'channel', ['name', 'enabled', 'output', 'schedule', 'overrides']);

        ChannelValidator.validateBasicFields(data);
        ChannelValidator.validateOutput(data.output);
        ChannelValidator.validateSchedule(data.schedule);
        ChannelValidator.validateOverrides(data.overrides);
    }

    private static validateBasicFields(data: any): void {
        if (typeof data.name !== 'string' || !data.name.trim()) {
            throw new Error('channel.name must be a non-empty string');
        }

        if (typeof data.enabled !== 'boolean') {
            throw new Error('channel.enabled must be boolean');
        }
    }

    private static validateOutput(output: any): void {
        if (!output || typeof output !== 'object') {
            throw new Error('channel.output must be an object');
        }

        ChannelValidator.validateRequired(output, 'output', ['local', 'remote']);

        ChannelValidator.validateLocalOutput(output.local);
        ChannelValidator.validateRemoteOutput(output.remote);
    }

    private static validateLocalOutput(local: any): void {
        if (!local || typeof local !== 'object') {
            throw new Error('output.local must be an object');
        }

        ChannelValidator.validateRequired(local, 'output.local', ['enabled']);

        if (typeof local.enabled !== 'boolean') {
            throw new Error('output.local.enabled must be boolean');
        }
    }

    private static validateRemoteOutput(remote: any): void {
        if (!remote || typeof remote !== 'object') {
            throw new Error('output.remote must be an object');
        }

        ChannelValidator.validateRequired(remote, 'output.remote', ['enabled', 'url', 'stream_key']);

        if (typeof remote.enabled !== 'boolean') {
            throw new Error('output.remote.enabled must be boolean');
        }

        if (!remote.enabled)
            return;

        if (typeof remote.url !== 'string' || !remote.url.trim()) {
            throw new Error('output.remote.url must be a non-empty string');
        }

        if (typeof remote.stream_key !== 'string' || !remote.stream_key.trim()) {
            throw new Error('output.remote.stream_key must be a non-empty string');
        }

        // Validate URL format
        if (!ChannelValidator.isValidUrl(remote.url)) {
            throw new Error('output.remote.url must be a valid URL');
        }
    }

    private static validateSchedule(schedule: any): void {
        if (!Array.isArray(schedule)) {
            throw new Error('channel.schedule must be an array');
        }

        schedule.forEach((item, index) => {
            ChannelValidator.validateScheduleItem(item, `schedule[${index}]`);
        });
    }

    private static validateOverrides(overrides: any): void {
        if (!Array.isArray(overrides)) {
            throw new Error('channel.overrides must be an array');
        }

        overrides.forEach((item, index) => {
            ChannelValidator.validateOverrideItem(item, `overrides[${index}]`);
        });
    }

    private static validateScheduleItem(item: any, prefix: string): void {
        if (!item || typeof item !== 'object') {
            throw new Error(`${prefix} must be an object`);
        }

        const required = [
            'time_type', 'content_type', 'start', 'end',
            'paths', 'ignore_directories', 'extensions',
            'presets', 'sorting', 'overlay', 'source_live'
        ];

        ChannelValidator.validateRequired(item, prefix, required);
        ChannelValidator.validateScheduleCommon(item, prefix);
    }

    private static validateOverrideItem(item: any, prefix: string): void {
        if (!item || typeof item !== 'object') {
            throw new Error(`${prefix} must be an object`);
        }

        const required = [
            'time_type', 'content_type', 'start', 'end',
            'paths', 'ignore_directories', 'extensions',
            'presets', 'sorting', 'overlay', 'source_live'
        ];

        ChannelValidator.validateRequired(item, prefix, required);
        ChannelValidator.validateScheduleCommon(item, prefix);

        // Additional override-specific validations
        if (item.priority !== undefined) {
            if (typeof item.priority !== 'number' || item.priority < 0) {
                throw new Error(`${prefix}.priority must be a non-negative number`);
            }
        }

        if (item.description !== undefined) {
            if (typeof item.description !== 'string') {
                throw new Error(`${prefix}.description must be a string`);
            }
        }
    }

    private static validateScheduleCommon(item: any, prefix: string): void {
        // Validate time_type
        if (!ChannelValidator.isValidTimeType(item.time_type)) {
            throw new Error(`${prefix}.time_type must be one of: daily, weekly, once`);
        }

        // Validate content_type
        if (!ChannelValidator.isValidContentType(item.content_type)) {
            throw new Error(`${prefix}.content_type must be one of: file, live`);
        }

        // Validate time format
        if (typeof item.start !== 'string' || !ChannelValidator.isValidTimeFormat(item.start)) {
            throw new Error(`${prefix}.start must be a valid time format (HH:mm)`);
        }

        if (typeof item.end !== 'string' || !ChannelValidator.isValidTimeFormat(item.end)) {
            throw new Error(`${prefix}.end must be a valid time format (HH:mm)`);
        }

        // Validate arrays
        if (!Array.isArray(item.paths)) {
            throw new Error(`${prefix}.paths must be an array`);
        }

        if (!Array.isArray(item.ignore_directories)) {
            throw new Error(`${prefix}.ignore_directories must be an array`);
        }

        if (!Array.isArray(item.extensions)) {
            throw new Error(`${prefix}.extensions must be an array`);
        }

        if (!Array.isArray(item.presets)) {
            throw new Error(`${prefix}.presets must be an array`);
        }

        // Validate array contents
        ChannelValidator.validateStringArray(item.paths, `${prefix}.paths`);
        ChannelValidator.validateStringArray(item.ignore_directories, `${prefix}.ignore_directories`);
        ChannelValidator.validateStringArray(item.extensions, `${prefix}.extensions`);
        ChannelValidator.validateStringArray(item.presets, `${prefix}.presets`);

        // Validate sorting
        ChannelValidator.validateSorting(item.sorting, `${prefix}.sorting`);

        // validate presets exist
        if (item.presets.length === 0) {
            throw new Error(`${prefix}.presets must contain at least one preset`);
        }

        // validate presets valid
        ChannelValidator.validatePresets(item.presets);


        // // Validate overlay (string or null)
        // if (item.overlay !== null && typeof item.overlay !== OverlayInterface) {
        //     throw new Error(`${prefix}.overlay must be string or null`);
        // }

        // Validate source_live
        ChannelValidator.validateSourceLive(item.source_live, `${prefix}.source_live`);

        // Content type specific validations
        if (item.content_type === 'live' && !item.source_live) {
            throw new Error(`${prefix}.source_live is required when content_type is 'live'`);
        }

        if (item.content_type === 'file' && item.paths.length === 0) {
            throw new Error(`${prefix}.paths cannot be empty when content_type is 'file'`);
        }
    }

    private static validateSorting(sorting: any, prefix: string): void {
        if (!sorting || typeof sorting !== 'object') {
            throw new Error(`${prefix} must be an object`);
        }

        ChannelValidator.validateRequired(sorting, prefix, ['method', 'order']);

        if (!ChannelValidator.isValidSortingMethod(sorting.method)) {
            throw new Error(`${prefix}.method must be one of: date, name, size, random`);
        }

        if (!ChannelValidator.isValidSortingOrder(sorting.order)) {
            throw new Error(`${prefix}.order must be one of: asc, desc`);
        }
    }

    private static validateSourceLive(sourceLive: any, prefix: string): void {
        if (sourceLive === null) return;

        if (!sourceLive || typeof sourceLive !== 'object') {
            throw new Error(`${prefix} must be an object or null`);
        }

        ChannelValidator.validateRequired(sourceLive, prefix, ['url']);

        if (typeof sourceLive.url !== 'string' || !sourceLive.url.trim()) {
            throw new Error(`${prefix}.url must be a non-empty string`);
        }

        if (!ChannelValidator.isValidUrl(sourceLive.url)) {
            throw new Error(`${prefix}.url must be a valid URL`);
        }

        if (sourceLive.input_options !== undefined) {
            if (!Array.isArray(sourceLive.input_options)) {
                throw new Error(`${prefix}.input_options must be an array`);
            }
            ChannelValidator.validateStringArray(sourceLive.input_options, `${prefix}.input_options`);
        }

        if (sourceLive.reconnect_attempts !== undefined) {
            if (typeof sourceLive.reconnect_attempts !== 'number' || sourceLive.reconnect_attempts < 0) {
                throw new Error(`${prefix}.reconnect_attempts must be a non-negative number`);
            }
        }

        if (sourceLive.reconnect_delay !== undefined) {
            if (typeof sourceLive.reconnect_delay !== 'number' || sourceLive.reconnect_delay < 0) {
                throw new Error(`${prefix}.reconnect_delay must be a non-negative number`);
            }
        }
    }

    private static validateStringArray(array: any[], prefix: string): void {
        array.forEach((item, index) => {
            if (typeof item !== 'string') {
                throw new Error(`${prefix}[${index}] must be a string`);
            }
        });
    }

    private static validateRequired(obj: any, objName: string, required: string[]): void {
        for (const field of required) {
            if (obj[field] === undefined) {
                throw new Error(`${objName}.${field} is required`);
            }
        }
    }

    private static isValidTimeType(value: any): value is TimeType {
        return typeof value === 'string' && ['daily', 'weekly', 'once'].includes(value);
    }

    private static isValidContentType(value: any): value is ContentType {
        return typeof value === 'string' && ['file', 'live'].includes(value);
    }

    private static isValidSortingMethod(value: any): value is SortingMethod {
        return typeof value === 'string' && ['date', 'name', 'size', 'random'].includes(value);
    }

    private static isValidSortingOrder(value: any): value is SortingOrder {
        return typeof value === 'string' && ['asc', 'desc'].includes(value);
    }

    private static isValidTimeFormat(time: string): boolean {
        return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
    }

    private static isValidUrl(url: string): boolean {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    private static validatePresets(presets: string[]) {
        for (const preset of presets) {
            if (!StreamPresets.hasPreset(preset)){
                throw new Error(`Preset "${preset}" does not exist in configuration`);
            }
        }

    }
}