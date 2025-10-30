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

Local Testing Guide
A) Test through the UI (fastest)
Start the stack:

bash
Copy code
docker compose up --build
Open http://localhost:3000.

Pick a Bet Type, choose the selection, enter a Wager, click Roll.

Watch Bankroll change and read the probability/EV line.


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
