import { Context, Layer } from "effect";
import type { ChatBackendInterface } from "~/services/chat/chat-service/firebase-chat-backend";

export interface ChatServiceInterface
  extends ChatBackendInterface<{ id: string }> {}

  //@ts-expect-error
const mock: ChatServiceInterface = {
  startConversation(params) {
    return Promise.resolve()
  },
  sendMessage(params) {
    return Promise.resolve()
  },
};

export class ChatService extends Context.Tag("ChatService")<
  ChatService,
  ChatServiceInterface
>() {}

export const ChatServiceTestLive = Layer.succeed(ChatService, mock);
