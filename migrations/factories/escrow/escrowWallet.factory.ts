import { Effect } from "effect";
import { createFactory } from "~/migrations/seeds/setup";
import { EscrowWalletRepo } from "~/repositories/escrow/escrowWallet.repo";

export const EscrowWalletFactory = createFactory(EscrowWalletRepo, ($faker) => {
  return Effect.succeed({
    escrowId: undefined,
    tigerbeetleAccountId: undefined,
  });
});
