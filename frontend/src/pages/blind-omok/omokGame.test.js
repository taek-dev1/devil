import assert from 'node:assert/strict';
import { test } from 'node:test';
import { COLOR_LIMIT, REQUIRED_COLOR_IDS, STONE_COLORS } from './omokColors.js';
import {
    BLACK, WHITE, BOARD_SIZE, HINT_DURATION, HINT_LIMIT, canPlay, canUseHint, cellIndex, createOmokGame,
    getGameStatus, getVisibleColor, getWinningLines, omokReducer,
} from './omokGame.js';

function play(game, row, col, owner = game.turn) {
    return omokReducer(game, { type: 'play', row, col, owner });
}

function start(game = createOmokGame()) {
    return omokReducer(game, { type: 'start' });
}

function useHint(game, now) {
    return omokReducer(game, { type: 'useHint', now });
}

function expireHint(game, now) {
    return omokReducer(game, { type: 'expireHint', now });
}

function boardWithStones(positions, owner) {
    const { board } = createOmokGame();
    for (const [row, col] of positions) {
        board[cellIndex(row, col)] = { row, col, owner, displayColor: 'red' };
    }
    return board;
}

const directions = [
    ['horizontal', 0, 1],
    ['vertical', 1, 0],
    ['down-right diagonal', 1, 1],
    ['down-left diagonal', 1, -1],
];

for (const owner of [BLACK, WHITE]) {
    for (const length of [5, 6]) {
        for (const [name, dr, dc] of directions) {
            test(`${owner} wins with exactly ${length} stones in a ${name} line`, () => {
                const positions = Array.from({ length }, (_, offset) => [4 + offset * dr, 6 + offset * dc]);
                const board = boardWithStones(positions, owner);
                const lines = getWinningLines(board, ...positions[2]);
                assert.deepEqual(lines.map((line) => line.map(({ row, col }) => [row, col])), [positions]);
            });
        }
    }
}

test('an overline is allowed but is not a win, including at the board edge', () => {
    for (const length of [7, 8]) {
        const positions = Array.from({ length }, (_, col) => [0, col]);
        assert.deepEqual(getWinningLines(boardWithStones(positions, BLACK), 0, 3), []);
    }
    let game = start();
    const columns = [0, 1, 2, 4, 5, 6];
    columns.forEach((col, index) => {
        game = play(game, 0, col);
        game = play(game, 8, index * 2);
    });
    const next = play(game, 0, 3, BLACK);
    assert.equal(next.moves.length, 13);
    assert.equal(next.phase, 'playing');
    assert.equal(next.result, null);
    assert.equal(next.turn, WHITE);
});

test('a 7-stone line does not invalidate a simultaneous 5-stone win', () => {
    const horizontal = Array.from({ length: 7 }, (_, col) => [7, 4 + col]);
    const vertical = Array.from({ length: 5 }, (_, row) => [5 + row, 7]);
    const result = getWinningLines(boardWithStones([...horizontal, ...vertical], WHITE), 7, 7);
    assert.deepEqual(result.map((line) => line.map(({ row, col }) => [row, col])), [vertical]);
});

test('rule checks use the owner even when all display colors match and preserve both winning lines', () => {
    const horizontal = Array.from({ length: 5 }, (_, col) => [7, 5 + col]);
    const vertical = Array.from({ length: 6 }, (_, row) => [5 + row, 7]);
    const board = boardWithStones([...horizontal, ...vertical], BLACK);
    assert.deepEqual(getWinningLines(board, 7, 7).map((line) => line.length), [5, 6]);
    board[cellIndex(7, 5)] = { row: 7, col: 5, owner: WHITE, displayColor: 'red' };
    assert.deepEqual(getWinningLines(board, 7, 7).map((line) => line.length), [6]);
});

