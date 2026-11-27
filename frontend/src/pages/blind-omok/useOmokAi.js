import { useEffect, useState } from 'react';
import { requestAiMove } from './omokAiRequest.js';
import { canPlay, otherSide } from './omokGame.js';

export function useOmokAi(game, dispatch) {
    const { board, settings } = game;
    const owner = otherSide(settings.side);
    const aiTurn = canPlay(game, owner);
    const [attempt, setAttempt] = useState(0);
    const [feedback, setFeedback] = useState(null);

    useEffect(() => {
        if (!aiTurn) return;

        return requestAiMove({
            createWorker: () => new Worker(new URL('./omokAi.worker.js', import.meta.url), { type: 'module' }),
            board,
            owner,
            difficulty: settings.difficulty,
            onThinking: () => setFeedback({ board, attempt, status: 'thinking' }),
            onMove: ({ row, col }) => {
                setFeedback(null);
                dispatch({ type: 'playAi', expectedBoard: board, row, col });
            },
            onFailure: () => setFeedback({ board, attempt, status: 'error' }),
        });
    }, [aiTurn, attempt, board, dispatch, owner, settings.difficulty]);

    const status = aiTurn && feedback?.board === board && feedback.attempt === attempt ? feedback.status : null;
    return { thinking: status === 'thinking', failed: status === 'error', retry: () => setAttempt((value) => value + 1) };
}
