import {
  type DocumentChange,
  DocumentReference,
  type Firestore,
  type QuerySnapshot,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  setDoc,
  where,
} from "@firebase/firestore";
import { nanoid } from "nanoid";
import { uniqBy } from "ramda";
import type { TypingEvent } from "./chat-observer";
import {
  type Channel,
  ChannelFactory,
  type ChannelUser,
  type ChatMessageEvent,
  type EnrichUsersChannel,
} from "./factories";
import type { FirebaseStoragePaths } from "./shared";
import { safeArray, safeObj } from "~/libs/data.helpers";

export class FirebaseChatBackend<TMessage extends { id: string }>
  implements ChatBackendInterface<TMessage>
{
  constructor(
    public readonly db: Firestore,
    private path: FirebaseStoragePaths,
  ) {}

  private async createChannel(params: {
    id: string;
    type: StartConversationParams["type"];
    userIds: string[];
  }) {
    const reference = doc(this.db, this.path.channel(params.id));
    const referenceUser = (user_id: string) => {
      return doc(this.db, this.path.user(user_id));
    };

    await setDoc(reference, {
      channel_id: params.id,
      channel_type: params.type,
      created_at: new Date(),
      user_ids: params.userIds,
      users: params.userIds.map(referenceUser),
    });
  }

  async loadConversations(
    user_id: string,
    signal: AbortSignal,
  ): Promise<EnrichUsersChannel[]> {
    const { root } = this.path;

    const maybeAbort = () => signal.throwIfAborted();

    // @ts-expect-error
    return innerLoadChannels(this.db).then((channels) => {
      console.assert(
        Array.isArray(channels),
        `Invalid contact. Expecting array got: (${channels?.constructor?.name})`,
        channels,
      );
      if (!Array.isArray(channels)) return [];
      return channels;
    });

    async function innerLoadChannels(db: Firestore): Promise<Channel[]> {
      const channels_ref = collection(db, root);
      const ref = query(
        channels_ref,
        where("user_ids", "array-contains", user_id),
      );
      maybeAbort();
      const snapshot = await getDocs(ref);
      logSnapshot(snapshot);
      maybeAbort();
      const all_channels = await Promise.all(
        snapshot.docs.map(async (doc) => {
          try {
            maybeAbort();

            const channel_data = doc.data();
            const users = [];

            if (channel_data.channel_id) {
              for await (const ref of safeArray(channel_data.users)) {
                if (!(ref instanceof DocumentReference)) continue;
                const user_data = (await getDoc(ref)).data();
                users.push(user_data);
              }
            }

            return ChannelFactory(
              Object.assign(channel_data, {
                users,
              }),
            );
          } catch (err) {
            console.log("Error loading channels", err);
          }
          return { channel_type: "none" } as const;
        }),
      );
      maybeAbort();
      return all_channels.filter((e) => e.channel_type !== "none") ?? [];
    }
  }

  async startConversation(params: StartConversationParams): Promise<void> {
    const { type, participants: _part } = params;
    const participants = safeArray(_part);
    const channel_id = params.channel_id ?? nanoid();

    if (type === "direct") {
      if (participants.length !== 2) throw new Error("User not valid");

      // add user information
      await Promise.allSettled(participants.map((e) => this.addUser(e)));

      // create a channel
      await this.createChannel({
        id: channel_id,
        type: "direct",
        userIds: participants.map((e) => e.id),
      });

      return;
    }

    if (type === "group") {
      // add user information
      await Promise.allSettled(participants.map((e) => this.addUser(e)));

      // create a channel
      await this.createChannel({
        id: channel_id,
        type: "group",
        userIds: participants.map((e) => e.id),
      });
    }
  }

  private cleanMessage(data: unknown): Record<string, unknown> {
    const ref = safeObj(data);
    for (const prop in ref) {
      // transform `undefined` values to `null`
      if (typeof ref[prop] === "undefined") {
        // @ts-expect-error
        ref[prop] = null;
      }
    }
    return ref;
  }

  async sendMessage(params: {
    channel_id: string;
    message: TMessage;
  }) {
    // console.log("[FireS][EVENTS] Sending message", params);
    const document = doc(
      this.db,
      this.path.message(params.channel_id, params.message.id),
    );

    await setDoc(document, this.cleanMessage(params.message));
  }

  async sendTyping(params: {
    channel_id: string;
    senderId: string;
    isTyping: boolean;
  }): Promise<void> {
    const document = doc(
      this.db,
      this.path.user_activity(params.channel_id, params.senderId),
    );

    const payload = {
      typing: params.isTyping,
      user_id: params.senderId,
      channel_id: params.channel_id,
      last_updated_at: new Date(),
    };

    await setDoc(document, payload);
  }

  async addUser(user_data: ChannelUser) {
    const ref = doc(this.db, this.path.user(user_data.id));
    await setDoc(ref, user_data);
  }

  /** checks if a channel exists by the number of participants **/
  async channelExistsWhere(params: {
    channel_type: Channel["channel_type"];
    participants: string[];
  }): Promise<boolean> {
    const { channel_type: type, participants } = params;

    if (type === "direct" && participants.length !== 2) {
      throw new Error("Direct conversations must have 2 participants");
    }

    const reference = query(
      collection(this.db, this.path.root),
      where(
        "user_ids",
        "array-contains",
        params.participants.map((e) => e),
      ),
    );

    const snapshots = await getDocs(reference);
    for (const doc of snapshots.docChanges()) {
      const record = ChannelFactory(doc.doc.data());
      if (record.channel_type !== "direct") continue;
      // conversation must have only 2 participants
      if (record.users.length !== 2) continue;

      return true;
    }

    return false;
  }

  /** CLIENT ONLY **/
  observeTypingEvents(params: {
    channel_id: string;
    getCurrentUserId: () => string | undefined;
    handlerFn: (event: TypingEvent) => void;
  }) {
    const { channel_id } = params;

    const path = this.path.activity_path(channel_id);
    const ref = query(
      collection(this.db, path),
      where("last_updated_at", ">=", new Date()),
    );

    return onSnapshot(ref, handleTypingEvent, console.error);
    function handleTypingEvent(doc: QuerySnapshot) {
      const current_user_id = params.getCurrentUserId();

      for (const rec of Array.from(doc.docChanges())) {
        const typeEvent: TypingEvent = rec.doc.data() as TypingEvent;

        if (["added", "modified"].includes(rec.type)) {
          const isCurrentUserTyping = typeEvent.user_id === current_user_id;

          if (isCurrentUserTyping) {
            console.info("[FireS][Typing] Ignoring my typing events");
            continue;
          }

          if (typeEvent.typing) {
            console.log(
              `[FireS][Typing] Receiving typing event from ${typeEvent.user_id} in ${typeEvent.channel_id}`,
            );
            params.handlerFn(typeEvent);
          }
        }
      }
    }
  }

  /** CLIENT ONLY **/
  *messageFromSnapshot(channel_id: string, docs: DocumentChange[]) {
    const new_messages = uniqBy((item) => `${item.doc.id}/${item.type}`, docs);
    console.log(`[${channel_id}][FireS][Message] All Messages`, new_messages);
    for (const entry of new_messages) {
      yield {
        type: entry.type,
        message: entry.doc.data() as TMessage,
      };
    }
  }

  /** CLIENT ONLY **/
  async *loadMessages(params: {
    channel_id: string;
    fromTimestamp: Date;
  }) {
    const { channel_id, fromTimestamp } = params;
    console.log(`[FireS][${channel_id}] Loading initial messages`);

    const path = this.path.messages(channel_id);
    const collection_ref = collection(this.db, path);
    const old_messages_ref = query(
      collection_ref,
      where("createdTime", "<", fromTimestamp),
      orderBy("createdTime", "asc"),
    );

    const snapshots = await getDocs(old_messages_ref);
    const old_messages = this.messageFromSnapshot(
      channel_id,
      snapshots.docChanges(),
    );

    for (const item of old_messages) {
      yield item;
    }

    return;
  }

  /** CLIENT ONLY **/
  observeMessages(params: {
    channel_id: string;
    fromTimestamp: Date;
    handlerFn: (data: ChatMessageEvent<TMessage>) => void;
  }) {
    const { channel_id, fromTimestamp } = params;

    const path = this.path.messages(channel_id);
    const collection_ref = collection(this.db, path);
    const new_message_ref = query(
      collection_ref,
      where("createdTime", ">=", fromTimestamp),
      orderBy("createdTime", "asc"),
    );

    console.debug(`[FireS][${channel_id}] Observing New Messages`);
    const unsubscribe = onSnapshot(
      new_message_ref,
      (doc) => {
        const events = this.messageFromSnapshot(channel_id, doc.docChanges());
        for (const event of events) params.handlerFn(event);
      },
      (error) =>
        console.error(`[FireS][${channel_id}] Error: ${error.message}`),
    );

    return () => unsubscribe();
  }
}

