import { Effect } from "effect";
import { createFactory } from "~/migrations/seeds/setup";
import { EscrowPaymentRepo } from "~/repositories/escrow/escrowPayment.repo";
import { EscrowTransactionRepo } from "~/repositories/escrow/escrowTransaction.repo";

export const EscrowPaymentFactory = createFactory(
  EscrowPaymentRepo,
  ($faker) => {
    return Effect.succeed({
      escrowId: undefined,
      userId: undefined,
      amount: $faker.finance.amount({ dec: 0, min: 50000, max: 150000 }),
      fee: 0,
      method: $faker.helpers.arrayElement(["card", "transfer"]),
      status: $faker.helpers.arrayElement([
        "pending",
        "success",
        "cancelled",
        "failed",
      ]),
    });
  },
);
