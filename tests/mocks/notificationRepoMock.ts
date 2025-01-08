import { Effect, Layer } from "effect";
import { NotificationRepo } from "~/repositories/notification.repo";
import { extendMockImplementation } from "./helpers";

const list = Effect.succeed([
  {
    message: "MOCK_MESSAGE",
    id: 12,
    createdAt: new Date(2024, 7, 12),
    userId: "MOCK_USER_ID",
    tag: "",
    meta: '{"user":{"id":"user-id","role":"BUYER"}}',
    title: "James Wholock",
    isRead: false,
  },
  {
    message: "MOCK_MESSAGE",
    id: 1,
    createdAt: new Date(2024, 7, 12),
    userId: "MOCK_USER_ID",
    tag: "",
    meta: '{"user":{"id":"user-id","role":"BUYER"}}',
    title: "Tina Wholock",
    isRead: true,
  },
]);

const NotificationMock = {
  create: (data: Notification) => {
    return list;
  },
  getTotalCount: (type: "all" | "unread", currentUserId: string) =>
    Effect.succeed({ count: 1 }),

  all: (params) => {
    return list;
  },

  getUnreadMessages: (params) => {
    return Effect.succeed([
      {
        message: "MOCK_MESSAGE",
        id: 1,
        createdAt: new Date(2024, 7, 12),
        userId: "MOCK_USER_ID",
        tag: "",
        meta: '{"user":{"id":"user-id","role":"BUYER"}}',
        title: "Tina Wholock",
        isRead: false,
      },
    ]);
  },

  count: (params) => {
    return Effect.succeed(1);
  },

  updateNotification: (params: Notification, type: "all" | "list") => {
    return list;
  },

  delete: (params) => {
    return Effect.void;
  },

  find: () => {
    throw new Error("Function not implemented.");
  },

  firstOrThrow: () => {
    throw new Error("Function not implemented.");
  },

  update: () => {
    throw new Error("Function not implemented.");
  },
};

export const extendNotificationRepo = extendMockImplementation(
  NotificationRepo,
  () => NotificationMock,
);
export const NotificationRepoTest = Layer.succeed(
  NotificationRepo,
  NotificationMock,
);
