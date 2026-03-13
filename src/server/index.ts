import amqp from "amqplib";
import process from "node:process";
import { ExchangePerilDirect, PauseKey } from "../internal/routing/routing.js";
import { publishJSON } from "../internal/pubsub/publishJSON.js";
import { printServerHelp, getInput } from "../internal/gamelogic/gamelogic.js";
import { declareAndBind, SimpleQueueType } from "../internal/pubsub/declareAndBind.js";

async function main() {
  const rabbitmqConnString = 'amqp://guest:guest@localhost:5672/';  
  const conn = await amqp.connect(rabbitmqConnString);
  console.log('RabbitMQ connection successful');

  const confirmChannel = await conn.createConfirmChannel();
  


  try {
    
    declareAndBind(conn, 'peril_topic', 'game_logs', 'game_logs.*', SimpleQueueType.Durable);

    printServerHelp();
    while (true) {
      const input: string[] = await getInput();
      if (input.length < 1) {
        continue;
      }


      if (input[0] === 'pause') {
        console.log('sending pause message');
        await publishJSON(confirmChannel, ExchangePerilDirect, PauseKey, { isPaused: true });
      } else if (input[0] === 'resume') {
        console.log('sending resume message');
        await publishJSON(confirmChannel, ExchangePerilDirect, PauseKey, { isPaused: false });
      } else if (input[0] === 'quit') {
        console.log('sending quit message');
        break;
      } else {
        console.log('gibberish cmd');
      }
    }
  } catch (err) {
    console.log('error!');
  }
  
  process.on('SIGINT', () => {
    console.log('Shutting down server');
    conn.close();
  });

  console.log("Starting Peril server...");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
