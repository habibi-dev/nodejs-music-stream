export class OverlayValidator {

    static validateOverlay(data: any): void {
        if (!data || typeof data !== 'object') {
            throw new Error('Invalid overlay configuration: must be an object');
        }

        OverlayValidator.validateLogo(data.logo);
        OverlayValidator.validateText(data.text);
    }

    private static validateLogo(logo: any): void {
        if (!logo) {
            throw new Error('Missing logo configuration');
        }

        // Required fields
        OverlayValidator.validateRequired(logo, 'logo', ['enabled', 'path', 'position', 'scale', 'margin']);

        // Type validations
        if (typeof logo.enabled !== 'boolean') {
            throw new Error('logo.enabled must be boolean');
        }

        if (typeof logo.path !== 'string' || !logo.path.trim()) {
            throw new Error('logo.path must be a non-empty string');
        }

        if (!OverlayValidator.isValidPosition(logo.position)) {
            throw new Error('logo.position must be one of: top-left, top-right, bottom-left, bottom-right, center');
        }

        if (typeof logo.scale !== 'string' || !logo.scale.match(/^\d+%$/)) {
            throw new Error('logo.scale must be a percentage string (e.g., "10%")');
        }

        OverlayValidator.validateMargin(logo.margin, 'logo.margin');
    }

    private static validateText(text: any): void {
        if (!text) {
            throw new Error('Missing text configuration');
        }

        OverlayValidator.validateRequired(text, 'text', ['enabled', 'now_playing', 'time']);

        if (typeof text.enabled !== 'boolean') {
            throw new Error('text.enabled must be boolean');
        }

        OverlayValidator.validateNowPlaying(text.now_playing);
        OverlayValidator.validateTime(text.time);
    }

    private static validateNowPlaying(nowPlaying: any): void {
        if (!nowPlaying) {
            throw new Error('Missing text.now_playing configuration');
        }

        const required = ['enabled', 'position', 'size', 'color', 'background', 'padding', 'template'];
        OverlayValidator.validateRequired(nowPlaying, 'text.now_playing', required);

        // Basic validations
        OverlayValidator.validateTextCommon(nowPlaying, 'text.now_playing');

        // Specific validations
        if (typeof nowPlaying.padding !== 'number' || nowPlaying.padding < 0) {
            throw new Error('text.now_playing.padding must be a non-negative number');
        }

        if (typeof nowPlaying.template !== 'string' || !nowPlaying.template.trim()) {
            throw new Error('text.now_playing.template must be a non-empty string');
        }

        if (!nowPlaying.template.includes('{title}')) {
            throw new Error('text.now_playing.template must contain {title} placeholder');
        }
    }

    private static validateTime(time: any): void {
        if (!time) {
            throw new Error('Missing text.time configuration');
        }

        const required = ['enabled', 'position', 'font', 'size', 'color', 'background'];
        OverlayValidator.validateRequired(time, 'text.time', required);

        // Basic validations
        OverlayValidator.validateTextCommon(time, 'text.time');

    }

    private static validateTextCommon(config: any, prefix: string): void {
        if (typeof config.enabled !== 'boolean') {
            throw new Error(`${prefix}.enabled must be boolean`);
        }

        if (!OverlayValidator.isValidPosition(config.position)) {
            throw new Error(`${prefix}.position must be one of: top-left, top-right, bottom-left, bottom-right, center`);
        }

        if (typeof config.font !== 'string' || !config.font.trim()) {
            throw new Error(`${prefix}.font must be a non-empty string`);
        }

        if (typeof config.size !== 'number' || config.size <= 0) {
            throw new Error(`${prefix}.size must be a positive number`);
        }

        if (typeof config.color !== 'string' || !OverlayValidator.isValidColor(config.color)) {
            throw new Error(`${prefix}.background must be in format 0xRRGGBB or 0xRRGGBB@alpha (0<=alpha<=1)`);
        }

        if (typeof config.background !== 'string' || !OverlayValidator.isValidColor(config.background)) {
            throw new Error(`${prefix}.background must be in format 0xRRGGBB or 0xRRGGBB@alpha (0<=alpha<=1)`);
        }
    }

    private static validateMargin(margin: any, field: string): void {
        if (!margin || typeof margin !== 'object') {
            throw new Error(`${field} must be an object`);
        }

        if (typeof margin.x !== 'number' || margin.x < 0) {
            throw new Error(`${field}.x must be a non-negative number`);
        }

        if (typeof margin.y !== 'number' || margin.y < 0) {
            throw new Error(`${field}.y must be a non-negative number`);
        }
    }

    private static validateRequired(obj: any, objName: string, required: string[]): void {
        for (const field of required) {
            if (obj[field] === undefined || obj[field] === null) {
                throw new Error(`${objName}.${field} is required`);
            }
        }
    }

    private static isValidPosition(position: any): boolean {
        const validPositions = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'];
        return typeof position === 'string' && validPositions.includes(position);
    }

    private static isValidColor(color: any): boolean {
        if (typeof color !== 'string') return false;

        // Match format: 0xRRGGBB or 0xRRGGBB@alpha
        const regex = /^0x[0-9A-Fa-f]{6}(@((0(\.\d+)?)|1(\.0+)?))?$/;
        return regex.test(color);
    }

}