for (const owner of [BLACK, WHITE]) {
    for (const [name, neighbors] of [
        ['33', [[7, 6], [7, 8], [6, 7], [8, 7]]],
        ['44', [[7, 6], [7, 8], [7, 9], [6, 7], [8, 7], [9, 7]]],
    ]) {
        test(`${owner} can play a ${name} move`, () => {
            let game = start();
            neighbors.forEach(([row, col], index) => {
                if (owner === WHITE) game = play(game, 0, index * 2, BLACK);
                game = play(game, row, col, owner);
                if (owner === BLACK) game = play(game, 0, index * 2, WHITE);
            });
            if (owner === WHITE) game = play(game, 0, neighbors.length * 2, BLACK);
            const next = play(game, 7, 7, owner);
            assert.equal(next.board[cellIndex(7, 7)].owner, owner);
            assert.equal(next.phase, 'playing');
            assert.equal(next.result, null);
        });
    }
}

test('black starts and invalid, out-of-turn and occupied moves do not change state', () => {
    const setup = createOmokGame();
    assert.equal(play(setup, 7, 7, BLACK), setup);
    const game = start(setup);
    assert.equal(game.turn, BLACK);
    assert.equal(play(game, 7, 7, WHITE), game);
    for (const [row, col] of [[-1, 1], [15, 0], [0, 15], [0, -1], [0, 0.5], ['0', 2]]) {
        assert.equal(play(game, row, col), game);
    }
    const next = play(game, 7, 7);
    assert.equal(game.board[cellIndex(7, 7)], null);
    assert.equal(next.turn, WHITE);
    assert.equal(play(next, 7, 7), next);
    assert.equal(play(next, 8, 8).turn, BLACK);
});

for (const winner of [BLACK, WHITE]) {
    test(`${winner} winning move records the line and prevents further moves`, () => {
        let game = start();
        for (let col = 0; col < 5; col++) {
            game = play(game, winner === BLACK ? 5 : 0, winner === BLACK ? col : col * 2, BLACK);
            game = play(game, winner === WHITE ? 5 : 0, winner === WHITE ? col : col * 2, WHITE);
        }
        assert.equal(game.phase, 'finished');
        assert.equal(game.turn, null);
        assert.equal(game.result.winner, winner);
        assert.equal(game.result.winningLines[0].length, 5);
        assert.equal(getGameStatus(game), winner === BLACK ? 'win' : 'loss');
        assert.equal(play(game, 9, 9, WHITE), game);
        assert.equal(canUseHint(game), false);
    });
}

test('225 legal moves without a winning line produce a draw', () => {
    const blackPositions = [];
    const whitePositions = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const positions = (row + Math.floor(col / 2)) % 2 === 0 ? blackPositions : whitePositions;
            positions.push([row, col]);
        }
    }
    let game = start();
    blackPositions.forEach(([row, col], index) => {
        game = play(game, row, col);
        if (whitePositions[index]) game = play(game, ...whitePositions[index]);
    });
    assert.equal(game.moves.length, 225);
    assert.equal(game.phase, 'finished');
    assert.deepEqual(game.result, { winner: null, winningLines: [] });
    assert.equal(getGameStatus(game), 'draw');
});

test('palette keeps black and white, caps at seven, and locks together with side and difficulty', () => {
    let game = createOmokGame();
    assert.deepEqual(game.settings.colorIds, REQUIRED_COLOR_IDS);
    assert.equal(omokReducer(game, { type: 'toggleColor', colorId: 'black' }), game);
    assert.equal(omokReducer(game, { type: 'toggleColor', colorId: 'invalid' }), game);
    for (const { id } of STONE_COLORS) game = omokReducer(game, { type: 'toggleColor', colorId: id });
    assert.equal(game.settings.colorIds.length, COLOR_LIMIT);
    assert.ok(REQUIRED_COLOR_IDS.every((id) => game.settings.colorIds.includes(id)));
    assert.equal(omokReducer(game, { type: 'toggleColor', colorId: 'purple' }), game);
    game = omokReducer(game, { type: 'toggleColor', colorId: 'red' });
    assert.equal(game.settings.colorIds.length, COLOR_LIMIT - 1);
    game = omokReducer(game, { type: 'setSide', side: WHITE });
    game = omokReducer(game, { type: 'setDifficulty', difficulty: 'hard' });
    game = start(game);
    assert.equal(omokReducer(game, { type: 'setSide', side: BLACK }), game);
    assert.equal(omokReducer(game, { type: 'setDifficulty', difficulty: 'easy' }), game);
    assert.equal(omokReducer(game, { type: 'toggleColor', colorId: 'purple' }), game);
    assert.equal(omokReducer(game, { type: 'selectColor', colorId: 'purple' }), game);
});

