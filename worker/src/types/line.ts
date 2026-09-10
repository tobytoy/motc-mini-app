export interface LineWebhookPayload {
  destination?: string;
  events: LineEvent[];
}

export type LineEventType =
  | "message"
  | "follow"
  | "unfollow"
  | "join"
  | "leave"
  | "memberJoined"
  | "memberLeft"
  | "postback"
  | "beacon";

export interface LineSource {
  type: "user" | "group" | "room";
  userId?: string;
  groupId?: string;
  roomId?: string;
}

export interface LineTextMessage {
  id: string;
  type: "text";
  text: string;
}

export interface LineLocationMessage {
  id: string;
  type: "location";
  title?: string;
  address?: string;
  latitude: number;
  longitude: number;
}

export interface LineGenericMessage {
  id: string;
  type: string;
  [key: string]: unknown;
}

export type LineMessage = LineTextMessage | LineLocationMessage | LineGenericMessage;

export interface LineEvent {
  type: LineEventType;
  mode?: "active" | "standby";
  timestamp: number;
  source: LineSource;
  webhookEventId?: string;
  deliveryContext?: {
    isRedelivery: boolean;
  };
  replyToken?: string;
  message?: LineMessage;
  postback?: {
    data: string;
    params?: Record<string, unknown>;
  };
}

export interface LineFlexMessage {
  type: "flex";
  altText: string;
  contents: Record<string, unknown>;
  quickReply?: LineQuickReply;
}

export type OutgoingLineMessage =
  | { type: "text"; text: string; quickReply?: LineQuickReply }
  | LineFlexMessage;

export interface LineQuickReply {
  items: Array<{
    type: "action";
    imageUrl?: string;
    action: {
      type: "message" | "postback" | "uri" | "location";
      label: string;
      text?: string;
      data?: string;
      displayText?: string;
      uri?: string;
    };
  }>;
}
