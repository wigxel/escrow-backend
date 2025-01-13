import { Effect } from "effect";
import { extendNotificationRepo } from "./mocks/notificationRepoMock";
import {
  deleteNotification,
  getNotifications,
  markAsRead,
  sendNotification,
} from "~/services/notification.service";
import { runTest } from "./mocks/app";

describe("notification serivce", () => {
  describe("send notification", () => {
    const notify = new NotificationSetup("notification");
    const createMessage = notify.createMessage({
      type: "new",
      receiverId: "user-id",
      msg: { title: "title", message: "message" },
    });

    test("should add new notification", async () => {
      let created = false;
      const NotificationRepo = extendNotificationRepo({
        create(data) {
          created = true;
          return Effect.succeed([
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
          ]);
        },
      });

      const program = sendNotification(createMessage);
      const result = await runTest(Effect.provide(program, NotificationRepo));
      expect(created).toBeTruthy();
      expect(result.status).toBeTruthy;
    });
  });

  describe("get notifications", () => {
    test("should return all notifcation", async () => {
      const program = getNotifications("all", "current-user-id");
      const result = await runTest(program);

      expect(result.data).toMatchObject([{ isRead: false }, { isRead: true }]);
      expect(result.status).toBeTruthy();
      expect(result.meta.total).toBeTypeOf("number");
    });
    test("should return only read notifications", async () => {
      const program = getNotifications("unread", "current-user-id");
      const result = await runTest(program);

      expect(result.data).toMatchObject([{ isRead: false }]);
      expect(result.meta.total).toBeTypeOf("number");
      expect(result.status).toBeTruthy();
    });
  });

  describe("Mark as read", () => {
    const notificationList = [
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
    ];
    test("should mark lists of notifications as read", async () => {
      let updatedCount = 0;
      const data = { ids: [1, 6] };
      const notificationRepo = extendNotificationRepo({
        updateNotification(params, type) {
          updatedCount += 1;
          return Effect.succeed(notificationList);
        },
      });
      const program = markAsRead("current-user-id", "list", data);
      const result = await runTest(Effect.provide(program, notificationRepo));
      expect(updatedCount).toBe(data.ids.length);
      expect(result).toMatchInlineSnapshot(`
        {
          "message": "Selected notifications marked as read",
          "status": true,
        }
      `);
    });

    test("should mark all notification as read", async () => {
      let updatedCount = 0;
      const notificationRepo = extendNotificationRepo({
        updateNotification(params, type) {
          updatedCount += 1;
          return Effect.succeed(notificationList);
        },
      });
      const program = markAsRead("current-user-id", "all");
      const result = await runTest(Effect.provide(program, notificationRepo));
      expect(updatedCount).toBe(1);
      expect(result).toMatchInlineSnapshot(`
        {
          "message": "All notifications marked as read",
          "status": true,
        }
      `);
    });
  });

  describe("Delete notification", () => {
    test("should delete list of notifications", async () => {
      let deletedCount = 0;
      const data = { ids: [1, 6] };
      const notificationRepo = extendNotificationRepo({
        delete(params) {
          deletedCount += 1;
          return Effect.succeed([{}]);
        },
      });
      const program = deleteNotification("current-user-id", "list", data);
      const result = await runTest(Effect.provide(program, notificationRepo));
      expect(deletedCount).toBe(data.ids.length);
      expect(result).toMatchInlineSnapshot(`
        {
          "message": "Selected notifications deleted",
          "status": true,
        }
      `);
    });

    test("should delete all notification", async () => {
      let deletedCount = 0;
      const notificationRepo = extendNotificationRepo({
        delete(params) {
          deletedCount += 1;
          return Effect.succeed([{}]);
        },
      });
      const program = deleteNotification("current-user-id", "all");
      const result = await runTest(Effect.provide(program, notificationRepo));
      expect(deletedCount).toBe(1);
      expect(result).toMatchInlineSnapshot(`
        {
          "message": "Deleted all notification",
          "status": true,
        }
      `);
    });
  });
});
