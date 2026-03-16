import amqp, { type ConfirmChannel } from "amqplib";
import { clientWelcome,commandStatus,getInput, printClientHelp, printQuit } from "../internal/gamelogic/gamelogic.js";
import { declareAndBind, SimpleQueueType } from "../internal/pubsub/declareAndBind.js";
import { ArmyMovesPrefix, ExchangePerilDirect, ExchangePerilTopic, GameLogSlug, PauseKey } from "../internal/routing/routing.js";
import { GameState } from "../internal/gamelogic/gamestate.js";
import { commandSpawn } from "../internal/gamelogic/spawn.js";
import { commandMove, handleMove } from "../internal/gamelogic/move.js";
import { subscribeJSON } from "../internal/pubsub/subscribeJSON.js";
import { handlerPause, handlerMove, handlerWar } from "./handlers.js";
import { publishJSON, publishMsgPack } from "../internal/pubsub/publishJSON.js";
import { WarRecognitionsPrefix } from "../internal/routing/routing.js";
import type { GameLog } from "../internal/gamelogic/logs.js";

async function main() {
  console.log("Starting Peril client...");

  const rabbitmqConnString = 'amqp://guest:guest@localhost:5672/';  
  const conn = await amqp.connect(rabbitmqConnString);

  // get username
  let userName;
  try {
    userName = await clientWelcome();

    // create gamestate
    const gameState = new GameState(userName);
    const publishCh = await conn.createConfirmChannel();

    await subscribeJSON(conn, ExchangePerilDirect, `${PauseKey}.${userName}`, PauseKey, SimpleQueueType.Transient, handlerPause(gameState));
    await subscribeJSON(conn, ExchangePerilTopic, `${ArmyMovesPrefix}.${userName}`, `${ArmyMovesPrefix}.*`, SimpleQueueType.Transient, handlerMove(gameState, publishCh));
    await subscribeJSON(conn, ExchangePerilTopic, `${WarRecognitionsPrefix}`, `${WarRecognitionsPrefix}.*`, SimpleQueueType.Durable, handlerWar(gameState, publishCh));

    while (true) {
      const input: string[] = await getInput();
        if (input.length < 1) {
          continue;
        }

        if (input[0] === 'spawn') {
          commandSpawn(gameState, input);
        } else if (input[0] === 'move') {
          const move = commandMove(gameState, input);
          publishJSON(publishCh, ExchangePerilTopic, `${ArmyMovesPrefix}.${userName}`, move);
        } else if (input[0] === 'stats') {
          commandStatus(gameState);
        } else if (input[0] === 'help') {
          printClientHelp();
        } else if (input[0] === 'spam') {
          console.log('Spamming not allowed yet');
        } else if (input[0] === 'quit') {
          printQuit();
          break;
        } else {
          console.log('cmd is gibberish');
          continue;
        }
        
    }

  } catch (err) {
    console.log(`err: ${err}`);
  }


}


main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});

export async function publishGameLog(channel: ConfirmChannel, userName: string, msg: string) {
  const gameLog: GameLog = {
    currentTime: new Date(Date.now()),
    username: userName,
    message: msg
  } satisfies GameLog;
  
  await publishMsgPack(channel, ExchangePerilTopic, `${GameLogSlug}.${userName}`, gameLog);
}