test('display color is recorded per move, and the AI follows the last actual user move', () => {
    let game = start(omokReducer(createOmokGame(), { type: 'toggleColor', colorId: 'red' }));
    game = omokReducer(game, { type: 'selectColor', colorId: 'red' });
    game = play(game, 7, 7);
    game = omokReducer(game, { type: 'selectColor', colorId: 'white' });
    game = play(game, 7, 8);
    game = play(game, 7, 9);
    assert.deepEqual(game.moves.map(({ owner, displayColor }) => [owner, displayColor]), [
        [BLACK, 'red'], [WHITE, 'red'], [BLACK, 'white'],
    ]);
    assert.equal(getVisibleColor(game.moves[0], true), 'black');
    assert.equal(getVisibleColor(game.moves[1], true), 'white');
});

test('AI opening move is black regardless of the color selected by a user playing white', () => {
    let game = start(omokReducer(createOmokGame(), { type: 'setSide', side: WHITE }));
    assert.equal(game.selectedColor, 'white');
    assert.equal(getGameStatus(game), 'ai');
    assert.equal(getGameStatus(game, true), 'thinking');
    assert.equal(canPlay(game, WHITE), false);
    assert.equal(useHint(game, 0), game);
    game = play(game, 7, 7);
    assert.equal(game.moves[0].displayColor, 'black');
    assert.equal(getGameStatus(game), 'player');
});

test('hint reveals real colors for five seconds, blocks all moves, and can only be used twice', () => {
    let game = start(omokReducer(createOmokGame(), { type: 'toggleColor', colorId: 'red' }));
    game = omokReducer(game, { type: 'selectColor', colorId: 'red' });
    game = play(play(game, 7, 7), 7, 8);
    const startTime = 100;
    const showing = useHint(game, startTime);
    assert.equal(showing.hintsLeft, 1);
    assert.equal(showing.hintExpiresAt, startTime + HINT_DURATION);
    assert.equal(getGameStatus(showing), 'hint');
    assert.equal(useHint(showing, startTime + 1), showing);
    assert.equal(play(showing, 8, 8, BLACK), showing);
    assert.equal(play(showing, 8, 8, WHITE), showing);
    assert.deepEqual(showing.moves.map((stone) => getVisibleColor(stone, true)), ['black', 'white']);
    assert.equal(expireHint(showing, startTime + HINT_DURATION - 1), showing);
    const resumed = expireHint(showing, startTime + HINT_DURATION);
    assert.equal(resumed.hintExpiresAt, null);
    assert.equal(getGameStatus(resumed), 'player');
    assert.deepEqual(resumed.moves.map((stone) => getVisibleColor(stone, false)), ['red', 'red']);
    game = useHint(resumed, 10_000);
    assert.equal(game.hintsLeft, 0);
    game = expireHint(game, 15_000);
    assert.equal(useHint(game, 15_001), game);
});

test('reset during a hint restores setup with prior settings and clears the old deadline', () => {
    let game = omokReducer(createOmokGame(), { type: 'setSide', side: WHITE });
    game = omokReducer(game, { type: 'setDifficulty', difficulty: 'hard' });
    game = omokReducer(game, { type: 'toggleColor', colorId: 'red' });
    game = useHint(play(start(game), 7, 7), 0);
    const reset = omokReducer(game, { type: 'reset' });
    assert.deepEqual(reset.settings, game.settings);
    assert.equal(getGameStatus(reset), 'setup');
    assert.equal(reset.hintsLeft, HINT_LIMIT);
    assert.equal(reset.hintExpiresAt, null);
    assert.equal(reset.turn, BLACK);
    assert.deepEqual(reset.moves, []);
    assert.ok(reset.board.every((cell) => cell === null));
    assert.equal(expireHint(reset, HINT_DURATION), reset);
    assert.equal(omokReducer(reset, { type: 'setDifficulty', difficulty: 'easy' }).settings.difficulty, 'easy');
});
