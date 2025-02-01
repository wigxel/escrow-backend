import cuid2 from "@paralleldrive/cuid2";
import { createTextMessage } from "@repo/shared/src/chat-service/utils";
import { Effect, pipe } from "effect";
import { head } from "effect/Array";
import { toLower } from "ramda";
import { DisputeInviteNotification } from "~/app/notifications/dispute-invite";
import { DisputeLeaveNotification } from "~/app/notifications/dispute-leave";
import {
  NotificationSetup,
  type TNotificationMessage,
} from "~/app/notifications/notification.utils";
import { ExpectedError, PermissionError } from "~/config/exceptions";
import { NotificationFacade } from "~/layers/notification/layer";
import type { SessionUser } from "~/layers/session-provider";
import { sessionUser } from "~/migrations/schema";
import { DisputeRepoLayer } from "~/repositories/dispute.repo";
import { DisputeMembersRepoLayer } from "~/repositories/disputeMember.repo";
import { DisputeMessagesRepoLayer } from "~/repositories/disputeMessage.repo";
import { DisputeReadReceiptRepoLayer } from "~/repositories/disputeReadReceipt.repo";
import { OrderRepoLayer } from "~/repositories/order.repository";
import { UserRepo, UserRepoLayer } from "~/repositories/user.repository";
import { ChatService } from "~/services/chat/dispute";
import { PaginationService } from "~/services/search/pagination.service";
import { canTransitionDisputeStatus } from "~/services/dispute/dispute.util";
import { sendNotification } from "./notification.service";
import { SearchOps } from "./search/sql-search-resolver";

export const createDispute = (params: {
  currentUser: SessionUser;
  disputeData: { orderId: string; reason: string };
}) => {
  return Effect.gen(function* (_) {
    const disputeRepo = yield* DisputeRepoLayer.Tag;
    const disputeMembersRepo = yield* DisputeMembersRepoLayer.Tag;
    const orderRepo = yield* OrderRepoLayer.Tag;
    const notifyHelper = new NotificationSetup("orderDispute");

    // check if order exists
    const orderDetails = yield* orderRepo
      .getSingleOrder({
        id: params.disputeData.orderId,
      })
      .pipe(Effect.mapError(() => new ExpectedError("Invalid Order ID")));

    const isBuyerOrSeller = [
      orderDetails.buyerId,
      orderDetails.sellerId,
    ].includes(params.currentUser.id);

    // check if the user is a seller or buyer
    if (!isBuyerOrSeller) {
      yield* new PermissionError("Cannot create dispute");
    }

    // check if order dispute already exists
    const dispute = yield* disputeRepo
      .firstOrThrow("orderId", params.disputeData.orderId)
      .pipe(
        Effect.flatMap(() => {
          return new ExpectedError("Order already has an open dispute");
        }),
        Effect.catchTag("NoSuchElementException", () => {
          return disputeRepo
            .create({
              reason: params.disputeData.reason,
              createdBy: params.currentUser.id,
              orderId: params.disputeData.orderId,
              creatorRole: params.currentUser.role,
            })
            .pipe(Effect.flatMap(head));
        }),
      );

    const channel_id = cuid2.createId();
    const channel = yield* createMessagingChannel({
      channel_id,
      userIds: [orderDetails.buyerId, orderDetails.sellerId],
    });

    yield* _(
      Effect.tryPromise(() =>
        channel.sendMessage({
          channel_id: channel_id,
          message: createTextMessage({
            content: params.disputeData.reason,
            senderId: params.currentUser.id,
          }),
        }),
      ),
      Effect.tap(Effect.logDebug("Dispute: Initial message sent!")),
    );

    // add the buyer and seller to the dispute members table
    yield* Effect.all([
      disputeMembersRepo.create({
        disputeId: dispute.id,
        userId: orderDetails.buyerId,
        role: "BUYER",
      }),
      disputeMembersRepo.create({
        disputeId: dispute.id,
        userId: orderDetails.sellerId,
        role: "SELLER",
      }),
    ]);

    // send in-app notification either seller buyer
    if (params.currentUser.role === "BUYER") {
      yield* Effect.all([
        sendNotification(
          notifyHelper.createMessage({
            type: "preset",
            receiverId: params.currentUser.id,
            name: "buyerDispute",
            meta: {
              orderId: orderDetails.id,
              triggeredBy: {
                id: params.currentUser.id,
                role: "BUYER",
              },
            },
          }),
        ),
        //notify the seller of the opened dispute
        sendNotification(
          notifyHelper.createMessage({
            type: "preset",
            receiverId: orderDetails.sellerId,
            name: "buyerSellerDispute",
            meta: {
              orderId: orderDetails.id,
              triggeredBy: {
                id: params.currentUser.id,
                role: "BUYER",
              },
            },
          }),
        ),
      ]);
    }

    return dispute;
  });
};

