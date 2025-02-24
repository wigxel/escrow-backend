import { canTransitionEscrowStatus } from "~/services/escrow/escrow.utils";

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
});
