import { and, count, desc, eq } from "drizzle-orm";
import { Context, Effect, Layer } from "effect";
import { head } from "effect/Array";
import { runDrizzleQuery } from "~/libs/query.helpers";
import { type Notification, notificationTable } from "~/migrations/schema";
import { DrizzleRepo } from "~/services/repository/RepoHelper";
import type { PaginationQuery } from "~/services/search/primitives";

class NotificationRepository extends DrizzleRepo(notificationTable, "id") {
  getTotalCount(type: "all" | "unread", currentUserId: string) {
    return runDrizzleQuery((db) => {
      if (type === "all") {
        return db
          .select({ count: count() })
          .from(notificationTable)
          .where(eq(notificationTable.userId, currentUserId));
      }

      return db
        .select({ count: count() })
        .from(notificationTable)
        .where(
          and(
            eq(notificationTable.userId, currentUserId),
            eq(notificationTable.isRead, false),
          ),
        );
    }).pipe(
      Effect.map((d) => d),
      Effect.flatMap(head),
    );
  }

  // @ts-expect-error
  all(params: Partial<PaginationQuery> & Notification) {
    return runDrizzleQuery((db) => {
      return db.query.notificationTable.findMany({
        where: eq(notificationTable.userId, params.userId),
        offset: params.pageNumber * params.pageSize,
        limit: params.pageSize,
        orderBy: [desc(notificationTable.createdAt)],
      });
    });
  }

  getUnreadMessages(params: Partial<PaginationQuery> & Notification) {
    return runDrizzleQuery((db) => {
      return db.query.notificationTable.findMany({
        where: and(
          eq(notificationTable.userId, params.userId),
          eq(notificationTable.isRead, false),
        ),
        offset: params.pageNumber * params.pageSize,
        limit: params.pageSize,
        orderBy: [desc(notificationTable.createdAt)],
      });
    });
  }

  updateNotification(params: Notification, type: "all" | "list") {
    if (type === "list") {
      return runDrizzleQuery((db) => {
        return db
          .update(notificationTable)
          .set({ isRead: true })
          .where(
            and(
              eq(notificationTable.id, params.id),
              eq(notificationTable.userId, params.userId),
            ),
          )
          .returning();
      });
    }

    return runDrizzleQuery((db) => {
      return db
        .update(notificationTable)
        .set({ isRead: true })
        .where(and(eq(notificationTable.userId, params.userId)))
        .returning();
    });
  }
}

export class NotificationRepo extends Context.Tag("NotificationRepo")<
  NotificationRepo,
  NotificationRepository
>() {}

export const NotificationRepoLayer = {
  Tag: NotificationRepo,
  Repo: {
    Live: Layer.succeed(NotificationRepo, new NotificationRepository()),
  },
};