function createMessagingChannel({
  channel_id,
  userIds,
}: {
  channel_id: string;
  userIds: string[];
}) {
  return Effect.gen(function* (_) {
    // @make a facade for chat service
    const dispute_chat = yield* ChatService;
    const userRepo = yield* UserRepo;

    const participants = yield* _(
      Effect.all(
        userIds.map((userId) => userRepo.find("id", userId)),
        { concurrency: "unbounded" },
      ),
      Effect.tap(Effect.logDebug("Fetched all participant Information")),
    );

    const all_participants = Effect.succeed(
      participants.map((user) => {
        const randomNumber = Math.random() * 100;
        const username = toLower(
          `${user.firstName}.${user.lastName}${randomNumber}`,
        );

        return {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          username: username,
          avatar: user.profilePicture,
        };
      }),
    );

    yield* _(
      all_participants,
      Effect.flatMap((participants) => {
        return pipe(
          Effect.tryPromise(() => {
            return dispute_chat.startConversation({
              type: "group",
              channel_id: channel_id,
              participants: participants,
            });
          }),
          Effect.tap(Effect.logDebug("Dispute messaging channel created!")),
        );
      }),
    );
    Effect.tap(
      Effect.logDebug("Dispute messaging channel created successfully"),
    );

    return dispute_chat;
  });
}

export const getDisputesByUserId = (currentUserId: string) => {
  return Effect.gen(function* (_) {
    const disputeRepo = yield* DisputeRepoLayer.Tag;
    const list = yield* disputeRepo.getByUserId({
      currentUserId,
    });

    return { data: list, status: true };
  });
};

export const sendDisputeMessage = (data: {
  currentUserId: string;
  disputeId: string;
  message: string;
}) => {
  return Effect.gen(function* (_) {
    const disputeMsgRepo = yield* DisputeMessagesRepoLayer.Tag;
    const disputeRepo = yield* DisputeRepoLayer.Tag;
    const disputeMembersRepo = yield* DisputeMembersRepoLayer.Tag;

    //make sure the dispute id exists
    const disputeDetails = yield* disputeRepo
      .firstOrThrow(data.disputeId)
      .pipe(Effect.mapError(() => new ExpectedError("invalid dispute id")));

    //make sure the user is member of the dispute
    yield* disputeMembersRepo
      .firstOrThrow({
        disputeId: disputeDetails.id,
        userId: data.currentUserId,
      })
      .pipe(
        Effect.mapError(
          () =>
            new ExpectedError("Cannot send message: Not assigned to dispute"),
        ),
      );

    if (disputeDetails.status !== "open") {
      yield* new ExpectedError("Cannot send message on a pending dispute");
    }
    yield* disputeMsgRepo.create({
      disputeId: data.disputeId,
      message: data.message,
      senderId: data.currentUserId,
    });
    return { status: true };
  });
};

export const updateDisputeStatus = (data: {
  currentUser: SessionUser;
  disputeId: string;
  status: "open" | "resolved";
}) => {
  return Effect.gen(function* (_) {
    const disputeRepo = yield* DisputeRepoLayer.Tag;
    const disputeMembersRepo = yield* DisputeMembersRepoLayer.Tag;

    //make sure the dispute id exists
    const disputeDetails = yield* disputeRepo
      .firstOrThrow("id", data.disputeId)
      .pipe(Effect.mapError(() => new ExpectedError("invalid dispute id")));

    //check If you can change dispute status
    if (!canTransitionDisputeStatus(disputeDetails.status, data.status)) {
      yield* new ExpectedError(
        `Cannot transition from ${disputeDetails.status} to ${data.status}`,
      );
    }

    //only customer care or admin can update dispute status
    if (data.currentUser.role !== "ADMIN") {
      yield* new PermissionError("Cannot affect dispute status");
    }

    if (data.status === "open") {
      //update status
      yield* disputeRepo.update(data.disputeId, {
        acceptedBy: data.currentUser.id,
        status: data.status,
      });

      //add the customerCare or admin as dispute member
      yield* disputeMembersRepo.create({
        disputeId: disputeDetails.id,
        userId: data.currentUser.id,
        role: data.currentUser.role,
      });
    }

    if (data.status === "resolved") {
      yield* disputeRepo.update(data.disputeId, {
        resolvedBy: data.currentUser.id,
        status: data.status,
      });
    }

    return { status: true, message: `${data.status} status successful` };
  });
};

