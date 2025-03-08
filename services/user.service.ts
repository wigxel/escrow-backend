import { Effect } from "effect";
import { head } from "effect/Array";
import { EmailVerificationMail } from "~/app/mail/email-verification";
import { PasswordResetMail } from "~/app/mail/password-reset";
import { ExpectedError } from "~/config/exceptions";
import { PasswordHasherError } from "~/layers/encryption";
import { hashPassword } from "~/layers/encryption/helpers";
import { Session } from "~/layers/session";
import { OtpRepo } from "~/repositories/otp.repository";
import { UserRepoLayer } from "~/repositories/user.repository";
import { generateOTP, verifyOTP } from "./otp/otp.service";
import { SearchOps } from "./search/sql-search-resolver";
import type { confirmEscrowRequestRules } from "~/dto/escrowTransactions.dto";
import type { z } from "zod";
import { ReversibleHash } from "~/layers/encryption/reversible";
import { ReferralSourcesRepoLayer } from "~/repositories/referralSource.repo";
import type {
  createUserDto,
  passwordResetDto,
  verifyEmailDto,
} from "~/dto/user.dto";
import { id } from "tigerbeetle-node";
import { createAccount, getAccountBalance } from "./tigerbeetle.service";
import { TBAccountCode } from "~/utils/tigerBeetle/type/type";
import { UserWalletRepoLayer } from "~/repositories/userWallet.repo";
import { NotificationFacade } from "~/layers/notification/layer";
import { EscrowUserAccounntMail } from "~/app/mail/escrow/escrowUserAccount.notify";
import type { SessionUser } from "~/layers/session-provider";
import { convertCurrencyUnit } from "./escrow/escrow.utils";

export function createUser(data: z.infer<typeof createUserDto>) {
  return Effect.gen(function* (_) {
    const notify = yield* NotificationFacade;
    const userRepo = yield* UserRepoLayer.Tag;
    const otpRepo = yield* OtpRepo;
    const userWalletRepo = yield* UserWalletRepoLayer.tag;
    const sessionManager = yield* Session;
    const encrypter = yield* ReversibleHash;
    const referralSourceRepo = yield* ReferralSourcesRepoLayer.Tag;

    yield* checkUsername(data.username);

    yield* _(
      referralSourceRepo.firstOrThrow(data.referralSourceId),
      Effect.mapError(() => new ExpectedError("invalid referral source ID")),
    );

    const hashedPassword = yield* hashPassword(data.password).pipe(
      Effect.mapError(
        () => new PasswordHasherError("Password encryption failed"),
      ),
    );

    data.password = hashedPassword;
    data.bvn = yield* encrypter.encrypt(data.bvn);


    const userCount = yield* userRepo.count(
      SearchOps.or(
        SearchOps.eq("email", data.email),
        SearchOps.eq("phone", data.phone),
      ),
    );

    if (userCount)
      yield* new ExpectedError(
        "Account already exists. Email or phone number is taken",
      );

    const user = yield* _(
      userRepo.create({
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        username: data.username,
        password: data.password,
        phone: data.phone,
        businessName: data.businessName,
        hasBusiness: data.hasBusiness,
        bvn: data.bvn,
        referralSourceId: data.referralSourceId,
      }),
      Effect.flatMap(head),
    );

    /**
     * create the user Wallet for the new user
     * create an account in tigerbeetle to track the user wallet
     */
    const tbAccountId = String(id());

    yield* _(
      Effect.all([
        userWalletRepo.create({
          userId: user.id,
          tigerbeetleAccountId: String(tbAccountId),
        }),

        createAccount({
          accountId: tbAccountId,
          code: TBAccountCode.USER_WALLET,
          ledger: "ngnLedger",
        }),
      ]),
    );

    const otp = yield* generateOTP();

    yield* otpRepo.create({
      userId: user.id,
      email: user.email,
      userKind: "USER",
      otpReason: "EMAIL_VERIFICATION",
      value: otp,
    });

    const session_data = yield* sessionManager.create(user.id);

    yield* _(
      notify
        .route("mail", { address: user.email })
        .notify(new EmailVerificationMail(user, otp)),
      Effect.match({ onFailure: () => { }, onSuccess: () => { } }),
    );

    return {
      session: session_data,
      user,
    };
  });
}

export function resendEmailVerificationOtp(email: string) {
  return Effect.gen(function* (_) {
    const notify = yield* NotificationFacade;
    const userRepo = yield* UserRepoLayer.Tag;
    const otpRepo = yield* OtpRepo;

    const user = yield* _(
      userRepo.firstOrThrow({ email }),
      Effect.catchTag(
        "NoSuchElementException",
        () => new ExpectedError("User with email doesn't exist"),
      ),
    );

    if (user.emailVerified) yield* new ExpectedError("Email already verified");

    const otp = yield* generateOTP();

    yield* otpRepo.update({ email: user.email }, { value: otp });

    yield* _(
      notify
        .route("mail", { address: user.email })
        .notify(new EmailVerificationMail(user, otp)),
      Effect.match({ onFailure: () => { }, onSuccess: () => { } }),
    );
  });
}

