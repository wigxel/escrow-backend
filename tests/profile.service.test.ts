import {
  editProfile,
  getProfile,
  uploadAvatarImage,
} from "~/services/profile.service";
import { runTest } from "./mocks/app";
import { extendUserRepoMock } from "./mocks/user/user";
import { Effect, Layer } from "effect";
import { notNil } from "~/libs/query.helpers";
import { extendFileStorageTest } from "./mocks/filestorageMock";

describe("Profile service", () => {
  describe("Get profile", () => {
    test("should fail if invalid user id", () => {
      const userRepo = extendUserRepoMock({
        firstOrThrow() {
          return Effect.succeed(undefined).pipe(Effect.flatMap(notNil));
        },
      });

      const program = getProfile("user-id");
      const result = runTest(Effect.provide(program, userRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        "[ExpectedError: User not found]",
      );
    });

    test("should get user profile", async () => {
      const program = getProfile("test-id");
      const result = await runTest(program);
      expect(result).toMatchInlineSnapshot(`
        {
          "data": {
            "address": "test data",
            "country": "test data",
            "createdAt": 2025-03-20T23:00:00.000Z,
            "email": "user@gmail.com",
            "emailVerified": true,
            "firstName": "test data",
            "id": "user-id",
            "lastName": "test data",
            "phone": "test data",
            "profilePicture": "test data",
            "role": "user",
            "state": "test data",
            "updatedAt": 2025-03-20T23:00:00.000Z,
          },
          "status": "success",
        }
      `);
    });
  });

  describe("Edit profile", () => {
    test("should update user profile", async () => {
      let updated = false;
      const userRepo = extendUserRepoMock({
        update() {
          updated = true;
          return Effect.succeed([]);
        },
      });
      const program = editProfile("test-id", {
        firstName: "New Test Name",
      });
      const result = await runTest(Effect.provide(program, userRepo));
      expect(updated).toBeTruthy();
      expect(result).toMatchInlineSnapshot(`
        {
          "data": null,
          "message": "Profile edited successfully",
          "status": "success",
        }
      `);
    });
  });

  describe("Upload avatar", () => {
    const image = { name: "pix.jpg", type: "image/jpeg" } as File;
    test("should fail user not found", () => {
      const userRepo = extendUserRepoMock({
        firstOrThrow() {
          return Effect.succeed(undefined).pipe(Effect.flatMap(notNil));
        },
      });

      const program = uploadAvatarImage("user-id", image);
      const result = runTest(Effect.provide(program, userRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        "[ExpectedError: User not found]",
      );
    });

    test("should upload user profile image", async () => {
      let isProfileUpdated = false;
      let isImageUploaded = false;
      let isPrevImageDeleted = false;
      const userRepo = extendUserRepoMock({
        update() {
          isProfileUpdated = true;
          return Effect.succeed([]);
        },
      });

      const fileUploadMock = extendFileStorageTest({
        uploadFile() {
          isImageUploaded = true;
          return Promise.resolve({ fileUrl: "", fileId: "", metadata: {} });
        },

        deleteFile() {
          isPrevImageDeleted = true;
          return Promise.resolve();
        },
      });

      const program = uploadAvatarImage("user-id", image);
      const result = await runTest(
        Effect.provide(program, Layer.merge(userRepo, fileUploadMock)),
      );
      expect(isImageUploaded).toBeTruthy();
      expect(isProfileUpdated).toBeTruthy();
      expect(isPrevImageDeleted).toBeTruthy();
      expect(result).toMatchInlineSnapshot(`
        {
          "data": {
            "fileUrl": "",
          },
          "status": "success",
        }
      `);
    });
  });
});
