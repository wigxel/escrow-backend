import type { ChatMessageEvent } from "./factories";
import type { FirebaseChatBackend } from "./firebase-chat-backend";

export interface TypingEvent {
  user_id: string;
  typing: boolean;
  channel_id: string;
}

export class ChatObserver<T extends { id: string }> {
  constructor(
    private chatService: FirebaseChatBackend<T>,
    private getCurrentUserId: () => string | undefined,
  ) {}

  addEventListener(
    channel_id: string,
    type: "typing",
    handlerFn: (event: TypingEvent) => void,
    config: { signal: AbortSignal },
  ): void;
  addEventListener(
    channel_id: string,
    type: "messages",
    handlerFn: (event: ChatMessageEvent<T>) => void,
    config: { signal: AbortSignal; fromTimestamp?: Date },
  ): void;
  addEventListener(
    channel_id: string,
    type: string,
    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    handlerFn: (event: any) => void,
    config: { signal: AbortSignal; fromTimestamp?: Date },
  ) {
    if (type === "typing") {
      const unsubscribe = this.chatService.observeTypingEvents({
        channel_id,
        handlerFn: handlerFn,
        getCurrentUserId: () => this.getCurrentUserId(),
      });
      config.signal.addEventListener("abort", () => unsubscribe());
    }

    if (type === "messages") {
      const unsubscribe = this.chatService.observeMessages({
        channel_id,
        handlerFn: handlerFn,
        fromTimestamp: new Date(),
      });
      config.signal.addEventListener("abort", () => unsubscribe());
    }
  }
}
