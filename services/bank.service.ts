import { Effect } from "effect";
import { NoSuchElementException } from "effect/Cause";
import { id } from "tigerbeetle-node";
import { randomUUID } from "uncrypto";
import type { z } from "zod";
import { ExpectedError } from "~/config/exceptions";
import { PaymentGateway } from "~/layers/payment/payment-gateway";
import type { SessionUser } from "~/layers/session-provider";
import { BankAccountRepoLayer } from "~/repositories/accountNumber.repo";
import { BankAccountVerificationRepoLayer } from "~/repositories/bankAccountVerification.repo";
import { TigerBeetleRepoLayer } from "~/repositories/tigerbeetle/tigerbeetle.repo";
import { TBAccountCode } from "~/utils/tigerBeetle/type/type";
import type { resolveAccountNumberRules } from "~/dto/accountNumber.dto";
import { SearchOps } from "./search/sql-search-resolver";
import { dataResponse } from "~/libs/response";

export const getBankList = () => {
  return Effect.gen(function* (_) {
    const paystackGateway = yield* PaymentGateway;
    const lists = yield* paystackGateway.bankLists();
    return dataResponse({
      data: lists.data,
      status: lists.status,
      message: lists.message,
    });
  });
};

export const getUserBankAccounts = (currentUser: SessionUser) => {
  return Effect.gen(function* (_) {
    const bankAccountRepo = yield* _(BankAccountRepoLayer.tag);
    const accounts = yield* bankAccountRepo.all({
      where: SearchOps.and(
        SearchOps.eq("userId", currentUser.id),
        SearchOps.isNull("deletedAt"),
      ),
    });

    return dataResponse({ data: accounts });
  });
};

export const deleteBankAcounts = (params: {
  bankAccountId: string;
  currentUser: SessionUser;
}) => {
  return Effect.gen(function* (_) {
    const bankAccountRepo = yield* _(BankAccountRepoLayer.tag);

    const accountDetails = yield* _(
      bankAccountRepo.firstOrThrow(
        SearchOps.and(
          SearchOps.eq("id", params.bankAccountId),
          SearchOps.isNull("deletedAt"),
        ),
      ),
      Effect.mapError(
        () => new NoSuchElementException("Invalid bank account id"),
      ),
    );

    if (params.currentUser.id !== accountDetails.userId) {
      yield* new ExpectedError(
        "Unathorized action: cannot delete bank account",
      );
    }

    yield* bankAccountRepo.update(
      { id: params.bankAccountId },
      { deletedAt: new Date() },
    );

    return dataResponse({ message: "Bank account deleted" });
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
      Effect.matchEffect({
        onSuccess: (v) => new ExpectedError("Account already exists"),
        onFailure: () => Effect.succeed(1),
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
      accountNumber: bankDetails.data.account_number,
      bankCode: params.bankCode,
      accountName: bankDetails.data.account_name,
      verificationToken,
    });

    return dataResponse({
      data: {
        accountName: bankDetails.data.account_name,
        accountNumber: bankDetails.data.account_number,
        token: verificationToken,
      },
    });
  });
};

export const addNewBankAccount = (token: string, currentUser: SessionUser) => {
  return Effect.gen(function* (_) {
    const paystackGateway = yield* PaymentGateway;
    const bankVerificationRepo = yield* _(BankAccountVerificationRepoLayer.tag);
    const bankAccountRepo = yield* _(BankAccountRepoLayer.tag);
    const tigerbeetleRepo = yield* _(TigerBeetleRepoLayer.Tag);

    const bankDetails = yield* _(
      bankVerificationRepo.firstOrThrow({ verificationToken: token }),
      Effect.mapError(
        () => new NoSuchElementException("Invalid bank account token"),
      ),
    );

    //create recipient code for this account
    const response = yield* _(
      paystackGateway.createTransferRecipient({
        type: "nuban",
        account_number: bankDetails.accountNumber,
        bank_code: bankDetails.bankCode,
        name: bankDetails.accountName,
        currency: "NGN",
      }),
      Effect.mapError(
        (e) =>
          new ExpectedError(
            `couldn't create transfer recipient: account details are wrong`,
          ),
      ),
    );

    const tigerbeetleAccountId = String(id());
    yield* _(
      Effect.all([
        bankAccountRepo.create({
          userId: currentUser.id,
          accountNumber: bankDetails.accountNumber,
          accountName: bankDetails.accountName,
          bankName: response.data.details.bank_name,
          bankCode: bankDetails.bankCode,
          paystackRecipientCode: response.data.recipient_code,
          tigerbeetleAccountId,
        }),

        // add a tigerbeetle account for bank account
        tigerbeetleRepo.createAccounts({
          accountId: tigerbeetleAccountId,
          code: TBAccountCode.BANK_ACCOUNT,
        }),
      ]),
    );

    //delete the temporary bank details
    yield* bankVerificationRepo.delete(
      SearchOps.eq("verificationToken", token),
    );
  });
};
