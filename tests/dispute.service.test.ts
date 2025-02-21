import { Effect, Layer } from "effect";
import { notNil } from "~/libs/query.helpers";
import {
  createDispute,
  createMessagingChannel,
  inviteMember,
  removeMember,
  updateDisputeStatus,
} from "~/services/dispute/dispute.service";
import { runTest } from "./mocks/app";
import { extendDisputeMemberRepo } from "./mocks/dispute/disputeMembersRepo";
import { extendDisputeRepo } from "./mocks/dispute/disputeRepoMock";
import { extendUserRepoMock } from "./mocks/user";
import { extendEscrowTransactionRepo } from "./mocks/escrow/escrowTransactionRepoMock";
import { extendDisputeCategoryRepo } from "./mocks/dispute/disputeCategoryMock";
import { extendDisputeResolutionyRepo } from "./mocks/dispute/disputeResolutionMock";
import { extendEscrowParticipantRepo } from "./mocks/escrow/escrowParticipantsRepoMock";
import { NoSuchElementException } from "effect/Cause";
import { extendChatServiceTest } from "./mocks/chatServiceMock";
import { extendFileStorageTest } from "./mocks/filestorageMock";

describe("Dispute service", () => {
  describe("create new dispute", () => {
    const disputeData = {
      escrowId: "escrow-id",
      reason: "reason",
      file: { type: "image/jpeg", name: "pix.jpg" } as File,
    };

    const currentUser = {
      id: "buyer-id",
      email: "user@gmail.com",
      phone: "",
      username: "",
    };

    test("should fail if invalid escrow id", async () => {
      const escrowRepo = extendEscrowTransactionRepo({
        firstOrThrow(where) {
          return Effect.succeed(undefined).pipe(Effect.flatMap(notNil));
        },
      });

      const program = createDispute({ currentUser, disputeData });

      const result = runTest(Effect.provide(program, escrowRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Invalid Escrow ID]`,
      );
    });

    test("should fail if invalid dispute category id", () => {
      const disputeCategoryRepo = extendDisputeCategoryRepo({
        firstOrThrow() {
          return Effect.succeed(undefined).pipe(Effect.flatMap(notNil));
        },
      });

      const program = createDispute({ currentUser, disputeData });

      const result = runTest(Effect.provide(program, disputeCategoryRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Invalid Dispute Category ID]`,
      );
    });

    test("should fail if invalid dispute resolution id", () => {
      const disputeResolutionRepo = extendDisputeResolutionyRepo({
        firstOrThrow() {
          return Effect.succeed(undefined).pipe(Effect.flatMap(notNil));
        },
      });

      const program = createDispute({ currentUser, disputeData });

      const result = runTest(Effect.provide(program, disputeResolutionRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Invalid Dispute Resolution ID]`,
      );
    });

    test("should fail if buyer or seller not a participant", async () => {
      const escrowParticipantRepo = extendEscrowParticipantRepo({
        getParticipants(escrowId) {
          return Effect.succeed([
            {
              id: "user-id",
              escrowId: "escrow-id",
              userId: "seller-id",
              role: "buyer",
              status: "active",
            },
          ]);
        },
      });

      const program = createDispute({ currentUser, disputeData });

      const result = runTest(Effect.provide(program, escrowParticipantRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Invalid participants. Seller or buyer not found.]`,
      );
    });

    test("should fail if authenticated user isn't part of the escrow transaction", async () => {
      const program = createDispute({
        currentUser: { ...currentUser, id: "id" },
        disputeData,
      });

      const result = runTest(program);
      expect(result).resolves.toMatchInlineSnapshot(
        `[PermissionError: cannot create dispute]`,
      );
    });

    test("should fail if escrow status cannot be transition to dispute", () => {
      const escrowRepo = extendEscrowTransactionRepo({
        firstOrThrow(where) {
          return Effect.succeed({
            id: "test-id",
            status: "created",
            title: "",
            description: "",
            createdBy: "",
            createdAt: new Date(2025, 2, 20),
            updatedAt: new Date(2025, 2, 20),
          });
        },
      });

      const program = createDispute({ currentUser, disputeData });

      const result = runTest(Effect.provide(program, escrowRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Cannot transition from created to dispute]`,
      );
    });

    test("should fail if dispute already created", () => {
      const program = createDispute({ currentUser, disputeData });

      const result = runTest(program);
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Escrow already has an open dispute]`,
      );
    });

    test("should create new dispute", async () => {
      let disputeCreated = false;
      let createdMessageChannel = false;
      let isFileUploaded = false;
      let messageSentCount = 0;
      const disputeRepo = extendDisputeRepo({
        firstOrThrow(escrow, id) {
          return Effect.fail(new NoSuchElementException());
        },

        create(data) {
          disputeCreated = true;
          return Effect.succeed([
            {
              id: "test-id",
              escrowId: "escrow-id",
              status: "pending",
              createdBy: "creator-id",
              acceptedBy: "",
              categoryId: 1,
              resolutionId: 1,
              creatorRole: "seller",
              reason: "reason for dispute",
              resolvedBy: "",
              createdAt: new Date(2025, 2, 21),
            },
          ]);
        },
      });
      const chatServiceMock = extendChatServiceTest({
        startConversation(params) {
          createdMessageChannel = true;
          return Promise.resolve();
        },
        sendMessage(params) {
          messageSentCount += 1;
          return Promise.resolve();
        },
      });
      const filestorageMock = extendFileStorageTest({
        uploadFile() {
          isFileUploaded = true;
          return Promise.resolve({ fileId: "", fileUrl: "", metadata: {} });
        },
      });

      const program = createDispute({ currentUser, disputeData });

      const result = await runTest(
        Effect.provide(
          program,
          disputeRepo.pipe(
            Layer.provideMerge(chatServiceMock),
            Layer.provideMerge(filestorageMock),
          ),
        ),
      );
      expect(disputeCreated).toBeTruthy();
      expect(createdMessageChannel).toBeTruthy()
      expect(isFileUploaded).toBeTruthy()
      /**
       * count both messages sent, image and dispute reason
       */
      expect(messageSentCount).toBe(2)
      expect(result).toMatchInlineSnapshot(`
        {
          "data": {
            "dispute": {
              "acceptedBy": "",
              "categoryId": 1,
              "createdAt": 2025-03-20T23:00:00.000Z,
              "createdBy": "creator-id",
              "creatorRole": "seller",
              "escrowId": "escrow-id",
              "id": "test-id",
              "reason": "reason for dispute",
              "resolutionId": 1,
              "resolvedBy": "",
              "status": "pending",
            },
          },
          "status": "success",
        }
      `);
    });

    test.skip("should add dispute creator to dispute members", async () => {
      let addDisputeMember = false;
      const disputeRepo = extendDisputeRepo({
        firstOrThrow(escrow, id) {
          return Effect.succeed(undefined).pipe(Effect.flatMap(notNil));
        },
      });
      const disputeMemberRepo = extendDisputeMemberRepo({
        //@ts-expect-error
        create(data) {
          addDisputeMember = true;
          return Effect.succeed({});
        },
      });
      const program = newDispute({
        currentUser: { id: "seller-id" },
        disputeData,
      });

      const result = await runTest(
        Effect.provide(program, Layer.merge(disputeMemberRepo, disputeRepo)),
      );
      expect(result).toMatchInlineSnapshot(`
        {
          "data": {
            "disputeStatus": "pending",
          },
          "status": true,
        }
      `);
      expect(addDisputeMember).toBeTruthy();
    });
  });

  describe.skip("create messaging channel", () => {
    const userIds = ["user-1", "user-2"];
    const channel_id = "MOCK-CHANNEL-ID";

    test("should fetch user details", async () => {
      let userFetchCount = 0;
      const userRepo = extendUserRepoMock({
        //@ts-expect-error
        find() {
          userFetchCount += 1;
          return Effect.succeed({
            id: "",
            email: "",
            firstName: "",
            lastName: "",
            phone: "",
            password: "",
            emailVerified: true,
            profilePicture: "",
            referralSourceId: "",
            role: "user",
            businessName: "",
            businessType: "tech",
            hasBusiness: true,
            username: "",
            bvn: "",
          });
        },
      });

      const program = createMessagingChannel({ channel_id, userIds });
      const result = await runTest(Effect.provide(program, userRepo));
      expect(userFetchCount).toBe(userIds.length);
      expect(result).toMatchInlineSnapshot(`
        {
          "sendMessage": [Function],
          "startConversation": [Function],
        }
      `);
    });
  });

  describe.skip("get user Disputes", () => {
    test("should return empty array if user has no dispute", async () => {
      const disputeMemberRepo = extendDisputeMemberRepo({
        // @ts-expect-error
        find(arg1: T, arg2) {
          return Effect.succeed([]);
        },
      });

      const program = getUserDisputes("current-user-id");
      const result = await runTest(Effect.provide(program, disputeMemberRepo));
      expect(result).toMatchInlineSnapshot(`
        {
          "data": [],
          "status": true,
        }
      `);
    });
    test("should return dispute lists", async () => {
      const disputeMemberRepo = extendDisputeMemberRepo({
        all(arg1) {
          return Effect.succeed([{ disputeId: "dispute-id" }]);
        },
      });

      const program = getUserDisputes("current-user-id");
      const result = await runTest(Effect.provide(program, disputeMemberRepo));
      expect(result).toMatchInlineSnapshot(`
        {
          "data": [
            {
              "createdAt": 2024-07-29T23:00:00.000Z,
              "id": "id",
              "status": "pending",
            },
          ],
          "status": true,
        }
      `);
    });
  });

  describe.skip("update dispute status", () => {
    test("should fail if dispute id doesn't exist", async () => {
      const disputeRepo = extendDisputeRepo({
        firstOrThrow(escrow, id) {
          return Effect.succeed(undefined).pipe(Effect.flatMap(notNil));
        },
      });
      const program = updateDisputeStatus({
        currentUser: { id: "current-user-id" },
        disputeId: "dispute_id",
        status: "open",
      });
      const result = runTest(Effect.provide(program, disputeRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: invalid dispute id]`,
      );
    });
    test("should fail if cannot transition dispute status", async () => {
      const disputeRepo = extendDisputeRepo({
        firstOrThrow(escrow, id) {
          return Effect.succeed({ status: "pending" });
        },
      });
      const program = updateDisputeStatus({
        currentUser: { id: "current-user-id" },
        disputeId: "dispute_id",
        status: "resolved",
      });
      const result = runTest(Effect.provide(program, disputeRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Cannot transition from pending to resolved]`,
      );
    });
    test("should fail updating dispute state for unauthorized user", async () => {
      const disputeRepo = extendDisputeRepo({
        firstOrThrow(escrow, id) {
          return Effect.succeed({ status: "pending" });
        },
      });
      const program = updateDisputeStatus({
        currentUser: { id: "current-user-id", role: "buyer" },
        disputeId: "dispute_id",
        status: "open",
      });
      const result = runTest(Effect.provide(program, disputeRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Unauthoized user action: cannot affect dispute status]`,
      );
    });
    test("should set dispute status to open", async () => {
      let updated = false;
      const disputeRepo = extendDisputeRepo({
        firstOrThrow(escrow, id) {
          return Effect.succeed({ status: "pending" });
        },
        update(where, data) {
          updated = true;
          return Effect.succeed([{}]);
        },
      });
      const program = updateDisputeStatus({
        currentUser: { id: "current-user-id", role: "ADMIN" },
        disputeId: "dispute_id",
        status: "open",
      });
      const result = await runTest(Effect.provide(program, disputeRepo));
      expect(result).toMatchInlineSnapshot(`
        {
          "message": "open status successful",
          "status": true,
        }
      `);
    });
    test("should add admin as dispute member", async () => {
      let created = false;
      const disputeMemberRepo = extendDisputeMemberRepo({
        create(data) {
          created = true;
          return Effect.succeed([]);
        },
      });
      const program = updateDisputeStatus({
        currentUser: { id: "current-user-id", role: "ADMIN" },
        disputeId: "dispute_id",
        status: "open",
      });
      const result = await runTest(Effect.provide(program, disputeMemberRepo));
      expect(result).toMatchInlineSnapshot(`
        {
          "message": "open status successful",
          "status": true,
        }
      `);
    });
    test("should set dispute status to resolved", async () => {
      let updated = false;
      const disputeRepo = extendDisputeRepo({
        firstOrThrow(escrow, id) {
          return Effect.succeed({ status: "open" });
        },
        update(where, data) {
          updated = true;
          return Effect.succeed([{}]);
        },
      });
      const program = updateDisputeStatus({
        currentUser: { id: "current-user-id", role: "ADMIN" },
        disputeId: "dispute_id",
        status: "resolved",
      });
      const result = await runTest(Effect.provide(program, disputeRepo));
      expect(result).toMatchInlineSnapshot(`
        {
          "message": "resolved status successful",
          "status": true,
        }
      `);
    });
  });

  describe.skip("Invite dispute members", () => {
    test("should fail if its not an ADMIN inviting", async () => {
      const disputeRepo = extendDisputeRepo({
        firstOrThrow(escrow, id) {
          return Effect.succeed({ status: "pending" });
        },
      });
      const program = inviteMember({
        currentUser: { id: "current-user-id", role: "buyer" },
        disputeId: "dispute_id",
        userId: "user-id",
      });
      const result = runTest(Effect.provide(program, disputeRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Unauthorized action: Cannot invite user]`,
      );
    });
    test("should fail if dispute id doesn't exist", async () => {
      const disputeRepo = extendDisputeRepo({
        firstOrThrow(escrow, id) {
          return Effect.succeed(undefined).pipe(Effect.flatMap(notNil));
        },
      });
      const program = inviteMember({
        currentUser: { id: "current-user-id", role: "ADMIN" },
        disputeId: "dispute_id",
        userId: "user-id",
      });
      const result = runTest(Effect.provide(program, disputeRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Invalid disputeID: Unassociated open dispute]`,
      );
    });
    test("should fail inviting the dispute creator", async () => {
      const disputeRepo = extendDisputeRepo({
        firstOrThrow(escrow, id) {
          return Effect.succeed({ createdBy: "user-id" });
        },
      });
      const program = inviteMember({
        currentUser: { id: "current-user-id", role: "ADMIN" },
        disputeId: "dispute_id",
        userId: "user-id",
      });
      const result = runTest(Effect.provide(program, disputeRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Unacceptable action: cannot invite dispute creator]`,
      );
    });
    test("should fail if user id does not exist", async () => {
      const disputeRepo = extendDisputeRepo({
        firstOrThrow(escrow, id) {
          return Effect.succeed({ createdBy: "buyer-id" });
        },
      });
      const userRepo = extendUserRepoMock({
        firstOrThrow(arg1, arg2) {
          return Effect.succeed(undefined).pipe(Effect.flatMap(notNil));
        },
      });
      const program = inviteMember({
        currentUser: { id: "current-user-id", role: "ADMIN" },
        disputeId: "dispute_id",
        userId: "user-id",
      });
      const result = runTest(
        Effect.provide(program, Layer.merge(disputeRepo, userRepo)),
      );
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Invalid user id: Cannot invite this user]`,
      );
    });
    test("should fail if invitee not associated with the escrow", async () => {
      const disputeRepo = extendDisputeRepo({
        firstOrThrow(escrow, id) {
          return Effect.succeed({
            createdBy: "buyer-id",
            sellerId: "seller-id",
            buyerId: "buyer-id",
          });
        },
      });
      const userRepo = extendUserRepoMock({
        //@ts-expect-error
        firstOrThrow(arg1) {
          return Effect.succeed({ id: "user-id-1", role: "BUYER" });
        },
      });
      const program = inviteMember({
        currentUser: { id: "current-user-id", role: "ADMIN" },
        disputeId: "dispute_id",
        userId: "user-id",
      });
      const result = runTest(
        Effect.provide(program, Layer.merge(disputeRepo, userRepo)),
      );
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: User must be an admin or associated with the escrow]`,
      );
    });
    test("should fail if invitee already a dispute member", async () => {
      const disputeMemberRepo = extendDisputeMemberRepo({
        firstOrThrow(escrow, id) {
          return Effect.succeed({});
        },
      });
      const userRepo = extendUserRepoMock({
        //@ts-expect-error
        firstOrThrow(arg1) {
          return Effect.succeed({ id: "buyer-id", role: "BUYER" });
        },
      });
      const program = inviteMember({
        currentUser: { id: "current-user-id", role: "ADMIN" },
        disputeId: "dispute_id",
        userId: "user-id",
      });
      const result = runTest(
        Effect.provide(program, Layer.merge(disputeMemberRepo, userRepo)),
      );
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: User already a member]`,
      );
    });
    test("should add invitee as dispute member", async () => {
      let created = false;
      const disputeMemberRepo = extendDisputeMemberRepo({
        create(data) {
          created = true;
          return Effect.succeed([]);
        },
        firstOrThrow(escrow, id) {
          return Effect.succeed(undefined).pipe(Effect.flatMap(notNil));
        },
      });

      const userRepo = extendUserRepoMock({
        //@ts-expect-error
        firstOrThrow(arg1, arg2) {
          return Effect.succeed({ id: "buyer-id", role: "BUYER" });
        },
      });

      const program = inviteMember({
        currentUser: { id: "current-user-id", role: "ADMIN" },
        disputeId: "dispute_id",
        userId: "user-id",
      });
      const result = await runTest(
        Effect.provide(program, Layer.merge(disputeMemberRepo, userRepo)),
      );
      expect(created).toBeTruthy();
      expect(result).toMatchInlineSnapshot(`
        {
          "message": "User invited successfully",
          "status": true,
        }
      `);
    });
  });
  describe.skip("remove member from dispute", () => {
    test("should fail if its not an ADMIN inviting", async () => {
      const disputeRepo = extendDisputeRepo({
        firstOrThrow(escrow, id) {
          return Effect.succeed({ status: "pending" });
        },
      });
      const program = removeMember({
        currentUser: { id: "current-user-id", role: "buyer" },
        disputeId: "dispute_id",
        userId: "user-id",
      });
      const result = runTest(Effect.provide(program, disputeRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Unauthorized action: Cannot uninvite user]`,
      );
    });
    test("should fail if user not dispute member", async () => {
      const disputeMemberRepo = extendDisputeMemberRepo({
        firstOrThrow(escrow, id) {
          return Effect.succeed(undefined).pipe(Effect.flatMap(notNil));
        },
      });
      const program = removeMember({
        currentUser: { id: "current-user-id", role: "ADMIN" },
        disputeId: "dispute_id",
        userId: "user-id",
      });
      const result = runTest(Effect.provide(program, disputeMemberRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: User is not a member]`,
      );
    });
    test("should remove a dispute member", async () => {
      let deleted = false;
      const disputeMemberRepo = extendDisputeMemberRepo({
        delete(escrow) {
          deleted = true;
          return Effect.succeed({});
        },
      });
      const program = removeMember({
        currentUser: { id: "current-user-id", role: "ADMIN" },
        disputeId: "dispute_id",
        userId: "user-id",
      });
      const result = await runTest(Effect.provide(program, disputeMemberRepo));
      expect(result).toBeTruthy();
      expect(result).toMatchInlineSnapshot(`
        {
          "message": "User removed successfully",
          "status": true,
        }
      `);
    });
  });
});
