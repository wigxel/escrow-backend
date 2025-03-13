import { Effect, Layer } from "effect";
import { Session, type SessionImpl } from "../../../layers/session";

export const SesssionTest = Layer.effect(
  Session,
  Effect.gen(function* (_) {
    const UserLive: SessionImpl = {
      create(_user_id: string) {
        return Effect.succeed({
          session_id: "session-id",
          expires_at: new Date(2025, 2, 22),
        });
      },

      validate(_token: string) {
        return Effect.succeed({
          session: {
            id: "session-id",
            expiresAt: new Date(2025, 2, 22),
            fresh: true,
            userId: "user-id",
          },
          user: { id: "user-id", email: "", phone: "", username: "" },
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
          createdAt: new Date(2025, 2, 22),
          updatedAt: new Date(2025, 2, 22),
        });
      },

      invalidate(_session_id: string) {
        return Effect.succeed(Effect.void);
      },
    };

    return UserLive;
  }),
);
