const API = "http://localhost:8080";

// run/config state
const STARTING_BANK_BY_DIFF = {
  low: 50,
  mid: 100,
  high: 1000,
};

let difficulty = "mid";
let bank = STARTING_BANK_BY_DIFF[difficulty];
let streak = 0;
let runRolls = 0;

// session stats (frontend only)
const STATS = {
  totalRolls: 0,
  wins: 0,
  losses: 0,
  netProfit: 0,
  biggestWin: 0,
  biggestLoss: 0,
  byBetType: {
    sum: 0,
    exactPair: 0,
    anyDoubles: 0,
    overUnder7: 0,
  }
};

// UI refs
const betTypeSel = document.getElementById("betType");
const selectionHost = document.getElementById("selectionHost");
const bankEl = document.getElementById("bank");
const lastEl = document.getElementById("last");
const learnEl = document.getElementById("learn");
const streakBadge = document.getElementById("streakBadge");
const rollBtn = document.getElementById("rollBtn");
const form = document.getElementById("betForm");
const difficultySel = document.getElementById("difficulty");
const runRollsEl = document.getElementById("runRolls");
const bestScoreEl = document.getElementById("bestScore");

const stabilityFill = document.getElementById("stabilityFill");
const dailyChallenge = document.getElementById("dailyChallenge");

// dice + fx
const diceStage = document.getElementById("diceStage");
const die1 = document.getElementById("die1");
const die2 = document.getElementById("die2");
const fxLayer = document.getElementById("fx-layer");

// modals
const rulesModal = document.getElementById("rulesModal");
const openRulesBtn = document.getElementById("openRules");
const closeRulesBtn = document.getElementById("closeRules");
const gotItBtn = document.getElementById("gotIt");
const ruleTabs = document.querySelectorAll(".rule-tab");
const ruleBody = document.getElementById("ruleBody");

const statsModal = document.getElementById("statsModal");
const openStatsBtn = document.getElementById("openStats");
const closeStatsBtn = document.getElementById("closeStats");
const statsBody = document.getElementById("statsBody");

let rollTimer = null;

/* -----------------------------
   Rules content
------------------------------ */
const RULES = {
  sum: `
    <strong>Sum (2–12)</strong>
    <ul>
      <li>You pick a total between 2 and 12.</li>
      <li>Two dice are rolled; if their sum equals your pick, you win.</li>
      <li>Some sums are rarer (2, 12) and pay more; 7 is most common and pays less.</li>
    </ul>
  `,
  exactPair: `
    <strong>Exact Pair</strong>
    <ul>
      <li>You pick the exact faces of both dice (e.g. 1 and 3).</li>
      <li>There are 36 possible ordered rolls → probability is 1/36.</li>
      <li>Because it's rare, payout is high.</li>
    </ul>
  `,
  anyDoubles: `
    <strong>Any Doubles</strong>
    <ul>
      <li>You win if both dice match (1-1, 2-2, ... 6-6).</li>
      <li>There are 6 winning outcomes out of 36 → probability 1/6.</li>
      <li>Medium risk, medium reward.</li>
    </ul>
  `,
  overUnder7: `
    <strong>Over / Under / Exactly 7</strong>
    <ul>
      <li>Pick <em>over 7</em>, <em>under 7</em>, or <em>exactly 7</em>.</li>
      <li>Over 7 and under 7 each win 15/36 of the time.</li>
      <li>Exactly 7 wins 6/36 of the time → pays more.</li>
    </ul>
  `
};

const GLOBAL_EXPLAINER = `
  <hr class="rule-sep" />
  <h3 class="rule-subtitle">Understanding the numbers you see after a roll</h3>
  <ul class="rule-explain">
    <li><strong>Probability p=0.4167</strong> means this bet wins about 41.67% of the time (≈ 15/36 outcomes).</li>
    <li><strong>Fair payout ≈ 1.4:1</strong> is what you'd get if there were no house profit.</li>
    <li><strong>House pays 1.32:1 (5% edge)</strong> means the game pays a bit less — that's the house advantage.</li>
    <li>Over many rolls, the house edge makes the casino win, even if you have winning streaks.</li>
  </ul>
`;

function showRule(mode) {
  ruleBody.innerHTML = (RULES[mode] || "No rules found.") + GLOBAL_EXPLAINER;
}

/* -----------------------------
   Modal wiring
------------------------------ */
function openRules() {
  rulesModal.classList.remove("hidden");
  const current = betTypeSel.value;
  activateRuleTab(current);
  showRule(current);
}
function closeRules() {
  rulesModal.classList.add("hidden");
}
openRulesBtn.addEventListener("click", openRules);
closeRulesBtn.addEventListener("click", closeRules);
gotItBtn.addEventListener("click", closeRules);

