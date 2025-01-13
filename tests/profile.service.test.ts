import { changePassword } from "~/services/auth.service";
import {
  editProfile,
  getProfile,
  uploadImage,
} from "~/services/profile.service";
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

  it("should upload user profile image", async () => {
    const program = uploadImage("test-id", {
      data: Buffer.from([0, 3]),
      filename: "MOCK_FILE_NAME",
    });

    const imageUploadResponse = await runTest(program);
    expect(imageUploadResponse).toMatchInlineSnapshot(`
      {
        "secure_url": "Skipping upload",
      }
    `);
  });
});
