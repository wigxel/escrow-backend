import cuid2 from "@paralleldrive/cuid2";
import { createTextMessage } from "~/services/chat/chat-service/utils";
import { Effect, pipe } from "effect";
import { head } from "effect/Array";
import { toLower } from "ramda";
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
import { DisputeInviteNotification } from "~/app/notifications/dispute-invite";
import { NotificationFacade } from "~/layers/notification/layer";
import { DisputeLeaveNotification } from "~/app/notifications/dispute-leave";
import { SearchOps } from "../search/sql-search-resolver";
import { canTransitionDisputeStatus } from "./dispute.util";
import { CreateDisputeNotification } from "~/app/notifications/in-app/dispute/createDispute.notify";
import { CreateDisputePartyNotification } from "~/app/notifications/in-app/dispute/createDisputeParty.notify";
import { LeaveDisputeNotification } from "~/app/notifications/in-app/dispute/leaveDispute.notify";
import { DisputeInviteNotify } from "~/app/notifications/in-app/dispute/disputeInvite.notify";
import { createActivityLog } from "../activityLog/activityLog.service";
import { disputeActivityLog } from "../activityLog/concreteEntityLogs/dispute.activitylog";
import { FileStorage } from "~/layers/storage/layer";
import type { z } from "zod";
import type { newDisputeSchema } from "~/dto/dispute.dto";
import { DisputeCategorysRepoLayer } from "~/repositories/disputeCategories.repo";
import { DisputeResolutionssRepoLayer } from "~/repositories/disputeResolution.repo";
import { dataResponse } from "~/libs/response";

export const createDispute = (params: {
  disputeData: z.infer<typeof newDisputeSchema>;
  currentUser: SessionUser;
}) => {
  return Effect.gen(function* (_) {
    const disputeRepo = yield* DisputeRepoLayer.Tag;
    const disputeCategoryRepo = yield* DisputeCategorysRepoLayer.Tag;
    const disputeResolutionRepo = yield* DisputeResolutionssRepoLayer.Tag;
    const disputeMembersRepo = yield* DisputeMembersRepoLayer.Tag;
    const escrowRepo = yield* EscrowTransactionRepoLayer.tag;
    const participantsRepo = yield* EscrowParticipantRepoLayer.tag;
    const notify = yield* NotificationFacade;
    const fileManager = yield* FileStorage;

    // check if escrow exists
    const escrowDetails = yield* escrowRepo
      .firstOrThrow({
        id: params.disputeData.escrowId,
      })
      .pipe(Effect.mapError(() => new ExpectedError("Invalid Escrow ID")));

    // check for dispute category id
    yield* _(
      disputeCategoryRepo.firstOrThrow({ id: params.disputeData.categoryId }),
      Effect.mapError(() => new ExpectedError("Invalid Dispute Category ID")),
    );
    // make sure the resolution id exists
    yield* _(
      disputeResolutionRepo.firstOrThrow({
        id: params.disputeData.resolutionId,
      }),
      Effect.mapError(() => new ExpectedError("Invalid Dispute Resolution ID")),
    );

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
              categoryId: params.disputeData.categoryId,
              resolutionId: params.disputeData.resolutionId,
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

    //upload the image to cloudinary and
    const uploadResult = yield* Effect.tryPromise(() =>
      fileManager.uploadFile(params.disputeData.file, {
        mimeType: params.disputeData.file.type,
        fileName: params.disputeData.file.name,
        folder: "dispute",
        tags: ["chat", `dispute:${escrowDetails.id}`],
      }),
    );

    yield* _(
      Effect.all([
        Effect.tryPromise(() =>
          channel.sendMessage({
            channel_id: channel_id,
            message: createTextMessage({
              content: uploadResult.fileUrl,
              senderId: params.currentUser.id,
              type: "image",
            }),
          }),
        ),
        Effect.tryPromise(() =>
          channel.sendMessage({
            channel_id: channel_id,
            message: createTextMessage({
              content: params.disputeData.reason,
              senderId: params.currentUser.id,
            }),
          }),
        ),
      ]),
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

    //new dispute status entry
    yield* createActivityLog(
      disputeActivityLog.created({
        id: dispute.id,
        triggeredBy: params.currentUser.id,
      }),
    );
    // id of the other user not the currentUser
    const disputePartyId =
      params.currentUser.id !== seller.userId ? seller.userId : buyer.userId;

    /**
     * notify the creator of their opened escrow dispute
     */
    yield* notify.route("in-app", { userId: params.currentUser.id }).notify(
      new CreateDisputeNotification({
        escrowId: escrowDetails.id,
        triggeredBy: params.currentUser.id,
        role: params.currentUser.id === seller.userId ? "seller" : "buyer",
      }),
    );
    /**
     * notify the other party of the opened dispute
     */
    yield* notify.route("in-app", { userId: disputePartyId }).notify(
      new CreateDisputePartyNotification({
        escrowId: escrowDetails.id,
        triggeredBy: params.currentUser.id,
        role: params.currentUser.id === seller.userId ? "seller" : "buyer",
      }),
    );

    return dataResponse({ data: { dispute } });
  });
};

export function createMessagingChannel({
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

    return dataResponse({ data: list });
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

    // in app notification
    yield* notify.route("in-app", { userId: data.userId }).notify(
      new DisputeInviteNotify({
        escrowId: escrowDetails.id,
        triggeredBy: data.currentUser.id,
        role: data.currentUser.role,
      }),
    );

    // send email notification
    yield* notify
      .route("mail", { address: invitedUserDetails.email })
      .notify(new DisputeInviteNotification(invitedUserDetails));

    return dataResponse({ message: "Member invited successfully" });
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

    //in app notification
    yield* notify.route("in-app", { userId: data.userId }).notify(
      new LeaveDisputeNotification({
        disputeId: data.disputeId,
        triggeredBy: data.currentUser.id,
        role: data.currentUser.role,
      }),
    );

    const user = yield* userRepo.find(data.userId);
    yield* notify
      .route("mail", { address: user.email })
      .notify(new DisputeLeaveNotification(data.disputeId, user));

    return dataResponse({ message: "Member removed successfully" });
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

    //only customer care or admin can update dispute status
    if (data.currentUser.role !== "admin") {
      yield* new PermissionError("Cannot affect dispute status");
    }

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

      yield* createActivityLog(
        disputeActivityLog.resolved({
          id: data.disputeId,
          resolvedBy: data.currentUser.id,
        }),
      );
    }
  });
};
