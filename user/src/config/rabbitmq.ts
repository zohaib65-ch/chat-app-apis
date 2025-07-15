import amqp from "amqplib";

let channel: amqp.Channel;

export const connectRabbitMQ = async () => {
  try {
    const connection = await amqp.connect({
      protocol: "amqp",
      hostname: process.env.Rabbitmq_host,
      port: 5672,
      username: process.env.Rabbitmq_Username,
      password: process.env.Rabbitmq_password,
    });

    channel = await connection.createChannel();
    console.log("Connected to RabbitMQ");
  } catch (error) {
    console.error("RabbitMQ connection error:", error);
    process.exit(1);
  }
};

export const publishToQueue = async (queueName: string, message: any) => {
  if (!channel) {
    console.log("Rabbitmq channel is not initialized ");
    return;
  }

  await channel.assertQueue(queueName, { durable: true });
  channel.sendToQueue(queueName,Buffer.from(JSON.stringify(message)))
};