type StartConversationParams =
  | {
      channel_id?: string;
      participants?: ChannelUser[];
      type: "group";
    }
  | {
      channel_id?: string;
      participants?: [ChannelUser, ChannelUser];
      type: "direct";
    };

const logSnapshot = (snapshot: QuerySnapshot) =>
  console.log(
    ">>> Snapshot",
    snapshot.docChanges().map((e) => e.doc.data()),
  );

type UnsubscribeFn = () => void;

export interface ChatBackendInterface<TMessage extends { id: string }> {
  loadConversations(
    user_id: string,
    signal: AbortSignal,
  ): Promise<EnrichUsersChannel[]>;

  startConversation(params: StartConversationParams): Promise<void>;

  sendMessage(params: {
    channel_id: string;
    message: TMessage;
  }): Promise<void>;

  sendTyping(params: {
    channel_id: string;
    senderId: string;
    isTyping: boolean;
  }): Promise<void>;

  addUser(user_data: ChannelUser): Promise<void>;

  /** checks if a channel exists by the number of participants **/
  channelExistsWhere(params: {
    channel_type: Channel["channel_type"];
    participants: string[];
  }): Promise<boolean>;

  observeTypingEvents(params: {
    channel_id: string;
    getCurrentUserId: () => string | undefined;
    handlerFn: (event: TypingEvent) => void;
  }): UnsubscribeFn;
}