export function forgotPassword(email: string) {
  return Effect.gen(function* (_) {
    const notify = yield* NotificationFacade;
    const userRepo = yield* UserRepoLayer.Tag;
    const otpRepo = yield* OtpRepo;

    const otp = yield* generateOTP();

    const user = yield* _(
      userRepo.firstOrThrow({ email }),
      Effect.mapError(() => new ExpectedError("Request is being processed")),
    );

    yield* _(
      otpRepo.firstOrThrow({ email: user.email }),
      Effect.matchEffect({
        onFailure: () =>
          otpRepo.create({
            userId: user.id,
            email: user.email,
            userKind: "USER",
            otpReason: "PASSWORD_RESET",
            value: otp,
          }),
        onSuccess: (v) => otpRepo.update({ email: user.email }, { value: otp }),
      }),
    );

    yield* _(
      notify
        .route("mail", { address: user.email })
        .notify(new PasswordResetMail(user, otp)),
      Effect.match({ onFailure: () => { }, onSuccess: () => { } }),
    );
  });
}

export function passwordReset(data: z.infer<typeof passwordResetDto>) {
  return Effect.gen(function* (_) {
    const otpRepo = yield* OtpRepo;
    const userRepo = yield* UserRepoLayer.Tag;

    yield* verifyOTP(data.otp);
    const storedOtp = yield* _(
      otpRepo.firstOrThrow({ value: data.otp, email: data.email }),
      Effect.mapError(() => new ExpectedError("Invalid OTP")),
    );

    yield* _(
      userRepo.update(storedOtp.userId, {
        password: yield* hashPassword(data.password),
        emailVerified: true, // REASON: Password resets should make user verified. See: https://thecopenhagenbook.com/password-reset
      }),
      Effect.mapError((err) => new ExpectedError("Invalid user")),
    );

    yield* otpRepo.delete(
      SearchOps.and(
        SearchOps.eq("value", data.otp),
        SearchOps.eq("email", data.email),
      ),
    );
  });
}

export function verifyUserEmail(params: z.infer<typeof verifyEmailDto>) {
  return Effect.gen(function* (_) {
    const userRepo = yield* UserRepoLayer.Tag;
    const otpRepo = yield* OtpRepo;

    yield* verifyOTP(params.otp);
    const storedOtp = yield* _(
      otpRepo.firstOrThrow({ value: params.otp, email: params.email }),
      Effect.mapError(() => new ExpectedError("Invalid OTP")),
    );

    yield* Effect.all([
      userRepo.update(storedOtp.userId, { emailVerified: true }),
      otpRepo.delete(
        SearchOps.and(
          SearchOps.eq("value", params.otp),
          SearchOps.eq("email", params.email),
        ),
      ),
    ]);
  });
}

/**
 * Find or create new user
 * */
export const findOrCreateUser = (
  input: z.infer<typeof confirmEscrowRequestRules>,
) => {
  const userRepo = UserRepoLayer.Tag;
  return userRepo.pipe(
    Effect.flatMap((repo) =>
      Effect.matchEffect(
        repo.firstOrThrow({ username: input.customerUsername }),
        {
          onSuccess: (user) => Effect.succeed(user),
          onFailure: (e) => handleUserCreationFromEscrow(input),
        },
      ),
    ),
  );
};

export const handleUserCreationFromEscrow = (
  input: z.infer<typeof confirmEscrowRequestRules>,
) => {
  return Effect.gen(function* (_) {
    const userRepo = yield* UserRepoLayer.Tag;
    const notify = yield* NotificationFacade;
    const [existingUserByEmail, existingUserByPhone] = yield* _(
      Effect.all([
        userRepo.count(SearchOps.eq("email", input.customerEmail)),
        userRepo.count(SearchOps.eq("phone", input.customerPhone)),
      ]),
    );

    if (existingUserByEmail) {
      yield* new ExpectedError("Email is already taken");
    }
    if (existingUserByPhone) {
      yield* new ExpectedError("Phone is already taken");
    }

    const newUser = yield* _(
      userRepo.create({
        firstName: "",
        lastName: "",
        password: "",
        email: input.customerEmail,
        phone: String(input.customerPhone),
        username: input.customerUsername,
      }),
      Effect.flatMap(head),
    );

    // notify the user of the newly create account
    yield* notify
      .route("mail", { address: input.customerEmail })
      .notify(new EscrowUserAccounntMail(input.customerUsername));

    return newUser;
  });
};

export const checkUsername = (username: string) => {
  return Effect.gen(function* (_) {
    const userRepo = yield* UserRepoLayer.Tag;
    const userDetails = yield* _(
      userRepo.firstOrThrow({ username }),
      Effect.matchEffect({
        onSuccess: () => new ExpectedError("Username taken"),
        onFailure: () => Effect.succeed(1),
      }),
    );
  });
};

export const UserWalletBalance = (currentUser: SessionUser) => {
  return Effect.gen(function* (_) {
    const walletRepo = yield* UserWalletRepoLayer.tag;
    const walletDetails = yield* walletRepo.firstOrThrow({
      userId: currentUser.id,
    });

    const balance = yield* getAccountBalance(walletDetails.tigerbeetleAccountId);
    return {
      walletBalance: convertCurrencyUnit(String(balance), "kobo-naira"),
    };
  });
};
