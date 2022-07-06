export interface ChannelMessage {
    id: string;
    name: string;
    url: string;
    metadataUrl: string;
    articleJsonUrl?: string;
    systemId: string;
    tenantId?: string;
    brand: string;
    channelData?: string;
    componentSetInfo: ComponentSetFile;
    customData?: ComponentSetFile;
}

export interface ComponentSetFile {
    url: string;
    eTag: string;
}
