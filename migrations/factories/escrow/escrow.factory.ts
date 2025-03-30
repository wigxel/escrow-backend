import { Effect } from "effect";
import { createFactory } from "~/migrations/seeds/setup";
import { EscrowTransactionRepo } from "~/repositories/escrow/escrowTransaction.repo";

export const EscrowTransactionFactory = createFactory(
  EscrowTransactionRepo,
  ($faker) => {
    return Effect.succeed({
      kind: "escrow_tx",
      title: $faker.lorem.sentence(),
      description: $faker.lorem.paragraph(),
      createdBy: $faker.string.uuid(),
      status: $faker.helpers.arrayElement([
        "created",
        "deposit.pending",
        "deposit.success",
        "service.pending",
        "service.confirmed",
        "completed",
        "dispute",
        "refunded",
        "cancelled",
        "expired",
      ]),
    });
  },
);
