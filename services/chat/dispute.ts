import {
  type ChatBackendInterface,
  FirebaseChatBackend,
} from "../../services/chat/chat-service/firebase-chat-backend";
import { DisputeChatPaths } from "../../services/chat/chat-service/shared";
import { Context, Effect, Layer, pipe } from "effect";
import { firestoreRef } from "../../services/chat/config/firebase.config";

export interface ChatServiceInterface
  extends ChatBackendInterface<{ id: string }> {}

export class ChatService extends Context.Tag("ChatService")<
  ChatService,
  ChatServiceInterface
>() {}

export const ChatServiceLive = pipe(
  firestoreRef,
  Effect.map((ref) => {
    return Layer.succeed(
      ChatService,
      new FirebaseChatBackend(ref, DisputeChatPaths),
    );
  }),
  Layer.unwrapScoped,
);
