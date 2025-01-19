import { Effect } from "effect";
import type { MemberRole, NewUser, User } from "~/migrations/schema";
import { UserRepo, type UserRepository } from "~/repositories/user.repository";
import { extendMockImplementation } from "~/tests/mocks/helpers";

const MockMethods: UserRepository = {
  count() {
    return Effect.succeed(0);
  },

  // @ts-expect-error
  update(id: string, data: Partial<User>) {
    return Effect.succeed([
      {
        id,
        ...data,
      },
    ]);
  },

  create(data: Required<NewUser>) {
    return Effect.succeed([data]);
  },

  getUserById(id) {
    return Effect.succeed({
      id: "test-id",
      firstName: "test data",
      lastName: "test data",
      email: "johndoe@example.com",
      password:
        "$argon2id$v=19$m=19456,t=2,p=1$mxVZvfCeexfpkfp15EnDWQ$gG7x/+N0sXxqt86kwUlYr6k08+m10g9ql1VL6aQX/aA",
      address: "test data",
      state: "test data",
      country: "test data",
      phone: "test data",
      role: "BUYER" as MemberRole,
      profilePicture: "test data",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  },

  firstOrThrow(where: Partial<User>) {
    return Effect.succeed({
      id: "test-id",
      firstName: "test data",
      lastName: "test data",
      email: "johndoe@example.com",
      password:
        "$argon2id$v=19$m=19456,t=2,p=1$mxVZvfCeexfpkfp15EnDWQ$gG7x/+N0sXxqt86kwUlYr6k08+m10g9ql1VL6aQX/aA",
      address: "test data",
      state: "test data",
      country: "test data",
      phone: "test data",
      role: "BUYER" as MemberRole,
      profilePicture: "test data",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  },
};

export const extendUserRepoMock = extendMockImplementation(UserRepo, () => ({
  ...MockMethods,
}));

export const UserRepoTest = extendUserRepoMock(MockMethods);
