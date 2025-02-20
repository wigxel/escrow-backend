import { Effect } from "effect";
import { changePassword, login, logout } from "~/services/auth.service";
import { extendUserRepoMock } from "~/tests/mocks/user";
import { runTest } from "./mocks/app";

describe("Authentication and authorization service", () => {
  describe("Login", () => {
    it("should login user", async () => {
      const loginResult = runTest(
        login({ body: { email: "user@gmail", password: "pass123" } }),
      );

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
      const program = login({
        body: {
          email: "user@gmail.com",
          password: "MOCK_WRONG_PASSWORD",
        },
      });

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
      const userRepo = extendUserRepoMock({
        firstOrThrow() {
          return Effect.succeed({
            id: "test-id",
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
            emailVerified: false,
          });
        },
      });

      const program = Effect.scoped(
        Effect.provide(
          login({
            body: {
              email: "user1@example.com",
              password: "pass123",
            },
          }),
          userRepo,
        ),
      );

      const response = runTest(program);

      expect(response).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Please verify your email user1@example.com. We sent a verification email to your inbox]`,
      );
    });
  });

  describe("Password change", () => {
    const currentUser = {
      email: "user@gmail.com",
      phone: "",
      id: "USER-MOCK-ID",
      username: "",
    };

    it("should change user password", async () => {
      let updated = false;
      const userRepo = extendUserRepoMock({
        // @ts-expect-error
        update(id: string, data) {
          updated = true;
          return Effect.succeed([{ email: "email" }]);
        },
      });

      const program = Effect.provide(
        changePassword({
          currentUser,
          oldPassword: "pass123",
          newPassword: "newpass",
        }),
        userRepo,
      );

      const response = await runTest(program);

      expect(updated).toBeTruthy();
      expect(response).toMatchInlineSnapshot(`
        {
          "data": null,
          "message": "Password changed successful",
          "status": "success",
        }
      `);
    });

    it("should fail if currentPassword doesn't match", async () => {
      const program = changePassword({
        currentUser,
        oldPassword: "p@ss123",
        newPassword: "newpass",
      });

      const response = runTest(program);

      expect(response).resolves.toMatchInlineSnapshot(
        `[PasswordHasherError: Password verification failed]`,
      );
    });
  });

  describe("Logout actions", () => {
    test("a user can logout with access token", async () => {
      const program = logout({ access_token: "MOCK_ACCESS_TOKEN" });
      const response = runTest(program);

      expect(response).resolves.toMatchInlineSnapshot(`
        {
          "message": "Session terminated",
        }
      `);
    });
  });
});
