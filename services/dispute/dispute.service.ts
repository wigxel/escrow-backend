import cuid2 from "@paralleldrive/cuid2";
import { createTextMessage } from "@repo/shared/src/chat-service/utils";
import { Effect, pipe } from "effect";
import { head } from "effect/Array";
import { toLower } from "ramda";
import {
  NotificationSetup,
  type TNotificationMessage,
} from "~/app/notifications/notification.utils";
import { ExpectedError, PermissionError } from "~/config/exceptions";
import type { SessionUser } from "~/layers/session-provider";
import { DisputeRepoLayer } from "~/repositories/dispute.repo";
import { DisputeMembersRepoLayer } from "~/repositories/disputeMember.repo";
import { UserRepo, UserRepoLayer } from "~/repositories/user.repository";
import { ChatService } from "~/services/chat/dispute";
import { EscrowTransactionRepoLayer } from "~/repositories/escrow/escrowTransaction.repo";
import { EscrowParticipantRepoLayer } from "~/repositories/escrow/escrowParticipant.repo";
import {
  canTransitionEscrowStatus,
  getBuyerAndSellerFromParticipants,
} from "../escrow/escrow.utils";
import { sendNotification } from "../notification.service";
import { DisputeInviteNotification } from "~/app/notifications/dispute-invite";
import { NotificationFacade } from "~/layers/notification/layer";
import { DisputeLeaveNotification } from "~/app/notifications/dispute-leave";
import { SearchOps } from "../search/sql-search-resolver";

export const createDispute = (params: {
  disputeData: { escrowId: string; reason: string };
  currentUser: SessionUser;
}) => {
  return Effect.gen(function* (_) {
    const disputeRepo = yield* DisputeRepoLayer.Tag;
    const disputeMembersRepo = yield* DisputeMembersRepoLayer.Tag;
    const escrowRepo = yield* EscrowTransactionRepoLayer.tag;
    const participantsRepo = yield* EscrowParticipantRepoLayer.tag;
    const notifyHelper = new NotificationSetup("escrowDispute");

    // check if escrow exists
    const escrowDetails = yield* escrowRepo
      .firstOrThrow({
        id: params.disputeData.escrowId,
      })
      .pipe(Effect.mapError(() => new ExpectedError("Invalid Escrow ID")));

    const participants = yield* participantsRepo.getParticipants(
      escrowDetails.id,
    );

    const { seller, buyer } =
      yield* getBuyerAndSellerFromParticipants(participants);

    if (
      params.currentUser.id !== seller.userId &&
      params.currentUser.id !== buyer.userId
    ) {
      yield* new PermissionError("cannot create dispute");
    }

    if (!canTransitionEscrowStatus(escrowDetails.status, "dispute")) {
      yield* new ExpectedError(
        `Cannot transition from ${escrowDetails.status} to dispute`,
      );
    }

    // check if escrow dispute already exists
    const dispute = yield* disputeRepo
      .firstOrThrow("escrowId", params.disputeData.escrowId)
      .pipe(
        Effect.flatMap(() => {
          return new ExpectedError("Escrow already has an open dispute");
        }),
        Effect.catchTag("NoSuchElementException", () => {
          return disputeRepo
            .create({
              reason: params.disputeData.reason,
              createdBy: params.currentUser.id,
              escrowId: params.disputeData.escrowId,
              creatorRole:
                params.currentUser.id === seller.userId
                  ? seller.role
                  : buyer.role,
            })
            .pipe(Effect.flatMap(head));
        }),
      );

    const channel_id = cuid2.createId();
    const channel = yield* createMessagingChannel({
      channel_id,
      userIds: [seller.userId, buyer.userId],
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
        userId: seller.userId,
        role: "SELLER",
      }),
      disputeMembersRepo.create({
        disputeId: dispute.id,
        userId: buyer.userId,
        role: "BUYER",
      }),
    ]);

    //update the escrow status
    yield* escrowRepo.update({ id: escrowDetails.id }, { status: "dispute" });

    yield* Effect.all([
      /**
       * notify the dispute creator of their opened escrow dispute
       */
      sendNotification(
        notifyHelper.createMessage({
          type: "preset",
          receiverId: params.currentUser.id,
          name: "createdDispute",
          meta: {
            escrowId: escrowDetails.id,
            triggeredBy: {
              id: params.currentUser.id,
              role:
                params.currentUser.id === seller.userId ? "SELLER" : "BUYER",
            },
          },
        }),
      ),

      /**
       * notify the other party of the opened dispute
       */
      sendNotification(
        notifyHelper.createMessage({
          type: "preset",
          receiverId:
            params.currentUser.id !== seller.userId
              ? seller.userId
              : buyer.userId,
          name: "openedDisputeForOther",
          meta: {
            escrowId: escrowDetails.id,
            triggeredBy: {
              id: params.currentUser.id,
              role: "BUYER",
            },
          },
        }),
      ),
    ]);

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
    const escrowParticipantsRepo = yield* EscrowParticipantRepoLayer.tag;
    const escrowRepo = yield* EscrowTransactionRepoLayer.tag;
    const userRepo = yield* UserRepoLayer.Tag;
    const notifySetup = new NotificationSetup("escrowDispute");

    if (data.currentUser.role !== "admin") {
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

    const escrowDetails = yield* _(
      escrowRepo.firstOrThrow({
        id: disputeDetails.escrowId,
      }),
      Effect.mapError(
        () => new ExpectedError("Invalid dispute id: Cannot retrieve dispute"),
      ),
    );

    // the users in the escrow trasactions
    const participants = yield* escrowParticipantsRepo.getParticipants(
      escrowDetails.id,
    );

    const { seller, buyer } =
      yield* getBuyerAndSellerFromParticipants(participants);

    if (
      !(
        seller.userId === invitedUserDetails.id ||
        buyer.userId === invitedUserDetails.id ||
        invitedUserDetails.role === "admin"
      )
    ) {
      yield* new ExpectedError(
        "User must be an admin or associated with the escrow",
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
              role:
                invitedUserDetails.role !== "admin"
                  ? invitedUserDetails.id === seller.id
                    ? "seller"
                    : "buyer"
                  : invitedUserDetails.role,
            });
          },
          onSuccess: () => {
            return new ExpectedError("User already a member");
          },
        }),
      );

    // notify user
    const Notificationmsg: TNotificationMessage = {
      title: "Invitation to Participate in Open Escrow Dispute",
      message: `We would like to inform you that you have been invited to
        participate in an open dispute related to an escrow. Your
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
    const notifySetup = new NotificationSetup("escrowDispute");

    if (data.currentUser.role !== "admin") {
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
  });
};