ruleTabs.forEach(btn => {
  btn.addEventListener("click", () => {
    const m = btn.dataset.mode;
    activateRuleTab(m);
    showRule(m);
  });
});

function activateRuleTab(mode) {
  ruleTabs.forEach(b => b.classList.toggle("active", b.dataset.mode === mode));
}

/* -----------------------------
   Stats modal wiring
------------------------------ */
openStatsBtn.addEventListener("click", () => {
  renderStats();
  statsModal.classList.remove("hidden");
});
closeStatsBtn.addEventListener("click", () => {
  statsModal.classList.add("hidden");
});

/* -----------------------------
   Selection controls
------------------------------ */
function h(html) { selectionHost.innerHTML = html; }

function renderSelection() {
  const t = betTypeSel.value;
  if (t === "sum") {
    h(`<label>Sum:
         <select id="sel_sum">
           ${Array.from({length:11},(_,i)=>i+2).map(n=>`<option>${n}</option>`).join("")}
         </select>
       </label>`);
  } else if (t === "exactPair") {
    const opts = Array.from({length:6},(_,i)=>i+1).map(n=>`<option>${n}</option>`).join("");
    h(`<label>Die A:
          <select id="a">${opts}</select>
       </label>
       <label>Die B:
          <select id="b">${opts}</select>
       </label>`);
  } else if (t === "anyDoubles") {
    h(`<em>No selection needed — pays on any doubles.</em>`);
  } else {
    h(`<label>Pick:
         <select id="ou">
           <option value="over">Over 7</option>
           <option value="under">Under 7</option>
           <option value="seven">Exactly 7</option>
         </select>
       </label>`);
  }
}
betTypeSel.addEventListener("change", () => {
  renderSelection();
  activateRuleTab(betTypeSel.value);
  updateBestScoreDisplay();
  maybeRefreshChallenge();
});
renderSelection();

// show rules the first time
openRules();

/* -----------------------------
   Dice animation
------------------------------ */
function setDiceFaces(values = [1, 1]) {
  die1.textContent = values[0];
  die2.textContent = values[1];
}

function startDiceRoll() {
  diceStage.classList.add("rolling");
  rollBtn.disabled = true;
  rollTimer = setInterval(() => {
    setDiceFaces([
      1 + Math.floor(Math.random() * 6),
      1 + Math.floor(Math.random() * 6)
    ]);
  }, 110);
}

function stopDiceRoll(finalDice, isWin = false) {
  if (rollTimer) {
    clearInterval(rollTimer);
    rollTimer = null;
  }
  diceStage.classList.remove("rolling");
  setDiceFaces(finalDice);
  rollBtn.disabled = false;
  if (isWin) {
    diceStage.classList.add("win");
    setTimeout(() => diceStage.classList.remove("win"), 500);
  }
}

/* -----------------------------
   FX
------------------------------ */
function spawnConfetti(count = 12) {
  const baseX = diceStage.offsetLeft + 10;
  const baseY = diceStage.offsetTop + 5;
  const colors = ["#6366f1", "#f97316", "#22c55e", "#e11d48"];
  for (let i = 0; i < count; i++) {
    const c = document.createElement("div");
    c.className = "confetti";
    c.style.left = baseX + 20 + Math.random() * 50 + "px";
    c.style.top = baseY + 10 + "px";
    c.style.background = colors[i % colors.length];
    const dx = (Math.random() * 60 - 30).toFixed(0) + "px";
    c.style.setProperty("--dx", dx);
    fxLayer.appendChild(c);
    setTimeout(() => c.remove(), 650);
  }
}

function floatWinText(text) {
  const el = document.createElement("div");
  el.className = "float-text";
  el.textContent = text;
  el.style.left = (diceStage.offsetLeft + 35) + "px";
  el.style.top = (diceStage.offsetTop + 5) + "px";
  fxLayer.appendChild(el);
  setTimeout(() => el.remove(), 850);
}

function celebrateNewBest(newVal) {
  spawnConfetti(22);
  floatWinText(`NEW BEST: ${newVal}!`);
  bestScoreEl.classList.add("flash");
  setTimeout(() => bestScoreEl.classList.remove("flash"), 700);
}

/* -----------------------------
   Streak + run display
------------------------------ */
function updateStreakDisplay() {
  streakBadge.textContent = `Streak: ${streak}`;
}
function updateRunDisplay() {
  runRollsEl.textContent = `Run rolls: ${runRolls}`;
}

