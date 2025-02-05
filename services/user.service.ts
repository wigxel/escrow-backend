import { Effect } from "effect";
import { head } from "effect/Array";
import { EmailVerificationMail } from "~/app/mail/email-verification";
import { PasswordResetMail } from "~/app/mail/password-reset";
import { ExpectedError } from "~/config/exceptions";
import { PasswordHasherError } from "~/layers/encryption";
import { hashPassword } from "~/layers/encryption/helpers";
import { Mail } from "~/layers/mailing/mail";
import { Session } from "~/layers/session";
import { OtpRepo } from "~/repositories/otp.repository";
import { UserRepoLayer } from "~/repositories/user.repository";
import { generateOTP, verifyOTP } from "./otp/otp.service";
import { SearchOps } from "./search/sql-search-resolver";
import type { confirmEscrowRequestRules } from "~/dto/escrowTransactions.dto";
import type { z } from "zod";
import { ReversibleHash } from "~/layers/encryption/reversible";
import { ReferralSourcesRepoLayer } from "~/repositories/referralSource.repo";
import type { createUserDto } from "~/dto/user.dto";
import { id } from "tigerbeetle-node";
import { createAccount } from "./tigerbeetle.service";
import { TBAccountCode } from "~/utils/tigerBeetle/type/type";
import { UserWalletRepoLayer } from "~/repositories/userWallet.repo";

export function createUser(data: z.infer<typeof createUserDto>) {
  return Effect.gen(function* (_) {
    const mail = yield* Mail;
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
      userKind: "USER",
      otpReason: "EMAIL_VERIFICATION",
      value: otp,
    });

    const session_data = yield* sessionManager.create(user.id);

    yield* _(
      mail
        .to([user.email, user.firstName])
        .send(new EmailVerificationMail(user, otp)),
      Effect.match({ onFailure: () => {}, onSuccess: () => {} }),
    );

    return {
      session: session_data,
      user,
    };
  });
}

export function resendEmailVerificationOtp(email: string) {
  return Effect.gen(function* (_) {
    const mail = yield* Mail;
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

    yield* otpRepo.create({
      userId: user.id,
      userKind: "USER",
      otpReason: "EMAIL_VERIFICATION",
      value: otp,
    });

    yield* mail
      .to([user.email, user.firstName])
      .send(new EmailVerificationMail(user, otp));
  });
}

export function forgotPassword(email: string) {
  return Effect.gen(function* (_) {
    const mail = yield* Mail;
    const userRepo = yield* UserRepoLayer.Tag;
    const otpRepo = yield* OtpRepo;

    const otp = yield* generateOTP();

    const user = yield* _(
      userRepo.firstOrThrow({ email }),
      Effect.mapError(() => new ExpectedError("Request is being processed")),
    );

    yield* otpRepo.create({
      userId: user.id,
      userKind: "USER",
      otpReason: "PASSWORD_RESET",
      value: otp,
    });

    yield* mail
      .to([user.email, user.firstName])
      .send(new PasswordResetMail(user, otp));
  });
}

export function passwordReset(data: { otp: string; password: string }) {
  return Effect.gen(function* (_) {
    const otpRepo = yield* OtpRepo;
    const userRepo = yield* UserRepoLayer.Tag;

    yield* verifyOTP(data.otp);
    const storedOtp = yield* _(
      otpRepo.firstOrThrow({value:data.otp}),
      Effect.mapError(() => new ExpectedError("Invalid OTP")),
    );

    yield* _(
      userRepo.update(storedOtp.userId, {
        password: yield* hashPassword(data.password),
        emailVerified: true, // REASON: Password resets should make user verified. See: https://thecopenhagenbook.com/password-reset
      }),
      Effect.mapError((err) => new ExpectedError("Invalid user")),
    );

    yield* otpRepo.delete(SearchOps.eq("value", data.otp));
  });
}

export function verifyUserEmail(otp: string) {
  return Effect.gen(function* (_) {
    const userRepo = yield* UserRepoLayer.Tag;
    const otpRepo = yield* OtpRepo;

    yield* verifyOTP(otp);
    const storedOtp = yield* _(
      otpRepo.firstOrThrow({ value: otp }),
      Effect.mapError(() => new ExpectedError("Invalid OTP")),
    );

    yield* Effect.all([
      userRepo.update(storedOtp.userId, { emailVerified: true }),
      otpRepo.delete(SearchOps.eq("value", otp)),
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
    const mail = yield* Mail;
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

    return yield* _(
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

    //TODO: send an email to the user to notify of newly created account
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
