import { findAiMove } from './omokAi.js';

self.onmessage = ({ data: { board, owner, difficulty } }) => {
    self.postMessage({ type: 'started' });
    try {
        const { move } = findAiMove(board, owner, difficulty);
        self.postMessage({ type: 'move', move });
    } catch {
        self.postMessage({ type: 'error' });
    }
};
