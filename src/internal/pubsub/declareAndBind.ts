import amqp, { type Channel } from "amqplib";

export enum SimpleQueueType {
  Durable,
  Transient,
}

export async function declareAndBind(
  conn: amqp.ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType,
): Promise<[Channel, amqp.Replies.AssertQueue]> {
        const channel: Channel = await conn.createChannel();
        const queue = await channel.assertQueue(queueName, {
            durable: queueType === SimpleQueueType.Durable ? true : false,
            autoDelete: queueType === SimpleQueueType.Transient ? true : false,
            exclusive: queueType === SimpleQueueType.Transient ? true : false
        });
        await channel.bindQueue(queueName, exchange, key);

        return new Promise((resolve, reject) => {
            resolve([channel, queue]);
        });
    
}