import type { ArmyMove } from "../internal/gamelogic/gamedata.js";
import type { GameState, PlayingState } from "../internal/gamelogic/gamestate.js";
import { handleMove, MoveOutcome } from "../internal/gamelogic/move.js";
import { handlePause } from "../internal/gamelogic/pause.js";
import type { Acktype } from "../internal/pubsub/subscribeJSON.js";

export function handlerPause(gs: GameState): (ps: PlayingState) => Acktype {
    return (ps: PlayingState) => {
        handlePause(gs, ps);
        // process.stdout.write('> ')
        console.log('Ack');
        return "Ack";
    }
}

export function handlerMove(gs: GameState): (move: ArmyMove) => Acktype {
    return (move: ArmyMove) => {
        const moveResult = handleMove(gs, move);
        console.log(`Moved ${move.units.length} units to ${move.toLocation}`);
        if (moveResult === MoveOutcome.Safe || moveResult === MoveOutcome.MakeWar) {
            console.log('Ack');
            return 'Ack';
        } else if (moveResult === MoveOutcome.SamePlayer) {
            console.log('NackDiscard');
            return 'NackDiscard';
        } else {
            console.log('NackDiscard');
            return 'NackDiscard';
        }

    }
}


