import { Effect } from "effect";
import { randomUUID } from "uncrypto";
import type { z } from "zod";
import { ExpectedError } from "~/config/exceptions";
import { PaymentGateway } from "~/layers/payment/payment-gateway";
import type { SessionUser } from "~/layers/session-provider";
import { BankAccountRepoLayer } from "~/repositories/accountNumber.repo";
import { BankAccountVerificationRepoLayer } from "~/repositories/bankAccountVerification.repo";
import type { resolveAccountNumberRules } from "~/validationRules/accountNumber.rules";

export const getBankList = () => {
  return Effect.gen(function* (_) {
    const paystackGateway = yield* PaymentGateway;
    return yield* paystackGateway.bankLists();
  });
};

export const resolveAccountNumber = (
  params: z.infer<typeof resolveAccountNumberRules>,
  currentUser: SessionUser,
) => {
  return Effect.gen(function* (_) {
    const paystackGateway = yield* PaymentGateway;
    const bankVerificationRepo = yield* _(BankAccountVerificationRepoLayer.tag);
    const bankAccountRepo = yield* _(BankAccountRepoLayer.tag);

    yield* _(
      bankAccountRepo.firstOrThrow({
        userId: currentUser.id,
        accountNumber: params.accountNumber,
      }),
      Effect.match({
        onSuccess: (v) => new ExpectedError("Account already exists"),
        onFailure: () => {},
      }),
    );

    const bankDetails = yield* _(
      paystackGateway.resolveBankAccount(params.accountNumber, params.bankCode),
      Effect.mapError(
        (e) =>
          new ExpectedError(
            `Unknown bank code: ${params.bankCode} or Could not resolve account name`,
          ),
      ),
    );

    /**
     * store the bank details in a temporary table
     */
    const verificationToken = randomUUID();
    yield* bankVerificationRepo.create({
      userId: currentUser.id,
      accountNumber: params.accountNumber,
      bankCode: params.bankCode,
      accountName: bankDetails.data.account_name,
      bankName: params.bankName,
      verificationToken,
    });

    return {
      accountName: bankDetails.data.account_name,
      accountNumber: bankDetails.data.account_number,
      token: verificationToken,
    };
  });
};

