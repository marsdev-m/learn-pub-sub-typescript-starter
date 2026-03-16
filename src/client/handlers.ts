import type { ConfirmChannel } from "amqplib";
import type { ArmyMove } from "../internal/gamelogic/gamedata.js";
import type { GameState, PlayingState } from "../internal/gamelogic/gamestate.js";
import { handleMove, MoveOutcome } from "../internal/gamelogic/move.js";
import { handlePause } from "../internal/gamelogic/pause.js";
import { AckType } from "../internal/pubsub/subscribeJSON.js";
import { publishJSON } from "../internal/pubsub/publishJSON.js";
import { ExchangePerilTopic, WarRecognitionsPrefix } from "../internal/routing/routing.js";
import type { RecognitionOfWar } from "../internal/gamelogic/gamedata.js";
import { handleWar, WarOutcome } from "../internal/gamelogic/war.js";

export function handlerPause(gs: GameState): (ps: PlayingState) => AckType {
    return (ps: PlayingState) => {
        handlePause(gs, ps);
        process.stdout.write('> ')
        return AckType.Ack;
    }
}

export function handlerMove(gs: GameState, ch: ConfirmChannel): (move: ArmyMove) => Promise<AckType> {
    return async (move: ArmyMove) => {
        try {
            const moveResult = handleMove(gs, move);
            console.log(`Moved ${move.units.length} units to ${move.toLocation}`);
            
            if (moveResult === MoveOutcome.Safe) {
                return AckType.Ack;
            } else if (moveResult === MoveOutcome.MakeWar) {
                const rw: RecognitionOfWar = {
                    attacker: move.player,
                    defender: gs.getPlayerSnap(),
                };
                try {
                    await publishJSON(ch, ExchangePerilTopic, `${WarRecognitionsPrefix}.${gs.getUsername()}`, rw);
                    return AckType.Ack;
                } catch (e) {
                    return AckType.NackRequeue;
                }
            } else if (moveResult === MoveOutcome.SamePlayer) {
                return AckType.NackDiscard;
            } else {
                return AckType.NackDiscard;
            }
        } finally {
            process.stdout.write('> ');
        }

    }
}

export function handlerWar(gs: GameState): (rs: RecognitionOfWar) => Promise<AckType> {
    return async (rs: RecognitionOfWar) => {
        try {
            const warResult = handleWar(gs, rs);
            if (warResult.result === WarOutcome.NotInvolved) {
                return AckType.NackRequeue
            } else if (warResult.result === WarOutcome.NoUnits) {
                return AckType.NackDiscard
            } else if (warResult.result === WarOutcome.OpponentWon) {
                return AckType.Ack;
            } else if (warResult.result === WarOutcome.YouWon) {
                return AckType.Ack;
            } else if (warResult.result === WarOutcome.Draw) {
                return AckType.Ack;
            } else {
                console.log('handleWar error!');
                return AckType.NackDiscard;
            }        
        } finally {
            process.stdout.write('> ');
        }
    }
}


