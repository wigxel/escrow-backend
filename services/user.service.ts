import { Effect } from "effect";
import { head } from "effect/Array";
import { EmailVerificationMail } from "~/app/mail/email-verification";
import { PasswordResetMail } from "~/app/mail/password-reset";
import { ExpectedError } from "~/config/exceptions";
import { PasswordHasherError } from "~/layers/encryption";
import { hashPassword } from "~/layers/encryption/helpers";
import { Mail } from "~/layers/mailing/mail";
import { Session } from "~/layers/session";
import type { TUser } from "~/migrations/tables/interfaces";
import { OtpRepo } from "~/repositories/otp.repository";
import { UserRepoLayer, UserRepository } from "~/repositories/user.repository";
import { generateOTP, verifyOTP } from "./otp/otp.service";
import { SearchOps } from "./search/sql-search-resolver";
import type { confirmEscrowRequestRules } from "~/validationRules/escrowTransactions.rules";
import type { z } from "zod";

export function createUser(data: TUser) {
  return Effect.gen(function* (_) {
    const mail = yield* Mail;
    const userRepo = yield* UserRepoLayer.Tag;
    const sessionManager = yield* Session;
    const hashProgram = hashPassword(data.password).pipe(
      Effect.mapError(
        () => new PasswordHasherError("Password encryption failed"),
      ),
    );

    data.password = yield* hashProgram;

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

    const user = yield* _(userRepo.create(data), Effect.flatMap(head));
    const otp = yield* generateOTP();

    const otpRepo = yield* OtpRepo;
    yield* otpRepo.create({
      userId: user.id,
      userKind: "USER",
      otpReason: "EMAIL_VERIFICATION",
      value: otp,
    });

    const session_data = yield* sessionManager.create(user.id);

    yield* mail
      .to([user.email, user.firstName])
      .send(new EmailVerificationMail(user, otp));

    return {
      session: session_data,
      user,
    };
  });
}

export function requestEmailVerificationOtp(
  email: string,
  type: "verify" | "reset",
) {
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

    if (type === "verify" && user.emailVerified)
      return yield* new ExpectedError("Email already verified");

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

    return {
      success: true,
      message: "OTP has been sent to email",
    };
  });
}

export function forgotPassword(email: string) {
  return Effect.gen(function* (_) {
    const mail = yield* Mail;
    const userRepo = yield* UserRepoLayer.Tag;

    const user = yield* userRepo.firstOrThrow({ email });

    if (!user) {
      // REASON: Giving a vague response for security reasons
      return new ExpectedError("Request is being processed");
    }

    const otp = yield* generateOTP();

    const otpRepo = yield* OtpRepo;
    yield* otpRepo.create({
      userId: user.id,
      userKind: "USER",
      otpReason: "PASSWORD_RESET",
      value: otp,
    });

    yield* mail
      .to([user.email, user.firstName])
      .send(new PasswordResetMail(user, otp));

    return {
      success: true,
      message: "OTP has been sent to email",
    };
  });
}

export function passwordReset(data: { otp: string; password: string }) {
  return Effect.gen(function* (_) {
    yield* verifyOTP(data.otp);

    const otpRepo = yield* OtpRepo;
    const storedOtp = yield* otpRepo.findOne(data.otp);

    if (!storedOtp) {
      return yield* new ExpectedError("Invalid OTP");
    }

    const hashedPassword = yield* hashPassword(data.password);

    const userRepo = yield* UserRepoLayer.Tag;
    yield* _(
      userRepo.update(storedOtp.userId, {
        password: hashedPassword,
        emailVerified: true, // REASON: Password resets should make user verified. See: https://thecopenhagenbook.com/password-reset
      }),
      Effect.mapError((err) => new ExpectedError("Invalid user")),
    );

    yield* otpRepo.deleteOne(data.otp);

    return {
      success: true,
      message: "Password updated",
    };
  });
}

export function verifyUserEmail(otp: string) {
  return Effect.gen(function* () {
    yield* verifyOTP(otp);

    const otpRepo = yield* OtpRepo;
    const storedOtp = yield* otpRepo.findOne(otp);

    if (!storedOtp) {
      return yield* new ExpectedError("Invalid OTP");
    }

    const userRepo = yield* UserRepoLayer.Tag;
    yield* userRepo.update(storedOtp.userId, { emailVerified: true });

    yield* otpRepo.deleteOne(otp);

    return {
      success: true,
      message: "Email verified",
    };
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
      Effect.matchEffect(repo.firstOrThrow({ email: input.customerEmail }), {
        onSuccess: (user) => Effect.succeed(user),
        onFailure: (e) => handleUserCreationFromEscrow(input),
      }),
    ),
  );
};

export const handleUserCreationFromEscrow = (
  input: z.infer<typeof confirmEscrowRequestRules>,
) => {
  return Effect.gen(function* (_) {
    const userRepo = yield* UserRepoLayer.Tag;
    const mail = yield* Mail;
    const [existingUserByUsername, existingUserByPhone] = yield* _(
      Effect.all([
        userRepo.count(SearchOps.eq("username", input.customerUsername)),
        userRepo.count(SearchOps.eq("phone", input.customerPhone)),
      ]),
    );

    if (existingUserByUsername) {
      yield* new ExpectedError("Username is already taken");
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

    //send an email to the user to notify of newly created account
  });
};
