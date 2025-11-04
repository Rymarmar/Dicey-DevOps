const API = "http://localhost:8080";
let bank = 100;

const betTypeSel = document.getElementById("betType");
const selectionHost = document.getElementById("selectionHost");
const bankEl = document.getElementById("bank");
const lastEl = document.getElementById("last");
const learnEl = document.getElementById("learn");

const rulesModal = document.getElementById("rulesModal");
const openRulesBtn = document.getElementById("openRules");
const closeRulesBtn = document.getElementById("closeRules");
const gotItBtn = document.getElementById("gotIt");
const ruleTabs = document.querySelectorAll(".rule-tab");
const ruleBody = document.getElementById("ruleBody");

// rules content per mode
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

function showRule(mode) {
  ruleBody.innerHTML = RULES[mode] || "No rules found.";
}

// modal open/close
function openRules() {
  rulesModal.classList.remove("hidden");
  // default to current selected game
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
  // optional: sync modal tab to current selection
  activateRuleTab(betTypeSel.value);
});
renderSelection();

// show rules automatically the first time
openRules();

// form submit → call backend
document.getElementById("betForm").addEventListener("submit", async (e) => {
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

  const res = await fetch(`${API}/play`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ betType: t, selection, wager })
  });
  const data = await res.json();
  if (data.error) {
    alert(data.error);
    return;
  }

  // update bankroll
  bank = +(bank + data.payout).toFixed(2);
  bankEl.textContent = bank;

  // show result
  lastEl.textContent =
    `Dice: ${data.dice.join(", ")}  | Total: ${data.total}  | ` +
    (data.win ? `You WON $${data.payout}!` : `You LOST $${Math.abs(data.payout)}.`);

  learnEl.textContent =
    `Probability p=${data.prob}. Fair payout ≈ ${data.fairPayoutMultiplier}:1; ` +
    `House pays ${data.housePayoutMultiplier}:1 (5% edge).`;
});
