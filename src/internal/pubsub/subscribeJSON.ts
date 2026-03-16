import amqp from 'amqplib';
import { declareAndBind } from './declareAndBind.js';

export enum SimpleQueueType {
  Durable,
  Transient,
}

export async function subscribeJSON<T>(
    
  conn: amqp.ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType,
  handler: (data: T) => void,
): Promise<void> {
    const [channel, queue] = await declareAndBind(conn, exchange, queueName, key, queueType);
    channel.consume(queueName, (msg: amqp.ConsumeMessage | null) => {
        if (msg === null) {
            console.log('subscribeJSON(): no msg')
            return;
        }
        try {
            const parsedMessage = JSON.parse(msg.content.toString());
            console.log('parsedMessage: ', parsedMessage);
            handler(parsedMessage);
            channel.ack(msg);        
        } catch (err) {
            console.log('subscribeJSON error: ', err);
        }
    });
    
       

    return new Promise((resolve, reject) => {
        resolve();
    });
}