import { Effect, Layer } from "effect";
import { QueryError } from "~/config/exceptions";
import { OtpRepo, OtpRepository } from "~/repositories/otp.repository";
import { generateOTP } from "~/services/otp/otp.service";

export const readOTP = Effect.cached(generateOTP()).pipe(Effect.flatten);

export const OTPRepoTest = Layer.effect(
  OtpRepo,
  Effect.gen(function* (_) {
    const otp = yield* readOTP;

    class OtpRepositoryMock extends OtpRepository {
      deleteOne(otp_: string) {
        if (otp !== otp_)
          return Effect.fail(new QueryError("Unable to delete OTP"));

        return Effect.succeed([]);
      }

      findOne(optVal: string) {
        if (optVal === otp) {
          return Effect.succeed({
            userId: "MOCK_USER_ID",
            otpReason: "EMAIL_VERIFICATION" as const,
            value: otp,
            userKind: "MOCK_USER_TYPE",
            id: "10",
          });
        }
        return Effect.succeed(null);
      }
    }

    return new OtpRepositoryMock();
  }),
);
