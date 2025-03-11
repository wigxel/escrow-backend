import { Effect, Layer } from "effect";
import type { TUser, User } from "~/migrations/schema";
import { UserRepo, type UserRepository } from "~/repositories/user.repository";
import { extendMockImplementation } from "~/tests/mocks/helpers";

const UserMock: UserRepository = {
  count() {
    return Effect.succeed(0);
  },

  // @ts-expect-error
  update(id: string, data: Partial<TUser>) {
    return Effect.succeed([
      {
        id,
        ...data,
      },
    ]);
  },

  create(data: User) {
    return Effect.succeed([
      {
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
        password:
          "$argon2id$v=19$m=19456,t=2,p=1$mxVZvfCeexfpkfp15EnDWQ$gG7x/+N0sXxqt86kwUlYr6k08+m10g9ql1VL6aQX/aA",
        address: "string",
        state: "string",
        country: "string",
        phone: "string",
        profilePicture: "string",
        emailVerified: false,
        createdAt: new Date(2025, 2, 22),
        updatedAt: new Date(2025, 2, 22),
      },
    ]);
  },

  firstOrThrow(where: Partial<TUser>) {
    return Effect.succeed({
      id: "user-id",
      firstName: "test data",
      lastName: "test data",
      email: "user@gmail.com",
      password:
        "$argon2id$v=19$m=19456,t=2,p=1$mxVZvfCeexfpkfp15EnDWQ$gG7x/+N0sXxqt86kwUlYr6k08+m10g9ql1VL6aQX/aA",
      address: "test data",
      state: "test data",
      country: "test data",
      phone: "test data",
      role: "user",
      profilePicture: "test data",
      emailVerified: true,
      createdAt: new Date(2025, 2, 21),
      updatedAt: new Date(2025, 2, 21),
    });
  },
  //@ts-expect-error
  find(arg1, arg2) {
    return Effect.succeed({
      id: "test-id",
      firstName: "test data",
      lastName: "test data",
      username: "",
      email: "user@gmail.com",
      password:
        "$argon2id$v=19$m=19456,t=2,p=1$mxVZvfCeexfpkfp15EnDWQ$gG7x/+N0sXxqt86kwUlYr6k08+m10g9ql1VL6aQX/aA",
      address: "test data",
      businessName: "",
      businessType: "tech",
      hasBusiness: true,
      state: "test data",
      country: "test data",
      phone: "test data",
      bvn: "",
      role: "user",
      profilePicture:
        "https://res.cloudinary.com/upload/images/v1234/imgae.jpg",
      emailVerified: true,
      createdAt: new Date(2025, 2, 21),
      updatedAt: new Date(2025, 2, 21),
    });
  },
};

export const extendUserRepoMock = extendMockImplementation(
  UserRepo,
  () => UserMock,
);

export const UserRepoTest = Layer.succeed(UserRepo, UserMock);
