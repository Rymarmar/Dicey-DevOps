import express from "express";
import cors from "cors";
import diceRoutes from "./routes/dice.js";

const app = express();
app.use(cors());
app.use(express.json());

// health
app.get("/", (_req, res) => res.send("Dicey DevOps backend running"));

// game routes
app.use("/", diceRoutes); // exposes: GET /roll, POST /play

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Backend listening on :${PORT}`));
