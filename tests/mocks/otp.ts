import { Effect, Layer } from "effect";
import { extendMockImplementation } from "./helpers";
import { OtpRepo, type OtpRepository } from "../../repositories/otp.repository";

const mock: OtpRepository = {
  create: (data) => {
    return Effect.succeed([
      {
        id: "",
        userId: "user-id",
        email: "user-email",
        kind: "",
        otpReason: "EMAIL_VERIFICATION",
        value: "233233",
      },
    ]);
  },

  all: (params) => {
    return Effect.succeed([]);
  },

  count: (params) => {
    return Effect.succeed(1);
  },

  delete: (params) => {
    return Effect.void;
  },

  find: () => {
    throw new Error("Function not implemented.");
  },

  firstOrThrow: (arg) => {
    return Effect.succeed({
      id: "ty",
      userId: "user-id",
      email: "user-email",
      kind: "",
      otpReason: "EMAIL_VERIFICATION",
      value: "233233",
    });
  },

  update: () => {
    return Effect.succeed([
      {
        id: "ty",
        userId: "user-id",
        email: "user-email",
        kind: "",
        otpReason: "EMAIL_VERIFICATION",
        value: "233233",
      },
    ]);
  },
};

export const extendOtpRepo = extendMockImplementation(OtpRepo, () => mock);
export const OtpRepoTest = Layer.succeed(OtpRepo, mock);
