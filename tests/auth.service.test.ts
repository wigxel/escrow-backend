import { Effect, Layer } from "effect";
import { verifyPassword } from "~/layers/encryption/helpers";
import { changePassword, login, logout } from "~/services/auth.service";
import { extendPasswordHasher } from "~/tests/mocks/password-hasher";
import { extendUserRepoMock } from "~/tests/mocks/user";
import { AppTest, runTest } from "./mocks/app";

describe("Authentication service", () => {
  it("should login user", async () => {
    const program = Effect.scoped(
      Effect.provide(
        login({ body: { email: "johndoe@example.com", password: "pass123" } }),
        AppTest,
      ),
    );

    const loginResult = runTest(program);

    expect(loginResult).resolves.toMatchObject(
      expect.objectContaining({
        message: "Login successful",
        data: expect.objectContaining({
          access_token: expect.anything(),
          expires: expect.anything(),
        }),
      }),
    );
  });

  it("should fail user for wrong password", async () => {
    const program = Effect.scoped(
      Effect.provide(
        login({
          body: {
            email: "johndoe@example.com",
            password: "MOCK_WRONG_PASSWORD",
          },
        }),
        AppTest,
      ),
    );

    const response = runTest(program);

    expect(response).resolves.toMatchInlineSnapshot(
      `[PermissionError: Invalid username or password provided]`,
    );
  });

  it("should fail user for wrong email", async () => {
    const userMock = extendUserRepoMock({
      firstOrThrow() {
        return Effect.fail(new Error("User doesn't exists"));
      },
    });

    const program = Effect.provide(
      login({
        body: {
          email: "MOCK_WRONG_EMAIL",
          password: "MOCK_WRONG_PASSWORD",
        },
      }),
      userMock,
    );

    const response = runTest(program);

    expect(response).resolves.toMatchInlineSnapshot(
      `[PermissionError: Invalid username or password provided]`,
    );
  });

  test("unverified users should verify account before login", async () => {
    const program = Effect.scoped(
      Effect.provide(
        login({
          body: {
            email: "user1@example.com",
            password: "pass123",
          },
        }),
        AppTest,
      ),
    );

    const response = runTest(program);

    expect(response).resolves.toMatchInlineSnapshot(
      `[ExpectedError: Please verify your email user1@example.com. We sent a verification email to your inbox]`,
    );
  });
});

it("should change user password", async () => {
  const program = changePassword("test-id", "pass123", "newpass");

  const user = await runTest(program);
  const passwordChanged = runTest(verifyPassword("newpass", user.password));

  expect(user.id).toBe("test-id");
  expect(passwordChanged).resolves.toMatchInlineSnapshot(
    `"Password verification successful"`,
  );
});

describe("Password change", () => {
  it("should change user password", async () => {
    const program = Effect.scoped(
      Effect.provide(changePassword("test-id", "pass123", "newpass"), AppTest),
    );

    const user = await runTest(program);
    const passwordChanged = runTest(verifyPassword("newpass", user.password));

    expect(user.id).toBe("test-id");
    expect(passwordChanged).resolves.toMatchInlineSnapshot(
      `"Password verification successful"`,
    );
  });

  it("should fail if currentPassword doesn't match", async () => {
    const WRONG_PASSWORD = "p@ss123";
    const effect = changePassword("MOCK_USER_ID", WRONG_PASSWORD, "newpass");

    const userRepoTest = extendUserRepoMock({
      // @ts-expect-error
      firstOrThrow() {
        return Effect.succeed({ password: "MOCK_PASSWORD_HASH" });
      },
    });

    const mockPasswordHash = extendPasswordHasher({
      verify(password, hash) {
        return Effect.succeed(false);
      },
    });

    const program = Effect.provide(
      effect,
      mockPasswordHash.pipe(Layer.provideMerge(userRepoTest)),
    );

    const user = await runTest(program);

    expect(user).toMatchInlineSnapshot(
      `[PasswordHasherError: Password verification failed]`,
    );
  });
});

describe("Logout actions", () => {
  test("a user can logout with access token", async () => {
    const program = Effect.scoped(
      Effect.provide(logout({ access_token: "MOCK_ACCESS_TOKEN" }), AppTest),
    );

    const response = runTest(program);

    expect(response).resolves.toMatchInlineSnapshot(`
      {
        "message": "Session terminated",
      }
    `);
  });
  test.skip("a user can logout without access token", () => {});
});
