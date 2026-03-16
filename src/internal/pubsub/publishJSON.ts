import type { ConfirmChannel } from "amqplib";
import { encode } from "@msgpack/msgpack";

export function publishJSON<T>(ch: ConfirmChannel, exchange: string, routingKey: string, value: T): Promise<void> {
    const serialized = Buffer.from(JSON.stringify(value));

    return new Promise((resolve, reject) => {
        ch.publish(exchange, routingKey, serialized, { contentType: 'application/json' }, (err) => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
}

export function publishMsgPack<T>(
  ch: ConfirmChannel,
  exchange: string,
  routingKey: string,
  value: T,
): Promise<void> {
    const encoded: Uint8Array = encode(value);
    const buffer: Buffer = Buffer.from(encoded.buffer, encoded.byteOffset, encoded.byteLength);

    return new Promise((resolve, reject) => {
        ch.publish(exchange, routingKey, buffer, { contentType: 'application/x-msgpack' }, (err) => {
            if (err) {
                return reject(err);
            }
            resolve();
        });
    });
}