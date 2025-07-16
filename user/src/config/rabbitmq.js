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
exports.publishToQueue = exports.connectRabbitMQ = void 0;
const amqplib_1 = __importDefault(require("amqplib"));
let channel;
const connectRabbitMQ = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const connection = yield amqplib_1.default.connect({
            protocol: "amqp",
            hostname: process.env.Rabbitmq_host,
            port: 5672,
            username: process.env.Rabbitmq_Username,
            password: process.env.Rabbitmq_password,
        });
        channel = yield connection.createChannel();
        console.log("Connected to RabbitMQ");
    }
    catch (error) {
        console.error("RabbitMQ connection error:", error);
        process.exit(1);
    }
});
exports.connectRabbitMQ = connectRabbitMQ;
const publishToQueue = (queueName, message) => __awaiter(void 0, void 0, void 0, function* () {
    if (!channel) {
        console.log("Rabbitmq channel is not initialized ");
        return;
    }
    yield channel.assertQueue(queueName, { durable: true });
    channel.sendToQueue(queueName, Buffer.from(JSON.stringify(message)));
});
exports.publishToQueue = publishToQueue;