/* -----------------------------
   High score per (mode,difficulty)
------------------------------ */
function makeHsKey() {
  return `dd-hs-${betTypeSel.value}-${difficulty}`;
}
function getHighScore() {
  const k = makeHsKey();
  return Number(localStorage.getItem(k) || 0);
}
function saveHighScore(val) {
  const k = makeHsKey();
  localStorage.setItem(k, String(val));
}
function updateBestScoreDisplay() {
  const best = getHighScore();
  bestScoreEl.textContent = `🔥 Best run on this setup: ${best}`;
}

/* -----------------------------
   Stability bar
------------------------------ */
function updateStabilityBar() {
  const start = STARTING_BANK_BY_DIFF[difficulty];
  let pct = Math.min(bank / start, 1.4);
  stabilityFill.style.width = (pct * 100 / 1.4) + "%";
}

/* -----------------------------
   Daily / session challenge
------------------------------ */
const CHALLENGES = [
  { mode: "overUnder7", text: "Win 3 times on Over / Under / 7" },
  { mode: "sum", text: "Hit a Sum bet at least once" },
  { mode: "anyDoubles", text: "Catch a doubles win" },
  { mode: "exactPair", text: "Attempt 1 Exact Pair (1/36) roll" },
];
let currentChallenge = null;

function pickChallenge() {
  const pick = CHALLENGES[Math.floor(Math.random() * CHALLENGES.length)];
  currentChallenge = pick;
  dailyChallenge.textContent = pick.text;
  dailyChallenge.classList.remove("hidden");
}
function maybeRefreshChallenge() {
  // placeholder if we want to react to mode later
}

/* -----------------------------
   Run reset
------------------------------ */
function resetRun() {
  bank = STARTING_BANK_BY_DIFF[difficulty];
  bankEl.textContent = bank;
  runRolls = 0;
  updateRunDisplay();
  streak = 0;
  updateStreakDisplay();
  lastEl.textContent = "";
  learnEl.textContent = "";
  updateStabilityBar();
}

/* difficulty change = new run */
difficultySel.addEventListener("change", () => {
  difficulty = difficultySel.value;
  resetRun();
  updateBestScoreDisplay();
});

/* -----------------------------
   Stats rendering
------------------------------ */
function renderStats() {
  const winRate = STATS.totalRolls
    ? ((STATS.wins / STATS.totalRolls) * 100).toFixed(1)
    : "0.0";

  // find most played bet type
  const entries = Object.entries(STATS.byBetType);
  let mostPlayed = "-";
  if (entries.length) {
    entries.sort((a, b) => b[1] - a[1]);
    mostPlayed = entries[0][0] + ` (${entries[0][1]})`;
  }

  statsBody.innerHTML = `
    <div class="stats-grid">
      <div class="stats-pill"><strong>Total rolls:</strong> ${STATS.totalRolls}</div>
      <div class="stats-pill"><strong>Wins:</strong> ${STATS.wins}</div>
      <div class="stats-pill"><strong>Losses:</strong> ${STATS.losses}</div>
      <div class="stats-pill"><strong>Win rate:</strong> ${winRate}%</div>
      <div class="stats-pill"><strong>Net profit:</strong> $${STATS.netProfit.toFixed(2)}</div>
      <div class="stats-pill"><strong>Biggest win:</strong> $${STATS.biggestWin.toFixed(2)}</div>
      <div class="stats-pill"><strong>Biggest loss:</strong> $${Math.abs(STATS.biggestLoss).toFixed(2)}</div>
      <div class="stats-pill"><strong>Most played bet:</strong> ${mostPlayed}</div>
    </div>
    <p style="margin-top:.5rem; font-size:.75rem; color:#94a3b8;">
      These stats are browser-only for this session. Use them to talk about observability / player behavior in your report.
    </p>
  `;
}

