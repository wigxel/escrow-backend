/** The chat paths consist of here the different records will be stored and observed in firebase/firestore **/
// create a validator for this type
export type FirebaseStoragePaths = {
  // Rule: root should be a word
  root: string;
  channel: (channel_id: string) => string;
  messages: (channel_id: string) => string;
  message: (channel_id: string, message_id: string) => string;
  activity_path: (channel_id: string) => string;
  user: (user_id: string) => string;
  user_activity: (channel_id: string, sender_id: string) => string;
};

export const PlatformChatPaths: FirebaseStoragePaths = {
  root: "channels",
  channel(channel_id: string) {
    return `/channels/${channel_id}`;
  },
  messages(channel_id: string) {
    return `channels/${channel_id}/messages`;
  },
  message(channel_id: string, message_id: string) {
    return `channels/${channel_id}/messages/${message_id}`;
  },
  activity_path(channel_id: string) {
    return `channels/${channel_id}/activity`;
  },
  user: (user_id: string) => `/users/${user_id}` as const,
  user_activity: (channel_id: string, sender_id: string) =>
    `channels/${channel_id}/activity/${sender_id}/`,
};

export const DisputeChatPaths: FirebaseStoragePaths = {
  root: "/disputes",
  channel(channel_id: string) {
    return `${this.root}/${channel_id}`;
  },
  messages(channel_id: string) {
    return `${this.root}/${channel_id}/messages`;
  },
  message(channel_id: string, message_id: string) {
    return `${this.root}/${channel_id}/messages/${message_id}`;
  },
  activity_path(channel_id: string) {
    return `${this.root}/${channel_id}/activity`;
  },
  user(user_id: string) {
    return `/users/${user_id}` as const;
  },
  user_activity(channel_id: string, sender_id: string) {
    return `${this.root}/${channel_id}/activity/${sender_id}/`;
  },
};
