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

export interface SNSMessageAttribute {
    Type: string;
    Value: string;
}

export interface SNSMessageAttributes {
    [name: string]: SNSMessageAttribute;
}

export interface SNSMessage {
    SignatureVersion: string;
    Timestamp: string;
    Signature: string;
    SigningCertUrl: string;
    MessageId: string;
    Message: string;
    MessageAttributes: SNSMessageAttributes;
    Type: string;
    UnsubscribeUrl: string;
    TopicArn: string;
    Subject: string;
}
