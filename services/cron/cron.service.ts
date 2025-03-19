import { Effect } from "effect";
import { NotificationFacade } from "~/layers/notification/layer";
import { EscrowRequestRepoLayer } from "~/repositories/escrow/escrowRequest.repo";
import { EscrowTransactionRepoLayer } from "~/repositories/escrow/escrowTransaction.repo";
import { SearchOps } from "../search/sql-search-resolver";
import { dataResponse } from "~/libs/response";
import { UserRepoLayer } from "~/repositories/user.repository";
import { logActivityOnce } from "../activityLog/activityLog.service";
import { escrowActivityLog } from "../activityLog/concreteEntityLogs/escrow.activitylog";
import { canTransitionEscrowStatus } from "../escrow/escrow.utils";
import { ExpiredEscrowNotification } from "~/app/notifications/escrow/expiredEscrow.notify";

export const updateExpiredTransactions = () => {
  return Effect.gen(function* (_) {
    const escrowRepo = yield* EscrowTransactionRepoLayer.tag;
    const escrowRequest = yield* EscrowRequestRepoLayer.tag;
    const userRepo = yield* UserRepoLayer.Tag;
    const notifier = yield* NotificationFacade;

    const results = yield* escrowRequest.all({
      where: SearchOps.and(
        SearchOps.lte("expiresAt", new Date()),
        SearchOps.isNull("processedAt"),
      ),
    });

    yield* Effect.logDebug(`expired request count ${results.length}`);

    //foreach of the results
    for (const result of results) {
      //get the escrow details
      const escrowDetails = yield* escrowRepo.firstOrThrow({
        id: result.escrowId,
      });

      const vendorDetails = yield* userRepo.firstOrThrow({
        id: escrowDetails.createdBy,
      });

      if (!canTransitionEscrowStatus(escrowDetails.status, "expired")) {
        yield* Effect.logDebug(
          `Skipping the escrow transaction ${escrowDetails}`,
        );
        continue;
      }

      //log the activity
      yield* logActivityOnce(
        escrowActivityLog.expired({ id: result.escrowId }),
      );

      //update the transaction status
      yield* escrowRepo.update({ id: escrowDetails.id }, { status: "expired" });
      yield* escrowRequest.update(
        { escrowId: escrowDetails.id },
        { processedAt: new Date() },
      );

      yield* _(
        notifier.route("mail", { address: vendorDetails.email }).notify(
          new ExpiredEscrowNotification({
            escrowId: escrowDetails.id,
            firstName: vendorDetails.firstName,
            receiver: "vendor",
          }),
        ),
        Effect.catchAll(() =>
          Effect.logDebug(`Error occurred: couldn't send email`),
        ),
      );

      // send to customer
      yield* _(
        notifier.route("mail", { address: result.customerEmail }).notify(
          new ExpiredEscrowNotification({
            escrowId: escrowDetails.id,
            firstName: result.customerUsername,
            receiver: "customer",
          }),
        ),
        Effect.catchAll(() =>
          Effect.logDebug(`Error occurred: couldn't send email`),
        ),
      );
    }

    return dataResponse({ message: "we done" });
  });
};
