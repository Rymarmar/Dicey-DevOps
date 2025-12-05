const express = require("express");
const cors = require("cors");
const client = require("prom-client");
const { router: diceRoutes } = require("./routes/dice");

const app = express();
app.use(cors());
app.use(express.json());

// ----- Prometheus metrics setup -----
const register = new client.Registry();
client.collectDefaultMetrics({ register });

const httpRequestCounter = new client.Counter({
  name: "http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status"]
});

const rollCounter = new client.Counter({
  name: "dice_rolls_total",
  help: "Total number of dice rolls handled by /play"
});

register.registerMetric(httpRequestCounter);
register.registerMetric(rollCounter);

// middleware to track requests
app.use((req, res, next) => {
  res.on("finish", () => {
    httpRequestCounter.inc({
      method: req.method,
      route: req.path,
      status: res.statusCode
    });
  });
  next();
});

// health
app.get("/", (_req, res) => res.send("Dicey DevOps backend running"));

// game routes, plus roll counter
app.use(
  "/",
  (req, res, next) => {
    if (req.path === "/play" && req.method === "POST") {
      rollCounter.inc();
    }
    next();
  },
  diceRoutes
);

// Prometheus metrics endpoint
app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Backend listening on :${PORT}`));
