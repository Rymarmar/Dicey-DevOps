# 🎲 Dicey DevOps — Milestone 1 (Playable MVP)

A tiny probability game that demonstrates **risk vs. reward** and teaches **expected value**.  
Frontend (HTML/JS) talks to a Node/Express API. Docker Compose serves both.

---

## 🧱 Project Structure
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

yaml
Copy code

---

## 🚀 Quick Start (Docker)

From the **project root**:

```bash
# Build and start both backend + frontend
docker compose up --build
Then open:

🎮 Frontend: http://localhost:3000

⚙️ Backend health: http://localhost:8080/

🎲 Demo roll: http://localhost:8080/roll

🧩 Gameplay Overview
Start bankroll: $100 (browser-only state)

Bet Types:

Sum (2–12)

Exact Pair (e.g., 1,3)

Any Doubles

Over / Under / Exactly 7

Each result shows:

🎲 Dice and total

✅ Win/Loss and payout

📊 Probability, fair payout, and house edge (5%)

🧪 Local Testing Guide
A) Run through Docker (recommended)
bash
Copy code
docker compose up --build
Then visit:

http://localhost:3000 → Play the game

http://localhost:8080 → Should show “Dicey DevOps backend running”

http://localhost:8080/roll → Example output: {"dice":[x,y],"total":z}

B) Run manually (without Docker)
# 1. Start backend
cd backend
npm install
npm run start

# 2. Open frontend
# Simply open frontend/index.html in your browser

🧹 Docker Cleanup / Rebuild

If you need to reset your environment or start clean:

# Stop and remove all running containers
docker compose down

# Remove old images (optional)
docker rmi dicey_backend nginx:alpine

# Rebuild everything from scratch
docker compose up --build