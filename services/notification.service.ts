import { Effect } from "effect";
import type { z } from "zod";
import { unserializeNotification } from "~/app/notifications/notification.utils";
import { ExpectedError } from "~/config/exceptions";
import type { notificationIdSchema } from "~/dto/notification.dto";
import { NotificationRepoLayer } from "~/repositories/notification.repo";
import { PaginationService } from "~/services/search/pagination.service";
import type { PaginationQuery } from "./search/primitives";
import { SearchOps } from "./search/sql-search-resolver";


export const getUnreadNotification = (currentUserId: string) => {
  return Effect.gen(function* (_) {
    const notificationRepo = yield* NotificationRepoLayer.Tag;

    const unreadCount = yield* notificationRepo.count(
      SearchOps.and(
        SearchOps.eq("isRead", false),
        SearchOps.eq("userId", currentUserId),
      ),
    );

    return { unreadCount };
  });
};

export const getNotifications = (
  type: "all" | "unread",
  currentUserId: string,
) => {
  return Effect.gen(function* (_) {
    const notificationRepo = yield* NotificationRepoLayer.Tag;
    const paginate = yield* PaginationService;

    const totalNotifications = yield* notificationRepo.getTotalCount(
      type,
      currentUserId,
    );

    const data: PaginationQuery & { userId: string } = {
      ...paginate.query,
      userId: currentUserId,
    };

    const notifications =
      type === "all"
        ? yield* notificationRepo.all(data)
        : yield* notificationRepo.getUnreadMessages(data);

    return {
      data: unserializeNotification(notifications),
      meta: {
        ...paginate.meta,
        total: totalNotifications.count,
        total_pages: Math.ceil(
          totalNotifications.count / paginate.query.pageSize,
        ),
      },
      status: true,
    };
  });
};

export const markAsRead = (
  currentUserId: string,
  type: "all" | "list",
  data?: z.infer<typeof notificationIdSchema>,
) => {
  return Effect.gen(function* (_) {
    const notificationRepo = yield* NotificationRepoLayer.Tag;

    if (type === "list") {
      for (const id of data.ids) {
        yield* notificationRepo.updateNotification(
          { id, userId: currentUserId },
          type,
        );
      }

      return { status: true, message: "Selected notifications marked as read" };
    }

    //mark all as read
    yield* notificationRepo
      .updateNotification({ userId: currentUserId }, type)
      .pipe(Effect.mapError((e) => new ExpectedError(e.toString())));

    return { status: true, message: "All notifications marked as read" };
  });
};

export const deleteNotification = (
  currentUserId: string,
  type: "all" | "list",
  data?: z.infer<typeof notificationIdSchema>,
) => {
  return Effect.gen(function* (_) {
    const notificationRepo = yield* NotificationRepoLayer.Tag;

    if (type === "list") {
      for (const id of data.ids) {
        yield* notificationRepo.delete(
          SearchOps.and(
            SearchOps.eq("id", id),
            SearchOps.eq("userId", currentUserId),
          ),
        );
      }

      return { status: true, message: "Selected notifications deleted" };
    }

    //delete all notification
    yield* notificationRepo.delete(SearchOps.eq("userId", currentUserId));

    return { status: true, message: "Deleted all notification" };
  });
};
