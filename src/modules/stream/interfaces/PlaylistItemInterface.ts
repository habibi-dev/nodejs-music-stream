import {ChannelSortingInterface, ChannelSourceLiveInterface, ContentType} from "./ChannelInterface";
import {OverlayInterface} from "./OverlayInterface";

export interface PlaylistItemInterface {
    id: string;
    startUtc: Date;
    endUtc: Date;
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
