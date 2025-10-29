# 🎲 Dicey DevOps — Milestone 1 (Playable MVP)

A tiny probability game that demonstrates **risk vs. reward** and teaches **expected value**.  
Frontend (HTML/JS) talks to a Node/Express API. Docker Compose serves both.

## Project Structure
Dicey-DevOps/
├─ backend/
│ ├─ server.js
│ ├─ package.json
│ └─ routes/
│ └─ dice.js
├─ frontend/
│ ├─ index.html
│ ├─ script.js
│ └─ style.css
├─ Dockerfile
├─ docker-compose.yml
├─ .gitignore
└─ README.md

shell
Copy code

## Quick Start (Docker)
```bash
# from repo root
docker compose up --build
Frontend → http://localhost:3000

Backend health → http://localhost:8080/

Demo roll → http://localhost:8080/roll

Gameplay (MVP)
Start bankroll: $100 (in-browser state for demo)

Bet types:

Sum (2–12)

Exact Pair (e.g., 1,3)

Any Doubles

Over/Under/Exactly 7

Wager any whole dollar ≥ 1

Result shows: dice, total, win/loss, payout, and a learning blurb with:

Probability p

Fair profit multiplier ≈ (1/p) - 1

House multiplier (5% edge) used to compute your payout

API
GET /roll
Simple two-dice roll for quick testing.

json
Copy code
{ "dice": [4, 2], "total": 6 }
POST /play
Place a bet and roll.

Request (examples)

json
Copy code
{ "betType": "sum", "selection": 7, "wager": 5 }
{ "betType": "exactPair", "selection": [1,3], "wager": 10 }
{ "betType": "anyDoubles", "selection": null, "wager": 20 }
{ "betType": "overUnder7", "selection": "under", "wager": 15 }
{ "betType": "overUnder7", "selection": "seven", "wager": 8 }
Response

json
Copy code
{
  "dice": [2, 5],
  "total": 7,
  "win": true,
  "payout": 1.58,                  // positive if win, negative if loss
  "prob": 0.1667,
  "fairPayoutMultiplier": 5.00,    // theoretical "X:1" profit per $1
  "housePayoutMultiplier": 4.75     // 5% edge, rounded down to cents
}
Local Testing Guide
A) Test through the UI (fastest)
Start the stack:

bash
Copy code
docker compose up --build
Open http://localhost:3000.

Pick a Bet Type, choose the selection, enter a Wager, click Roll.

Watch Bankroll change and read the probability/EV line.

B) Test the API with curl
Run these in a terminal with the stack running:

bash
Copy code
# Health
curl http://localhost:8080/

# Demo roll
curl http://localhost:8080/roll

# Place a bet: sum = 7, wager $5
curl -X POST http://localhost:8080/play \
  -H "Content-Type: application/json" \
  -d '{"betType":"sum","selection":7,"wager":5}'
Windows PowerShell note: escape quotes differently:

powershell
Copy code
curl -Method POST http://localhost:8080/play `
  -Headers @{ "Content-Type"="application/json" } `
  -Body '{ "betType":"sum","selection":7,"wager":5 }'
C) Test with VS Code REST Client (optional)
Install the “REST Client” extension.

Create test.http in the repo:

http
Copy code
GET http://localhost:8080/

###
GET http://localhost:8080/roll

###
POST http://localhost:8080/play
Content-Type: application/json

{ "betType": "overUnder7", "selection": "seven", "wager": 8 }
Click Send Request above each block.

D) Test with Postman (optional)
Create a POST request to http://localhost:8080/play

Body → raw → JSON:

json
Copy code
{ "betType":"exactPair", "selection":[2,2], "wager":12 }
Troubleshooting
Port in use: something may be running on 3000/8080. Stop it or change ports in docker-compose.yml.

CORS errors: make sure you’re hitting http://localhost:8080 from the frontend served by http://localhost:3000 (backend enables CORS).

404/400: check request JSON fields: betType, valid selection, numeric wager.

Roadmap (Next Milestones)
Prometheus metrics (/metrics via prom-client) + Grafana dashboard

PostgreSQL service + roll history/leaderboard

GitHub Actions: CI for tests + Docker build & push

yaml
Copy code

---

## How to test (quick walk-through)

1) **Start everything**
```bash
docker compose up --build
Hit the backend quickly

Open http://localhost:8080/ → should say “Dicey DevOps backend running”

Open http://localhost:8080/roll → you’ll see {"dice":[x,y],"total":z}

Play in the browser

Go to http://localhost:3000

Choose a bet (e.g., Sum 7 with $5)

Click Roll → check the Bankroll, Result, and Learning text

Confirm API via curl

bash
Copy code
curl -X POST http://localhost:8080/play \
  -H "Content-Type: application/json" \
  -d '{"betType":"overUnder7","selection":"under","wager":5}'