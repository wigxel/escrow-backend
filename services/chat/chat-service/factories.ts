import { formatDistance, isValid } from "date-fns";
import { safeArray } from "~/libs/data.helpers";

export type ChannelUser = {
  id: string;
  name: string;
  username: string;
  avatar: string | null;
};

type MessageBase = {
  title: string;
  timestamp: Date;
  format_timestamp: string;
  /** TODO: rename `users` to `participant` */
  users: ChannelUser[];
  last_message?: null | string;
};

export type EnrichUsersChannel = Channel & {
  id: string;
  users: ChannelUser[];
};

export type ChatMessageEvent<TMessage> = {
  type: "added" | "removed" | "modified";
  message: TMessage;
};

export type NoChannel = { channel_type: "none" };

export type GroupChannel = MessageBase & {
  id: string;
  channel_type: "group";
  group_name: string;
  getAvatar: () => string;
};

export type DirectChannel = MessageBase & {
  id: string;
  channel_type: "direct";
  timestamp: Date;
  getAvatar: (id: string) => string;
};

// Group & Direct
export type Channel = GroupChannel | DirectChannel | NoChannel;

export type ValidChannel = Exclude<Channel, { channel_type: "none" }>;

function NoChannelFactory(): NoChannel {
  return { channel_type: "none" };
}

export function ChannelFactory(data: Record<string, unknown>): Channel {
  if (!["direct", "group"].includes(<string>data?.channel_type))
    return NoChannelFactory();

  if (data.channel_type === "group") return GroupChannel(data);

  return DirectChannel(data);
}

export function parseChannel(data: Channel): Channel {
  const Factories = {
    group: GroupChannelFactory,
    direct: DirectChannelFactory,
  };

  if (!(data.channel_type in Factories)) return NoChannelFactory();
  if (data.channel_type === "none") return NoChannelFactory();

  // @ts-expect-error Not sure why this happens
  return Factories[data.channel_type](data);
}

function GroupChannel(data: Record<string, unknown>): GroupChannel {
  // console.log(`GroupChannel ${typeof(data) === 'object' ? JSON.stringify(data) : data}`);
  return GroupChannelFactory({
    group_avatar: <string | null>data.group_avatar,
    id: <string>data?.channel_id,
    channel_type: "group",
    group_name: <string>data?.group_name || "--",
    users: safeArray(data?.users as ChannelUser[]),
    last_message: <string>data?.last_message ?? null,
    // @ts-expect-error
    timestamp: new Date((data?.timestamp?.seconds || 0) * 1000),
  });
}

function DirectChannel(data: Record<string, unknown>): DirectChannel {
  // console.log(`DirectChannel ${typeof(data) === 'object' ? JSON.stringify(data) : data}`);
  return DirectChannelFactory({
    id: <string>data?.channel_id ?? "",
    // @ts-expect-error Needs refactor
    timestamp: new Date((data?.timestamp?.seconds || 0) * 1000),
    channel_type: "direct",
    last_message: <string>data?.last_message,
    users: safeArray(data?.users as ChannelUser[]),
  });
}

function DirectChannelFactory(
  data: Omit<DirectChannel, "format_timestamp" | "title" | "getAvatar">,
): DirectChannel {
  return {
    ...data,
    get title(): string {
      const other_user = this.users[0]; // TODO: Find the other user
      return other_user?.name ?? "Anonymous";
      // return this.users.find(user => user.id === ownerId ? user.name :)
    },
    get format_timestamp(): string {
      return format_timestamp(this.timestamp);
    },
    getAvatar(id: string) {
      const match = this.users.find((e) => e.id === id);

      return match?.avatar ?? "NO_DEFAULT_AVATAR_URL";
    },
  };
}

function GroupChannelFactory(
  data: Omit<GroupChannel, "format_timestamp" | "title" | "getAvatar"> & {
    group_avatar: string | null;
  },
): GroupChannel {
  return {
    ...data,
    get title() {
      return this.group_name;
    },
    get format_timestamp() {
      return format_timestamp(this.timestamp);
    },
    getAvatar(): string {
      return data.group_avatar ?? "DEFAULT_AVATAR";
    },
  };
}

function format_timestamp(timestamp: Date) {
  if (!isValid(timestamp)) return "--";

  return formatDistance(timestamp, new Date());
}
