import assert from 'node:assert/strict';
import { test } from 'node:test';
import { BLACK, BOARD_SIZE, WHITE, createDefaultAiGame, getGameStatus, getVisibleColor, omokReducer } from './omokGame.js';
import { getReviewFrame } from './omokReviewFrame.js';

function winningGame(winner = BLACK) {
    let game = createDefaultAiGame();
    game = omokReducer(game, { type: 'selectColor', colorId: 'red' });
    for (let col = 0; col < 5; col++) {
        game = omokReducer(game, { type: 'play', owner: BLACK, row: 0, col: winner === BLACK ? col : col * 2 });
        game = omokReducer(game, { type: 'play', owner: WHITE, row: 2, col: winner === WHITE ? col : col * 2 });
    }
    return game;
}

for (const winner of [BLACK, WHITE]) {
    test(`review opens at the final move in actual colors for a ${winner} win`, () => {
        const game = winningGame(winner);
        const frame = getReviewFrame(game.moves, game.result.winningLines);
        assert.equal(getGameStatus(game), winner === BLACK ? 'win' : 'loss');
        assert.equal(frame.moveNumber, game.moves.length);
        assert.equal(frame.moveCount, game.moves.length);
        assert.equal(frame.colorMode, 'actual');
        assert.deepEqual(frame.moves, game.moves);
        assert.deepEqual(frame.winningLines, game.result.winningLines);
        assert.equal(frame.moves.at(-1).owner, winner);
    });
}

test('seeking includes only the chosen prefix and the winning line at the final move', () => {
    const game = winningGame();
    const frameAt = (moveNumber) => getReviewFrame(game.moves, game.result.winningLines, { moveNumber });
    assert.deepEqual(frameAt(-1).moves, []);
    assert.equal(frameAt(0).moves.at(-1), undefined);
    assert.equal(frameAt(0).moveNumber, 0);
    assert.deepEqual(frameAt(0).winningLines, []);
    const mid = frameAt(4);
    assert.deepEqual(mid.moves, game.moves.slice(0, 4));
    assert.equal(mid.moves.at(-1), game.moves[3]);
    assert.deepEqual(mid.winningLines, []);
    assert.deepEqual(frameAt(game.moves.length - 1).winningLines, []);
    assert.deepEqual(frameAt(game.moves.length + 1).winningLines, game.result.winningLines);
});

test('color switching preserves the selected move and game data, using the original recorded blind colors', () => {
    let game = createDefaultAiGame();
    game = omokReducer(game, { type: 'selectColor', colorId: 'red' });
    game = omokReducer(game, { type: 'play', owner: BLACK, row: 3, col: 2 });
    game = omokReducer(game, { type: 'play', owner: WHITE, row: 4, col: 4 });
    game = omokReducer(game, { type: 'useHint', now: 100 });
    const snapshot = structuredClone(game);
    const actual = getReviewFrame(game.moves, [], { moveNumber: 2, colorMode: 'actual' });
    const blind = getReviewFrame(game.moves, [], { moveNumber: 2, colorMode: 'blind' });

    assert.equal(actual.moveNumber, blind.moveNumber);
    assert.deepEqual(actual.moves, blind.moves);
    assert.deepEqual(actual.moves.map((stone) => getVisibleColor(stone, actual.revealed)), ['black', 'white']);
    assert.deepEqual(blind.moves.map((stone) => getVisibleColor(stone, blind.revealed)), ['red', 'red']);
    assert.deepEqual(game, snapshot);
    assert.notEqual(blind.moves, game.moves);
});

test('draw review includes all 225 moves and never has a winning line', () => {
    const positions = { [BLACK]: [], [WHITE]: [] };
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            positions[(row + Math.floor(col / 2)) % 2 === 0 ? BLACK : WHITE].push([row, col]);
        }
    }
    let game = createDefaultAiGame();
    for (let i = 0; i < BOARD_SIZE ** 2; i++) {
        const owner = game.turn;
        const [row, col] = positions[owner][Math.floor(i / 2)];
        game = omokReducer(game, { type: 'play', owner, row, col });
    }
    assert.equal(getGameStatus(game), 'draw');
    const frame = getReviewFrame(game.moves, game.result.winningLines);
    assert.equal(frame.moveNumber, 225);
    assert.deepEqual(frame.winningLines, []);
    assert.equal(frame.moves.at(-1), game.moves.at(-1));
});
