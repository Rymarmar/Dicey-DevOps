const express = require("express");
const r = express.Router();

// ---------- helpers ----------
const sumCounts = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1 };

function roll2() {
  const a = 1 + Math.floor(Math.random() * 6);
  const b = 1 + Math.floor(Math.random() * 6);
  return [a, b];
}

function odds(betType, selection, total, dice) {
  switch (betType) {
    case "sum": {
      const k = Number(selection);
      const p = sumCounts[k] ? sumCounts[k] / 36 : 0;
      return [p, total === k];
    }
    case "exactPair": {
      const [x, y] = selection || [];
      const p = 1 / 36;
      return [p, dice[0] === Number(x) && dice[1] === Number(y)];
    }
    case "anyDoubles": {
      const p = 6 / 36; // 1/6
      return [p, dice[0] === dice[1]];
    }
    case "overUnder7": {
      if (selection === "over") return [15 / 36, total > 7];
      if (selection === "under") return [15 / 36, total < 7];
      if (selection === "seven") return [6 / 36, total === 7];
      return [0, false];
    }
    default:
      return [0, false];
  }
}

function payoutFrom(prob, didWin, wager) {
  // fair multiplier for the *profit* (not including stake) is (1/p) - 1
  const fairMult = (1 / prob) - 1;
  const houseEdge = 0.05; // 5%
  // two-decimal “casino-like” rounding down
  const paidMult = Math.floor((fairMult * (1 - houseEdge)) * 100) / 100;
  const profit = didWin ? +(wager * paidMult).toFixed(2) : -wager;
  return {
    profit,
    fairMult: +fairMult.toFixed(2),
    paidMult: +paidMult.toFixed(2)
  };
}

// ---------- routes ----------

// Simple demo roll
r.get("/roll", (_req, res) => {
  const dice = roll2();
  res.json({ dice, total: dice[0] + dice[1] });
});

// Main game endpoint
// Body: { betType, selection, wager }
r.post("/play", (req, res) => {
  const { betType, selection, wager } = req.body || {};
  const w = Math.max(1, Number(wager || 1));

  const dice = roll2();
  const total = dice[0] + dice[1];

  const [p, win] = odds(betType, selection, total, dice);
  if (!p) return res.status(400).json({ error: "Invalid bet or selection." });

  const { profit, fairMult, paidMult } = payoutFrom(p, win, w);

  res.json({
    dice,
    total,
    win,
    payout: profit,
    prob: +p.toFixed(4),
    fairPayoutMultiplier: fairMult,
    housePayoutMultiplier: paidMult
  });
});

module.exports = {
  router: r,
  payoutFrom
};
