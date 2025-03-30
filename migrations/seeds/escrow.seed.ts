import { Effect } from "effect";
import { createSeed } from "./setup";
import { UserRepoLayer } from "~/repositories/user.repository";
import { EscrowTransactionFactory } from "../factories/escrow/escrow.factory";
import { EscrowParticipantsFactory } from "../factories/escrow/escrowParticipants.factory";
import { EscrowPaymentFactory } from "../factories/escrow/escrowPayment.factory";
import { EscrowWalletFactory } from "../factories/escrow/escrowWallet.factory";
import { id } from "tigerbeetle-node";
import { createAccount } from "~/services/tigerbeetle.service";
import { TBAccountCode } from "~/utils/tigerBeetle/type/type";

export const seedEscrow = createSeed(
  "EscrowSeed",
  Effect.gen(function* (_) {
    const userRepo = yield* UserRepoLayer.Tag;
    const users = yield* userRepo.all();

    for (const seller of users) {
      const walletId = String(id());
      const buyer = users.find((v) => v.id !== seller.id);

      const escrowDetails = yield* EscrowTransactionFactory.create({
        createdBy: seller.id,
      });

      //add escrowWallet
      yield* Effect.all([
        EscrowWalletFactory.create({
          escrowId: escrowDetails.id,
          tigerbeetleAccountId: walletId,
        }),

        createAccount({
          accountId: walletId,
          code: TBAccountCode.ESCROW_WALLET,
        }),
      ]);

      //add payment
      yield* EscrowPaymentFactory.create({
        escrowId: escrowDetails.id,
        userId: buyer.id,
      });
      //add participants
      yield* Effect.all([
        EscrowParticipantsFactory.create({
          escrowId: escrowDetails.id,
          userId: seller.id,
          role: "seller",
        }),

        EscrowParticipantsFactory.create({
          escrowId: escrowDetails.id,
          userId: buyer.id,
          role: "buyer",
        }),
      ]);
    }
  }),
);
