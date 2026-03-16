import amqp from 'amqplib';
import { declareAndBind } from './declareAndBind.js';

export enum SimpleQueueType {
  Durable,
  Transient,
}

export enum AckType {
    Ack = 'Ack',
    NackRequeue = 'NackRequeue',
    NackDiscard = 'NackDiscard',
}

export async function subscribeJSON<T>(
    
  conn: amqp.ChannelModel,
  exchange: string,
  queueName: string,
  key: string,
  queueType: SimpleQueueType,
  handler: (data: T) => AckType | Promise<AckType>,
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
            Promise.resolve(handler(parsedMessage)).then((result) => {
                if (result === AckType.Ack) {
                    channel.ack(msg);
                } else if (result === AckType.NackDiscard) {
                    channel.nack(msg, false, false);
                } else if (result === AckType.NackRequeue) {
                    channel.nack(msg, false, true);
                }
            }).catch((err) => {
                console.log('handler error: ', err);
            });
        } catch (err) {
            console.log('subscribeJSON error: ', err);
        }
    });
    
       

    return new Promise((resolve, reject) => {
        resolve();
    });
}