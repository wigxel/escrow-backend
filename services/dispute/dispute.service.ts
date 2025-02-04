import cuid2 from "@paralleldrive/cuid2";
import { createTextMessage } from "@repo/shared/src/chat-service/utils";
import { Effect, pipe } from "effect";
import { head } from "effect/Array";
import { toLower } from "ramda";
import { NotificationSetup } from "~/app/notifications/notification.utils";
import { ExpectedError, PermissionError } from "~/config/exceptions";
import type { SessionUser } from "~/layers/session-provider";
import { DisputeRepoLayer } from "~/repositories/dispute.repo";
import { DisputeMembersRepoLayer } from "~/repositories/disputeMember.repo";
import { UserRepo } from "~/repositories/user.repository";
import { ChatService } from "~/services/chat/dispute";
import { EscrowTransactionRepoLayer } from "~/repositories/escrow/escrowTransaction.repo";
import { EscrowParticipantRepoLayer } from "~/repositories/escrow/escrowParticipant.repo";
import {
  canTransitionEscrowStatus,
  getBuyerAndSellerFromParticipants,
} from "../escrow/escrow.utils";
import { sendNotification } from "../notification.service";

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
