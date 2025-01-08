import type { Unsubscribe } from "@firebase/firestore";
import type { TypingEvent } from "@repo/shared/src/chat-service/chat-observer";
import type {
  Channel,
  ChannelUser,
  EnrichUsersChannel,
} from "@repo/shared/src/chat-service/factories";
import { Layer } from "effect";
import {
  ChatService,
  type ChatServiceInterface,
} from "~/services/chat/dispute";

class FakeChatService implements ChatServiceInterface {
  loadConversations(
    user_id: string,
    signal: AbortSignal,
  ): Promise<EnrichUsersChannel[]> {
    throw new Error("Method not implemented.");
  }

  startConversation(
    params:
      | { channel_id?: string; participants?: ChannelUser[]; type: "group" }
      | {
          channel_id?: string;
          participants?: [ChannelUser, ChannelUser];
          type: "direct";
        },
  ): Promise<void> {
    throw new Error("Method not implemented.");
  }

  sendMessage(params: {
    channel_id: string;
    message: { id: string };
  }): Promise<void> {
    throw new Error("Method not implemented.");
  }

  sendTyping(params: {
    channel_id: string;
    senderId: string;
    isTyping: boolean;
  }): Promise<void> {
    throw new Error("Method not implemented.");
  }

  addUser(user_data: ChannelUser): Promise<void> {
    throw new Error("Method not implemented.");
  }

  channelExistsWhere(params: {
    channel_type: Channel["channel_type"];
    participants: string[];
  }): Promise<boolean> {
    throw new Error("Method not implemented.");
  }

  observeTypingEvents(params: {
    channel_id: string;
    getCurrentUserId: () => string | undefined;
    handlerFn: (event: TypingEvent) => void;
  }): Unsubscribe {
    throw new Error("Method not implemented.");
  }
}

export const ChatServiceTest = Layer.succeed(
  ChatService,
  new FakeChatService(),
);
