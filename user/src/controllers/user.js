"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loginUser = void 0;
const index_1 = require("../index");
const TryCatch_1 = __importDefault(require("../config/TryCatch"));
const rabbitmq_1 = require("../config/rabbitmq");
exports.loginUser = (0, TryCatch_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    const rateLimitKey = `otp:ratelimit:${email}`;
    const ratelimit = yield index_1.redisClient.get(rateLimitKey);
    if (ratelimit) {
        res.status(429).json({
            message: "To many requests. Please wait before requesting new otp",
        });
        return;
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpKey = `otp:${email}`;
    yield index_1.redisClient.set(otpKey, otp, {
        EX: 300,
    });
    yield index_1.redisClient.set(rateLimitKey, "true", {
        EX: 60,
    });
    const message = {
        to: email,
        subject: "Your OTP code",
        body: `Your OTP is ${otp}. It is valid for 5 minutes`,
    };
    yield (0, rabbitmq_1.publishToQueue)("send-otp", message),
        res.status(200).json({
            message: "OTP send to your mail",
        });
}));
