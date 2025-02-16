import { Config, Effect, Redacted } from "effect";
import { TaggedError } from "effect/Data";
import { TimeSpan } from "oslo";
import { TOTPController } from "oslo/otp";
import { base64ToArrayBuffer } from "~/services/otp/otp.util";

export const readOTPSecret = Effect.cached(
  Effect.gen(function* () {
    const secret_string = yield* Config.redacted("OTP_SECRET");
    const otp_secret = Redacted.value(secret_string);

    return yield* Effect.try({
      try: () => base64ToArrayBuffer(otp_secret),
      catch: (err) => {
        console.log(">>> ", otp_secret, err);
        return new OTPError(
          "Error validating secret. Invalid OTP Secret provided",
        );
      },
    });
  }),
).pipe(Effect.flatten);

const otpService = new TOTPController({
  period: new TimeSpan(30, "m"),
});

export const generateOTP = () => {
  return readOTPSecret.pipe(
    Effect.flatMap((secret) =>
      Effect.tryPromise({
        try: () => otpService.generate(secret),
        catch: (err) => {
          return new OTPError(String(err));
        },
      }),
    ),
  );
};

export const verifyOTP = (otp: string) => {
  return readOTPSecret.pipe(
    Effect.flatMap((secret) => {
      return Effect.tryPromise({
        try: () => otpService.verify(otp, secret),
        catch: () => {
          return new OTPError("Error verifying OTP");
        },
      });
    }),
  );
};

export class OTPError extends TaggedError("OTPError") {
  constructor(public message: string) {
    super();
  }
}