export const getDisputeMessages = (data: {
  disputeId: string;
  currentUser: SessionUser;
}) => {
  return Effect.gen(function* (_) {
    const disputeMessageRepo = yield* DisputeMessagesRepoLayer.Tag;
    const disputeMembersRepo = yield* DisputeMembersRepoLayer.Tag;
    const readReceiptRepo = yield* DisputeReadReceiptRepoLayer.Tag;
    const paginate = yield* PaginationService;

    //make sure the user is member of the dispute
    yield* disputeMembersRepo
      .firstOrThrow({
        disputeId: data.disputeId,
        userId: data.currentUser.id,
      })
      .pipe(
        Effect.mapError(
          () =>
            new ExpectedError(
              "Invalid disputeId: user not assigned to dispute",
            ),
        ),
      );

    const messageCount = yield* disputeMessageRepo.messageCount({
      disputeId: data.disputeId,
    });

    //get all messages
    const messages = yield* disputeMessageRepo.all({
      where: SearchOps.eq("disputeId", data.disputeId),
      pageNumber: paginate.query.pageNumber,
      pageSize: paginate.query.pageSize,
    });

    yield* readReceiptRepo
      .firstOrThrow({
        disputeId: data.disputeId,
        userId: data.currentUser.id,
      })
      .pipe(
        Effect.matchEffect({
          onFailure() {
            return readReceiptRepo.create({
              disputeId: data.disputeId,
              userId: data.currentUser.id,
              lastReadCount: messageCount,
            });
          },
          onSuccess() {
            return readReceiptRepo.updateReadReceipt(
              data.disputeId,
              data.currentUser.id,
              {
                disputeId: data.disputeId,
                userId: data.currentUser.id,
                lastReadCount: messageCount,
                readAt: new Date(),
              },
            );
          },
        }),
        Effect.flatMap(head),
      );

    return {
      data: messages.reverse(),
      meta: {
        ...paginate.meta,
        total: messageCount,
        total_pages: Math.ceil(messageCount / paginate.query.pageSize),
      },
      status: true,
    };
  });
};

export const getUnreadMessage = (data: { currentUser: SessionUser }) => {
  return Effect.gen(function* (_) {
    const disputeMembersRepo = yield* DisputeMembersRepoLayer.Tag;
    const disputeMessageRepo = yield* DisputeMessagesRepoLayer.Tag;
    const readReceiptRepo = yield* DisputeReadReceiptRepoLayer.Tag;
    const unreadMessageCount = [];

    //get the disputes the user is part of
    const disputeMemberLists = yield* disputeMembersRepo.all({
      where: SearchOps.eq("userId", data.currentUser.id),
    });

    if (!disputeMemberLists.length) {
      return { data: [], status: true };
    }

    for (const dispute of disputeMemberLists) {
      const messageCount = yield* disputeMessageRepo.messageCount({
        disputeId: dispute.disputeId,
      });

      //get the dispute read receipt
      const readReceipt = yield* readReceiptRepo
        .getReadReceipts({
          disputeId: dispute.disputeId,
          userId: data.currentUser.id,
        })
        .pipe(
          Effect.match({
            onFailure: () => ({ lastReadCount: 0 }),
            onSuccess: (v) => v,
          }),
        );

      const count = messageCount - readReceipt.lastReadCount;
      unreadMessageCount.push({ [dispute.id]: count });
    }
    return { data: unreadMessageCount, status: true };
  });
};

/**
 * This method assigns a user as a member of a dispute
 * or removes the user
 */
