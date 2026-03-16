import amqp from "amqplib";
import { clientWelcome,commandStatus,getInput, printClientHelp, printQuit } from "../internal/gamelogic/gamelogic.js";
import { declareAndBind, SimpleQueueType } from "../internal/pubsub/declareAndBind.js";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
import { GameState } from "../internal/gamelogic/gamestate.js";
import { commandSpawn } from "../internal/gamelogic/spawn.js";
import { commandMove } from "../internal/gamelogic/move.js";
import { subscribeJSON } from "../internal/pubsub/subscribeJSON.js";
import { handlerPause } from "./handlers.js";
async function main() {
  console.log("Starting Peril client...");

  const rabbitmqConnString = 'amqp://guest:guest@localhost:5672/';  
  const conn = await amqp.connect(rabbitmqConnString);

  // get username
  let userName;
  try {
    userName = await clientWelcome();
    // await declareAndBind(
    //   conn, 
    //   ExchangePerilDirect, 
    //   `${PauseKey}.${userName}`, 
    //   PauseKey, 
    //   SimpleQueueType.Transient
    // );

    // create gamestate
    const gameState = new GameState(userName);

    await subscribeJSON(conn, ExchangePerilDirect, `${PauseKey}.${userName}`, PauseKey, SimpleQueueType.Transient, handlerPause(gameState));

    while (true) {
      const input: string[] = await getInput();
        if (input.length < 1) {
          continue;
        }

        if (input[0] === 'spawn') {
          commandSpawn(gameState, input);
        } else if (input[0] === 'move') {
          commandMove(gameState, input);
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
