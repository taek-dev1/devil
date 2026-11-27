import assert from 'node:assert/strict';
import { test } from 'node:test';
import { setTimeout as delay } from 'node:timers/promises';
import { requestAiMove } from './omokAiRequest.js';
import { BLACK, WHITE, createOmokGame } from './omokGame.js';

function startRequest(options = {}) {
    const worker = {
        terminated: 0,
        terminate() { this.terminated++; },
    };
    const events = [];
    const board = createOmokGame().board;
    board[0] = { owner: BLACK, row: 0, col: 0, displayColor: 'red' };
    const started = new Promise((resolve) => {
        worker.postMessage = resolve;
    });
    const cancel = requestAiMove({
        createWorker: () => worker,
        board,
        owner: WHITE,
        difficulty: 'hard',
        onThinking: () => events.push('thinking'),
        onMove: (move) => events.push(move),
        onFailure: () => events.push('error'),
        ...options,
    });
    return { worker, started, cancel, events };
}

test('the Worker receives only ownership and emits at most one valid move', async () => {
    const { worker, started, cancel, events } = startRequest();
    const input = await started;
    assert.deepEqual(input.board[0], { owner: BLACK });
    assert.equal(input.owner, WHITE);
    assert.equal(input.difficulty, 'hard');
    assert.deepEqual(events, []);
    worker.onmessage({ data: { type: 'started' } });
    const reply = { type: 'move', move: { row: 7, col: 7 } };
    worker.onmessage({ data: reply });
    worker.onmessage({ data: reply });
    cancel();
    assert.deepEqual(events, ['thinking', reply.move]);
    assert.equal(worker.terminated, 1);
});

test('cleanup before launch skips the StrictMode probe, and cleanup during search suppresses a late response', async () => {
    let launches = 0;
    const initial = startRequest({ createWorker: () => { launches++; } });
    initial.cancel();

    const { worker, started, cancel, events } = startRequest();
    await started;
    assert.equal(launches, 0);
    worker.onmessage({ data: { type: 'started' } });
    cancel();
    worker.onmessage({ data: { type: 'move', move: { row: 7, col: 7 } } });
    worker.onerror();
    assert.equal(worker.terminated, 1);
    assert.deepEqual(events, ['thinking']);
});

test('occupied, invalid and missing move coordinates fail without another dispatch', async () => {
    for (const move of [{ row: 0, col: 0 }, { row: 15, col: 7 }, { row: 3.5, col: 7 }, null]) {
        const { worker, started, events } = startRequest();
        await started;
        worker.onmessage({ data: { type: 'move', move } });
        assert.deepEqual(events, ['error']);
        assert.equal(worker.terminated, 1);
    }
});

test('worker startup exception, runtime error and missing response each end the request', async () => {
    let launchFailed;
    const failure = new Promise((resolve) => { launchFailed = resolve; });
    startRequest({ createWorker: () => { throw new Error('startup error'); }, onFailure: launchFailed });
    await failure;

    const fatal = startRequest();
    await fatal.started;
    fatal.worker.onerror();
    assert.deepEqual(fatal.events, ['error']);
    assert.equal(fatal.worker.terminated, 1);

    const timed = startRequest({ timeoutMs: 10 });
    await timed.started;
    timed.worker.onmessage({ data: { type: 'started' } });
    await delay(20);
    assert.deepEqual(timed.events, ['thinking', 'error']);
    assert.equal(timed.worker.terminated, 1);
});
