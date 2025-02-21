import { Effect } from "effect";
import { extendNotificationRepo } from "./mocks/notificationRepoMock";
import {
  deleteNotification,
  getNotifications,
  getUnreadNotification,
  markAsRead,
} from "~/services/notification.service";
import { runTest } from "./mocks/app";

describe("notification serivce", () => {
  describe("get unread notification count", () => {
    test("should return number of unread notifications", async () => {
      const program = getUnreadNotification("current-user-id");
      const result = await runTest(program);
      expect(result).toMatchInlineSnapshot(`
        {
          "data": {
            "unreadCount": 1,
          },
          "status": "success",
        }
      `);
    });
  });

  describe("get notifications", () => {
    test("should return all notifcation", async () => {
      const program = getNotifications("all", "current-user-id");
      const result = await runTest(program);

      expect(result).toMatchInlineSnapshot(`
        {
          "data": [
            {
              "createdAt": 2024-08-11T23:00:00.000Z,
              "id": 12,
              "isRead": false,
              "message": "MOCK_MESSAGE",
              "meta": {
                "user": {
                  "id": "user-id",
                  "role": "BUYER",
                },
              },
              "tag": "",
              "title": "James Wholock",
              "userId": "MOCK_USER_ID",
            },
            {
              "createdAt": 2024-08-11T23:00:00.000Z,
              "id": 1,
              "isRead": true,
              "message": "MOCK_MESSAGE",
              "meta": {
                "user": {
                  "id": "user-id",
                  "role": "BUYER",
                },
              },
              "tag": "",
              "title": "Tina Wholock",
              "userId": "MOCK_USER_ID",
            },
          ],
          "meta": {
            "current_page": 1,
            "per_page": 5,
            "total": 1,
            "total_pages": 1,
          },
          "status": "success",
        }
      `)
    });

    test("should return only read notifications", async () => {
      const program = getNotifications("unread", "current-user-id");
      const result = await runTest(program);

      expect(result).toMatchInlineSnapshot(`
        {
          "data": [
            {
              "createdAt": 2024-08-11T23:00:00.000Z,
              "id": 1,
              "isRead": false,
              "message": "MOCK_MESSAGE",
              "meta": {
                "user": {
                  "id": "user-id",
                  "role": "BUYER",
                },
              },
              "tag": "",
              "title": "Tina Wholock",
              "userId": "MOCK_USER_ID",
            },
          ],
          "meta": {
            "current_page": 1,
            "per_page": 5,
            "total": 1,
            "total_pages": 1,
          },
          "status": "success",
        }
      `);
    });
  });

  describe.skip("Mark as read", () => {
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
      expect(result).toMatchInlineSnapshot();
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

  describe.skip("Delete notification", () => {
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
