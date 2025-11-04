const API = "http://localhost:8080";
let bank = 100;
let streak = 0;

const betTypeSel = document.getElementById("betType");
const selectionHost = document.getElementById("selectionHost");
const bankEl = document.getElementById("bank");
const lastEl = document.getElementById("last");
const learnEl = document.getElementById("learn");
const streakBadge = document.getElementById("streakBadge");
const rollBtn = document.getElementById("rollBtn");
const form = document.getElementById("betForm");

// dice + fx
const diceStage = document.getElementById("diceStage");
const die1 = document.getElementById("die1");
const die2 = document.getElementById("die2");
const fxLayer = document.getElementById("fx-layer");

const rulesModal = document.getElementById("rulesModal");
const openRulesBtn = document.getElementById("openRules");
const closeRulesBtn = document.getElementById("closeRules");
const gotItBtn = document.getElementById("gotIt");
const ruleTabs = document.querySelectorAll(".rule-tab");
const ruleBody = document.getElementById("ruleBody");

let rollTimer = null;

// ----- rules content per mode -----
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

// global “learning mode” explainer shown under every rules tab
const GLOBAL_EXPLAINER = `
  <hr class="rule-sep" />
  <h3 class="rule-subtitle">Understanding the numbers you see after a roll</h3>
  <ul class="rule-explain">
    <li><strong>Probability p=0.4167</strong> means this bet wins about 41.67% of the time (≈ 15 out of 36 dice outcomes).</li>
    <li><strong>Fair payout ≈ 1.4:1</strong> means that if the casino paid with no profit, it would give you $1.40 profit for every $1 you bet on a win, because of that probability.</li>
    <li><strong>House pays 1.32:1 (5% edge)</strong> means the game pays a little less than fair value — that 5% discount is the “house edge.”</li>
    <li>This is the whole point of the app: even if you win sometimes, over many rolls the 5% edge makes the house come out ahead.</li>
  </ul>
`;

function showRule(mode) {
  ruleBody.innerHTML = (RULES[mode] || "No rules found.") + GLOBAL_EXPLAINER;
}

// modal open/close
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

// tab switching
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

// render selection controls
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
  } else { // overUnder7
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
});
renderSelection();

// show rules automatically the first time → “learning mode forever”
openRules();

/* -----------------------------
   Dice animation helpers
------------------------------ */
function setDiceFaces(values = [1, 1]) {
  die1.textContent = values[0];
  die2.textContent = values[1];
}

function startDiceRoll() {
  diceStage.classList.add("rolling");
  rollBtn.disabled = true;

  // change numbers while spinning so it feels alive
  rollTimer = setInterval(() => {
    const r1 = 1 + Math.floor(Math.random() * 6);
    const r2 = 1 + Math.floor(Math.random() * 6);
    setDiceFaces([r1, r2]);
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
   FX: confetti + floating text
------------------------------ */
function spawnConfetti() {
  const count = 12;
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

/* -----------------------------
   Streak helper
------------------------------ */
function updateStreakDisplay() {
  streakBadge.textContent = `Streak: ${streak}`;
}

/* -----------------------------
   Explain loss/win in plain English
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
    // sum probability from backend prob
    base.push(`That sum only hits about ${(data.prob * 100).toFixed(1)}% of the time.`);
  } else if (betType === "exactPair") {
    base.push(`You picked the exact pair (${selection[0]}, ${selection[1]}), but the dice were (${dice[0]}, ${dice[1]}).`);
    base.push("Exact ordered pairs are very rare — only 1 out of 36 rolls ≈ 2.78%.");
  } else if (betType === "anyDoubles") {
    base.push(`You needed both dice to match, but the roll was (${dice[0]}, ${dice[1]}).`);
    base.push("Any doubles hit 6 out of 36 rolls → 1/6 → about 16.7%.");
  } else if (betType === "overUnder7") {
    const pick = selection;
    if (pick === "over") {
      base.push(`You picked over 7, but the total was ${total}.`);
      base.push("Over 7 wins 15 out of 36 rolls → about 41.7%.");
    } else if (pick === "under") {
      base.push(`You picked under 7, but the total was ${total}.`);
      base.push("Under 7 wins 15 out of 36 rolls → about 41.7%.");
    } else {
      base.push(`You picked exactly 7, but the total was ${total}.`);
      base.push("Exactly 7 hits 6 out of 36 rolls → about 16.7%.");
    }
  }

  return base.join(" ");
}

/* -----------------------------
   Form submit → call backend
------------------------------ */
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const t = betTypeSel.value;
  const wager = Math.max(1, Number(document.getElementById("wager").value || 1));

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

  // let the spin show for a bit
  setTimeout(() => {
    stopDiceRoll(data.dice, data.win);

    // bankroll
    bank = +(bank + data.payout).toFixed(2);
    bankEl.textContent = bank;

    // streak logic
    if (data.win) {
      streak += 1;
      spawnConfetti();
      floatWinText(`+$${data.payout}`);
    } else {
      streak = 0;
    }
    updateStreakDisplay();

    // show result
    lastEl.textContent =
      `Dice: ${data.dice.join(", ")}  | Total: ${data.total}  | ` +
      (data.win ? `You WON $${data.payout}!` : `You LOST $${Math.abs(data.payout)}.`);

    // ALWAYS-ON LEARNING MODE
    const baseLine =
      `Probability p=${data.prob}. Fair payout ≈ ${data.fairPayoutMultiplier}:1; ` +
      `House pays ${data.housePayoutMultiplier}:1 (5% edge). `;
    const outcomeLine = buildOutcomeExplanation(t, selection, data);
    learnEl.textContent = baseLine + outcomeLine;

    // streak bonus every 3 wins
    if (streak > 0 && streak % 3 === 0) {
      bank += 2;
      bankEl.textContent = bank;
      learnEl.textContent += ` 🔥 Streak bonus! +$2`;
      floatWinText("+$2 bonus");
      spawnConfetti();
    }

  }, 650);
});
