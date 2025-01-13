import { Effect, Layer } from "effect";
import { notNil } from "~/libs/query.helpers";
import {
  getUserDisputes,
  inviteMember,
  newDispute,
  removeMember,
  updateDisputeStatus,
} from "~/services/dispute.service";
import { FindArg1 } from "~/services/repository/repo.types";
import { runTest } from "./mocks/app";
import { extendDisputeMemberRepo } from "./mocks/disputeMembersRepo";
import { extendDisputeRepo } from "./mocks/disputeRepoMock";
import { extendOrderRepo } from "./mocks/orderRepoMock";
import { extendUserRepoMock } from "./mocks/user";

describe("Dispute service", () => {
  describe("create new dispute", () => {
    const disputeData = {
      orderId: "order-id",
      reason: "reason",
      message: "message",
    };
    test("should fail if invalid order id", async () => {
      const orderRepo = extendOrderRepo({
        getSingleOrder(where) {
          return Effect.succeed(undefined).pipe(Effect.flatMap(notNil));
        },
      });

      const program = newDispute({
        currentUser: { id: "user-id" },
        disputeData,
      });

      const result = runTest(Effect.provide(program, orderRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Invalid order id]`,
      );
    });
    test("should fail if unauthorized user tries to open dispute", async () => {
      const orderRepo = extendOrderRepo({
        //@ts-expect-error
        getSingleOrder(where) {
          return Effect.succeed({
            buyerId: "buyer-id",
            SellerId: "seller-id",
          });
        },
      });

      const program = newDispute({
        currentUser: { id: "user-id" },
        disputeData,
      });

      const result = runTest(Effect.provide(program, orderRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Unauthorized order: cannot open dispute]`,
      );
    });

    test("should fail if order has existing dispute", async () => {
      const disputeRepo = extendDisputeRepo({
        firstOrThrow(order, id) {
          return Effect.succeed({});
        },
      });

      const program = newDispute({
        currentUser: { id: "seller-id" },
        disputeData,
      });

      const result = runTest(Effect.provide(program, disputeRepo));
      expect(result).resolves.toMatchInlineSnapshot(
        `[ExpectedError: Order already has an open dispute]`,
      );
    });
    test("should create new dispute", async () => {
      let created = false;
      const disputeRepo = extendDisputeRepo({
        firstOrThrow(order, id) {
          return Effect.succeed(undefined).pipe(Effect.flatMap(notNil));
        },
        //@ts-expect-error
        create(data) {
          created = true;
          return Effect.succeed([{ id: "id", status: "pending" }]);
        },
      });

      const program = newDispute({
        currentUser: { id: "seller-id" },
        disputeData,
      });

      const result = await runTest(Effect.provide(program, disputeRepo));
      expect(result).toMatchInlineSnapshot(`
        {
          "data": {
            "disputeStatus": "pending",
          },
          "status": true,
        }
      `);
      expect(created).toBeTruthy();
    });
    test("should add dispute creator to dispute members", async () => {
      let addDisputeMember = false;
      const disputeRepo = extendDisputeRepo({
        firstOrThrow(order, id) {
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

  describe("get user Disputes", () => {
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

  describe("update dispute status", () => {
    test("should fail if dispute id doesn't exist", async () => {
      const disputeRepo = extendDisputeRepo({
        firstOrThrow(order, id) {
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
        firstOrThrow(order, id) {
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
        firstOrThrow(order, id) {
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
        firstOrThrow(order, id) {
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
        firstOrThrow(order, id) {
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

  describe("Invite dispute members", () => {
    test("should fail if its not an ADMIN inviting", async () => {
      const disputeRepo = extendDisputeRepo({
        firstOrThrow(order, id) {
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
        firstOrThrow(order, id) {
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
        firstOrThrow(order, id) {
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
        firstOrThrow(order, id) {
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
    test("should fail if invitee not associated with the order", async () => {
      const disputeRepo = extendDisputeRepo({
        firstOrThrow(order, id) {
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
        `[ExpectedError: User must be an admin or associated with the order]`,
      );
    });
    test("should fail if invitee already a dispute member", async () => {
      const disputeMemberRepo = extendDisputeMemberRepo({
        firstOrThrow(order, id) {
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
        firstOrThrow(order, id) {
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
  describe("remove member from dispute", () => {
    test("should fail if its not an ADMIN inviting", async () => {
      const disputeRepo = extendDisputeRepo({
        firstOrThrow(order, id) {
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
        firstOrThrow(order, id) {
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
        delete(order) {
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
