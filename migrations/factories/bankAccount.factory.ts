import { BankAccountRepo } from "~/repositories/accountNumber.repo";
import { createFactory } from "../seeds/setup";
import { Effect } from "effect";

export const BankAccountFactory = createFactory(BankAccountRepo, ($faker) => {
  return Effect.succeed({
    userId: undefined,
    tigerbeetleAccountId: $faker.phone.number(),
    bankName: $faker.lorem.sentence({ min: 1, max: 3 }),
    accountNumber: $faker.phone.number(),
    isDefault: $faker.helpers.arrayElement([true, false]),
    accountName: $faker.person.fullName(),
    bankCode: $faker.phone.number().substring(0, 3),
    paystackRecipientCode: `RCT_${$faker.string.alpha(10)}`,
  });
});
