"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const db_js_1 = __importDefault(require("./config/db.js"));
const redis_1 = require("redis");
const user_js_1 = __importDefault(require("./routes/user.js"));
const rabbitmq_js_1 = require("./config/rabbitmq.js");
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use(express_1.default.json());
exports.redisClient = (0, redis_1.createClient)({
    url: process.env.REDIS_URL,
});
exports.redisClient
    .connect()
    .then(() => {
    console.log("✅ Connected to Redis");
})
    .catch((err) => {
    console.error("❌ Redis connection error:", err);
});
app.use("/api/v1", user_js_1.default);
(0, db_js_1.default)();
(0, rabbitmq_js_1.connectRabbitMQ)();
const PORT = process.env.PORT;
app.get("/", (_req, res) => {
    res.send("Hello, world!");
});
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
