import { isEmptyCell } from './omokGame.js';

const workerTimeoutMs = 2_500;

export function requestAiMove({ createWorker, board, owner, difficulty, onThinking, onMove, onFailure, timeoutMs = workerTimeoutMs }) {
    let worker;
    let watchdog;
    let active = true;
    function close() {
        if (!active) return;
        active = false;
        clearTimeout(launch);
        clearTimeout(watchdog);
        worker?.terminate();
    }

    function fail() {
        if (!active) return;
        close();
        onFailure();
    }

    // StrictMode cleans up its initial effect before this task can start a Worker.
    const launch = setTimeout(() => {
        try {
            worker = createWorker();
            worker.onerror = fail;
            worker.onmessageerror = fail;
            worker.onmessage = ({ data }) => {
                if (!active) return;
                if (data?.type === 'started') {
                    onThinking();
                    return;
                }
                const { row, col } = data?.move ?? {};
                if (data?.type !== 'move' || !isEmptyCell(board, row, col)) {
                    fail();
                    return;
                }
                close();
                onMove({ row, col });
            };
            watchdog = setTimeout(fail, timeoutMs);
            worker.postMessage({ board: board.map((stone) => stone ? { owner: stone.owner } : null), owner, difficulty });
        } catch {
            fail();
        }
    }, 0);
    return close;
}