export const inviteMember = (data: {
  currentUser: SessionUser;
  disputeId: string;
  userId: string;
}) => {
  return Effect.gen(function* (_) {
    const notify = yield* NotificationFacade;
    const disputeMembersRepo = yield* DisputeMembersRepoLayer.Tag;
    const disputeRepo = yield* DisputeRepoLayer.Tag;
    const orderRepo = yield* OrderRepoLayer.Tag;
    const userRepo = yield* UserRepoLayer.Tag;
    const notifySetup = new NotificationSetup("orderDispute");

    if (data.currentUser.role !== "ADMIN") {
      yield* new PermissionError("Cannot invite user");
    }

    //make sure a dispute exist for the disputeId
    const disputeDetails = yield* disputeRepo
      .firstOrThrow("id", data.disputeId)
      .pipe(
        Effect.mapError(
          () =>
            new ExpectedError("Invalid disputeID: Unassociated open dispute"),
        ),
      );

    if (disputeDetails.createdBy === data.userId) {
      yield* new ExpectedError(
        "Unacceptable action: cannot invite dispute creator",
      );
    }

    const invitedUserDetails = yield* userRepo
      .firstOrThrow({ id: data.userId })
      .pipe(
        Effect.mapError(
          () => new ExpectedError("Invalid user id: Cannot invite this user"),
        ),
      );

    const orderDetails = yield* orderRepo.getSingleOrder({
      id: disputeDetails.orderId,
    });

    if (
      !(
        orderDetails.sellerId === invitedUserDetails.id ||
        orderDetails.buyerId === invitedUserDetails.id ||
        invitedUserDetails.role === "ADMIN"
      )
    ) {
      yield* new ExpectedError(
        "User must be an admin or associated with the order",
      );
    }

    //if user not already a member add the user
    yield* disputeMembersRepo
      .firstOrThrow({ userId: data.userId, disputeId: data.disputeId })
      .pipe(
        Effect.matchEffect({
          onFailure: () => {
            return disputeMembersRepo.create({
              disputeId: data.disputeId,
              userId: data.userId,
              role: invitedUserDetails.role,
            });
          },
          onSuccess: () => {
            return new ExpectedError("User already a member");
          },
        }),
      );

    // notify user
    const Notificationmsg: TNotificationMessage = {
      title: "Invitation to Participate in Open Order Dispute",
      message: `We would like to inform you that you have been invited to
        participate in an open dispute related to an order. Your
        involvement is important for resolving this matter.`,
    };

    // write notification to database
    yield* sendNotification(
      notifySetup.createMessage({
        type: "new",
        receiverId: data.userId,
        msg: Notificationmsg,
      }),
    );

    // send email notification
    yield* notify
      .route("mail", { address: invitedUserDetails.email })
      .notify(new DisputeInviteNotification(invitedUserDetails));

    return { status: true, message: "User invited successfully" };
  });
};

export const removeMember = (data: {
  currentUser: SessionUser;
  userId: string;
  disputeId: string;
}) => {
  return Effect.gen(function* (_) {
    const userRepo = yield* UserRepo;
    const notify = yield* NotificationFacade;
    const disputeMembersRepo = yield* DisputeMembersRepoLayer.Tag;
    const notifySetup = new NotificationSetup("orderDispute");

    if (data.currentUser.role !== "ADMIN") {
      yield* new PermissionError("Cannot remove user");
    }

    // if user already a member remove the user
    yield* disputeMembersRepo
      .firstOrThrow(
        SearchOps.and(
          SearchOps.eq("userId", data.userId),
          SearchOps.eq("disputeId", data.disputeId),
        ),
      )
      .pipe(
        Effect.matchEffect({
          onFailure: () => {
            return new ExpectedError("User is not a member");
          },

          onSuccess: () => {
            return disputeMembersRepo.delete(
              SearchOps.and(
                SearchOps.eq("userId", data.userId),
                SearchOps.eq("disputeId", data.disputeId),
              ),
            );
          },
        }),
      );

    // notify user
    const Notificationmsg: TNotificationMessage = {
      title: "Removal from Open Dispute",
      message:
        "You have been removed from the open dispute you were previously involved in.",
    };

    yield* sendNotification(
      notifySetup.createMessage({
        type: "new",
        receiverId: data.userId,
        msg: Notificationmsg,
      }),
    );

    const user = yield* userRepo.find(data.userId);
    yield* notify
      .route("mail", { address: user.email })
      .notify(new DisputeLeaveNotification(data.disputeId, user));

    return { status: true, message: "User removed successfully" };
  });
};