/* -----------------------------
   Explain outcome
------------------------------ */
function buildOutcomeExplanation(betType, selection, data) {
  const total = data.total;
  const dice = data.dice;
  const base = [];

  if (data.win) {
    base.push("You won because your bet condition was met.");
  } else {
    base.push("You lost because the roll didn't match your bet.");
  }

  if (betType === "sum") {
    base.push(`You picked sum ${selection}, but the dice added to ${total}.`);
    base.push(`That sum only hits about ${(data.prob * 100).toFixed(1)}% of the time.`);
  } else if (betType === "exactPair") {
    base.push(`You picked the exact pair (${selection[0]}, ${selection[1]}), but the dice were (${dice[0]}, ${dice[1]}).`);
    base.push("Exact ordered pairs are very rare — only 1/36 ≈ 2.78%.");
  } else if (betType === "anyDoubles") {
    base.push(`You needed both dice to match, but the roll was (${dice[0]}, ${dice[1]}).`);
    base.push("Any doubles hit 6/36 → 1/6 → about 16.7%.");
  } else if (betType === "overUnder7") {
    const pick = selection;
    if (pick === "over") {
      base.push(`You picked over 7, but the total was ${total}.`);
      base.push("Over 7 wins 15/36 → about 41.7%.");
    } else if (pick === "under") {
      base.push(`You picked under 7, but the total was ${total}.`);
      base.push("Under 7 wins 15/36 → about 41.7%.");
    } else {
      base.push(`You picked exactly 7, but the total was ${total}.`);
      base.push("Exactly 7 hits 6/36 → about 16.7%.");
    }
  }

  return base.join(" ");
}

/* -----------------------------
   Form submit → main loop
------------------------------ */
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const t = betTypeSel.value;
  const wagerInput = document.getElementById("wager");
  let wager = Math.max(1, Number(wagerInput.value || 1));
  if (wager > bank) {
    wager = bank;
    wagerInput.value = wager;
  }

  let selection;
  if (t === "sum") selection = Number(document.getElementById("sel_sum").value);
  else if (t === "exactPair") selection = [
    Number(document.getElementById("a").value),
    Number(document.getElementById("b").value)
  ];
  else if (t === "anyDoubles") selection = null;
  else selection = document.getElementById("ou").value;

  startDiceRoll();

  const res = await fetch(`${API}/play`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ betType: t, selection, wager })
  });
  const data = await res.json();

  if (data.error) {
    stopDiceRoll([1, 1], false);
    alert(data.error);
    return;
  }

  setTimeout(() => {
    stopDiceRoll(data.dice, data.win);

    // update session stats baseline
    STATS.totalRolls += 1;
    STATS.byBetType[t] = (STATS.byBetType[t] || 0) + 1;

    runRolls += 1;
    updateRunDisplay();

    // update bankroll
    bank = +(bank + data.payout).toFixed(2);
    if (bank < 0) bank = 0;
    bankEl.textContent = bank;
    updateStabilityBar();

    // update stats profit
    STATS.netProfit = +(STATS.netProfit + data.payout).toFixed(2);
    if (data.payout > 0 && data.payout > STATS.biggestWin) {
      STATS.biggestWin = data.payout;
    }
    if (data.payout < 0 && data.payout < STATS.biggestLoss) {
      STATS.biggestLoss = data.payout;
    }

    // streak logic
    if (data.win) {
      streak += 1;
      STATS.wins += 1;
      spawnConfetti();
      floatWinText(`+$${data.payout}`);
    } else {
      streak = 0;
      STATS.losses += 1;
    }
    updateStreakDisplay();

    // show result
    lastEl.textContent =
      `Dice: ${data.dice.join(", ")}  | Total: ${data.total}  | ` +
      (data.win ? `You WON $${data.payout}!` : `You LOST $${Math.abs(data.payout)}.`);

    // learning line
    const baseLine =
      `Probability p=${data.prob}. Fair payout ≈ ${data.fairPayoutMultiplier}:1; ` +
      `House pays ${data.housePayoutMultiplier}:1 (5% edge). `;
    const outcomeLine = buildOutcomeExplanation(t, selection, data);
    learnEl.textContent = baseLine + outcomeLine;

    // streak bonus every 3 wins
    if (streak > 0 && streak % 3 === 0) {
      bank += 2;
      bankEl.textContent = bank;
      updateStabilityBar();
      learnEl.textContent += ` 🔥 Streak bonus! +$2`;
      floatWinText("+$2 bonus");
      spawnConfetti();
      STATS.netProfit = +(STATS.netProfit + 2).toFixed(2);
    }

    // if run is dead → record high score & reset
    if (bank <= 0) {
      const best = getHighScore();
      if (runRolls > best) {
        saveHighScore(runRolls);
        celebrateNewBest(runRolls);
      }
      updateBestScoreDisplay();
      alert("Run over! You hit $0. Starting a new run at this difficulty.");
      resetRun();
      updateBestScoreDisplay();
    } else {
      // alive → still update best
      const best = getHighScore();
      if (runRolls > best) {
        saveHighScore(runRolls);
        celebrateNewBest(runRolls);
        updateBestScoreDisplay();
      }
    }

  }, 650);
});

/* init displays */
bankEl.textContent = bank;
updateRunDisplay();
updateBestScoreDisplay();
updateStabilityBar();
pickChallenge();
