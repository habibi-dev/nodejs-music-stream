import {OverlayInterface} from "./OverlayInterface";

export type TimeType = 'daily' | 'weekly' | 'once';
export type ContentType = 'file' | 'live';
export type SortingMethod = 'date' | 'name' | 'size' | 'random';
export type SortingOrder = 'asc' | 'desc';

export interface ChannelLocalOutputInterface {
    enabled: boolean;
}

export interface ChannelRemoteOutputInterface {
    enabled: boolean;
    url: string;
    stream_key: string;
}

export interface ChannelOutputInterface {
    local: ChannelLocalOutputInterface;
    remote: ChannelRemoteOutputInterface;
}

export interface ChannelSortingInterface {
    method: SortingMethod;
    order: SortingOrder;
}

export interface ChannelSourceLiveInterface {
    url: string;
    input_options?: string[];
    reconnect_attempts?: number;
    reconnect_delay?: number;
}

export interface ChannelScheduleItemInterface {
    time_type: TimeType;
    content_type: ContentType;
    start: string;
    end: string;
    paths: string[];
    ignore_directories: string[];
    extensions: string[];
    presets: string[];
    sorting: ChannelSortingInterface;
    overlay: OverlayInterface | null;
    source_live: ChannelSourceLiveInterface | null;
}

export interface ChannelInterface {
    name: string;
    enabled: boolean;
    output: ChannelOutputInterface;
    schedule: ChannelScheduleItemInterface[];
    overrides: ChannelScheduleItemInterface[];
}