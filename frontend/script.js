const API = "http://localhost:8080";
let bank = 100;

const betTypeSel = document.getElementById("betType");
const selectionHost = document.getElementById("selectionHost");
const bankEl = document.getElementById("bank");
const lastEl = document.getElementById("last");
const learnEl = document.getElementById("learn");

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
    h(`<label>Die A:<select id="a">${opts}</select></label>
       <label>Die B:<select id="b">${opts}</select></label>`);
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

betTypeSel.addEventListener("change", renderSelection);
renderSelection();

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
  if (data.error) { alert(data.error); return; }

  bank = +(bank + data.payout).toFixed(2);
  bankEl.textContent = bank;

  lastEl.textContent =
    `Dice: ${data.dice.join(", ")}  | Total: ${data.total}  | ` +
    (data.win ? `You WON $${data.payout}!` : `You LOST $${Math.abs(data.payout)}.`);

  learnEl.textContent =
    `Probability p=${data.prob}. Fair payout ≈ ${data.fairPayoutMultiplier}:1; ` +
    `House pays ${data.housePayoutMultiplier}:1 (5% edge).`;
});
