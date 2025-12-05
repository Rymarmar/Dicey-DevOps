const { payoutFrom } = require("./dice");

describe("payoutFrom", () => {
  test("pays positive profit on win", () => {
    const res = payoutFrom(1 / 6, true, 10);
    expect(res.profit).toBeGreaterThan(0);
  });

  test("subtracts wager on loss", () => {
    const res = payoutFrom(1 / 6, false, 10);
    expect(res.profit).toBe(-10);
  });
});
