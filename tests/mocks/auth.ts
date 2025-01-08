import { Effect } from "effect";
import { AuthUser, AuthUserService } from "~/layers/auth-user";
import { extendMockImplementation } from "~/tests/mocks/helpers";

const users = [
  {
    user_id: "test-id",
    first_name: "string",
    email: "johndoe@example.com",
    password:
      "$argon2id$v=19$m=19456,t=2,p=1$mxVZvfCeexfpkfp15EnDWQ$gG7x/+N0sXxqt86kwUlYr6k08+m10g9ql1VL6aQX/aA",
    email_verified: true,
  },
  {
    user_id: "test-id2",
    first_name: "string",
    email: "user1@example.com",
    password:
      "$argon2id$v=19$m=19456,t=2,p=1$mxVZvfCeexfpkfp15EnDWQ$gG7x/+N0sXxqt86kwUlYr6k08+m10g9ql1VL6aQX/aA",
    email_verified: false,
  },
];

export const extendAuthUser = extendMockImplementation(
  AuthUser,
  () => new AuthUserService(),
);

export const AuthUserTest = extendAuthUser({
  getUserRecord(body: { email: string }) {
    if (!body.email) return Effect.succeed(users[0]);
    return Effect.succeed(users.find((user) => user.email === body.email));
  },
});
