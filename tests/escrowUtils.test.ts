import type { TEscrowParticipant } from "~/migrations/schema";
import {
  canTransitionEscrowStatus,
  getBuyerAndSellerFromParticipants,
} from "~/services/escrow/escrow.utils";
import { runTest } from "./mocks/app";

describe("Escrow utility", () => {
  describe("Transition escrow status", () => {
    test("should transition escrow status successfully", () => {
      const maps = [
        ["created", "deposit.pending"],
        ["deposit.success", "service.pending"],
      ];

      for (const i of maps) {
        const res = canTransitionEscrowStatus(i[0], i[1]);
        expect(res).toBeTruthy();
      }
    });

    test("should return false dispute status transition", () => {
      const maps = [
        ["service.pending", "created"],
        ["deposit.pending", "dispute"],
      ];

      for (const i of maps) {
        const res = canTransitionEscrowStatus(i[0], i[1]);
        expect(res).toBeFalsy();
      }
    });
  });

  describe("Get buyer and seller from participants", () => {
    const participants = [
      {
        id: "MOCK_ID",
        escrowId: "MOCK_ESCROW_ID",
        userId: "MOCK_BUYER_ID",
        role: "buyer",
        status: "active",
      },
      {
        id: "MOCK_ID",
        escrowId: "MOCK_ESCROW_ID",
        userId: "MOCK_SELLER_ID",
        role: "seller",
        status: "active",
      },
    ] as TEscrowParticipant[];

    test("should fail if buyer and seller not found", () => {
      const program = getBuyerAndSellerFromParticipants([participants[0]]);
      const result = runTest(program);
      expect(result).resolves.toMatchInlineSnapshot(
        "[ExpectedError: Invalid participants. Seller or buyer not found.]",
      );
    });

    test("should return participants", () => {
      const program = getBuyerAndSellerFromParticipants(participants);
      const result = runTest(program);
      expect(result).resolves.toMatchInlineSnapshot(`
        {
          "buyer": {
            "escrowId": "MOCK_ESCROW_ID",
            "id": "MOCK_ID",
            "role": "buyer",
            "status": "active",
            "userId": "MOCK_BUYER_ID",
          },
          "seller": {
            "escrowId": "MOCK_ESCROW_ID",
            "id": "MOCK_ID",
            "role": "seller",
            "status": "active",
            "userId": "MOCK_SELLER_ID",
          },
        }
      `);
    });
  });
});
