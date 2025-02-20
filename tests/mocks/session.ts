import { Effect, Layer } from "effect";
import { randomUUID } from "uncrypto";
import { Session, type SessionImpl } from "~/layers/session";

export const SesssionTest = Layer.effect(
  Session,
  Effect.gen(function* (_) {
    const UserLive: SessionImpl = {
      create(_user_id: string) {
        return Effect.succeed({
          session_id: randomUUID(),
          expires_at: new Date(),
        });
      },

      validate(_token: string) {
        return Effect.succeed({
          session: {
            id: randomUUID(),
            expiresAt: new Date(),
            fresh: true,
            userId: randomUUID(),
          },
          user: { id: randomUUID(), email: "", phone: "", username: "" },
        });
      },

      getUser(_user: { id: string }) {
        return Effect.succeed({
          role: "user",
          id: "user_id",
          bvn: "",
          hasBusiness: false,
          referralSourceId: 1,
          businessType: "",
          businessName: "",
          username: "",
          firstName: "string",
          lastName: "string",
          email: "string",
          password: "string",
          address: "string",
          state: "string",
          country: "string",
          phone: "string",
          profilePicture: "string",
          emailVerified: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      },

      invalidate(_session_id: string) {
        return Effect.succeed(Effect.void);
      },
    };

    return UserLive;
  }),
);
