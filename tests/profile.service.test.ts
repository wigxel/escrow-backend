import { changePassword } from "~/services/auth.service";
import { editProfile, getProfile } from "~/services/profile.service";
import { runTest } from "./mocks/app";

describe("Profile service", () => {
  it("should get user profile", async () => {
    const program = getProfile("test-id");

    const user = await runTest(program);
    expect(user.id).toBe("test-id");
  });

  it("should change user profile", async () => {
    const program = editProfile("test-id", { firstName: "New Test Name" });

    const user = await runTest(program);
    expect(user.id).toBe("test-id");
    expect(user.firstName).toBe("New Test Name");
  });

  it("should fail user password change", async () => {
    const program = changePassword("test-id", "pas123", "newpass");

    expect(await runTest(program)).toMatchInlineSnapshot(
      `[PasswordHasherError: Password verification failed]`,
    );
  });
});
