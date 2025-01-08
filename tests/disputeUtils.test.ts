describe("Transition order status", () => {
  test("should transition dispute status successfully", () => {
    const maps = [
      ["pending", "open"],
      ["open", "resolved"],
    ];

    for (const i of maps) {
      const res = canTransitionDisputeStatus(i[0], i[1]);
      expect(res).toBeTruthy();
    }
  });

  test("should return false dispute status transition", () => {
    const maps = [
      ["pending", "resolved"],
      ["resolved", "open"],
      ["resolved", "resolved"],
      ["open", "pending"],
      ["pending", "pending"],
    ];

    for (const i of maps) {
      const res = canTransitionDisputeStatus(i[0], i[1]);
      expect(res).toBeFalsy();
    }
  });
});
