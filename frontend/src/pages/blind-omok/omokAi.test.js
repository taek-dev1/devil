import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AI_LEVELS, findAiMove } from './omokAi.js';
import { BLACK, BOARD_SIZE, WHITE, cellIndex, createOmokGame, getWinningLines, isEmptyCell, omokReducer } from './omokGame.js';

const levels = Object.keys(AI_LEVELS);
const deterministic = { now: () => 0, random: () => 0 };

function position(stones) {
    const { board } = createOmokGame();
    for (const [row, col, owner] of stones) board[cellIndex(row, col)] = { row, col, owner, displayColor: 'red' };
    return board;
}

function rowOf(columns, owner, row = 7) {
    return columns.map((col) => [row, col, owner]);
}

for (const level of levels) {
    test(`${level}: opens at the center and uses every owner's position regardless of display color`, () => {
        assert.deepEqual(findAiMove(position([]), BLACK, level).move, { row: 7, col: 7 });
        const board = position([...rowOf([0, 1, 2, 3], BLACK, 0), ...rowOf([5, 6, 7, 8], WHITE)]);
        const result = findAiMove(board, BLACK, level, { ...deterministic, random: () => 0.999 });
        assert.deepEqual(result.move, { row: 0, col: 4 }); // Win before blocking the opposing open four.
    });

    test(`${level}: blocks the only immediate win even with easy-mode variety`, () => {
        const board = position([...rowOf([0, 1, 2, 3], WHITE, 0), [7, 7, BLACK]]);
        assert.deepEqual(findAiMove(board, BLACK, level, { ...deterministic, random: () => 0.999 }).move, { row: 0, col: 4 });
    });

    test(`${level}: completes exact six and ignores seven unless another axis wins`, () => {
        const six = position([...rowOf([0, 1, 2, 4, 5], BLACK), [7, 6, WHITE]]);
        const sixResult = findAiMove(six, BLACK, level, deterministic);
        assert.deepEqual(sixResult.move, { row: 7, col: 3 });
        six[cellIndex(7, 3)] = { row: 7, col: 3, owner: BLACK };
        assert.equal(getWinningLines(six, 7, 3)[0].length, 6);

        const seven = rowOf([0, 1, 2, 4, 5, 6], BLACK);
        const danger = position([...seven, [7, 7, WHITE], ...rowOf([0, 1, 2, 3], WHITE, 0)]);
        assert.deepEqual(findAiMove(danger, BLACK, level, deterministic).move, { row: 0, col: 4 });

        const crossing = position([...seven, [7, 7, WHITE], [2, 3, WHITE], ...[3, 4, 5, 6].map((row) => [row, 3, BLACK])]);
        assert.deepEqual(findAiMove(crossing, BLACK, level, deterministic).move, { row: 7, col: 3 });
        crossing[cellIndex(7, 3)] = { row: 7, col: 3, owner: BLACK };
        assert.deepEqual(getWinningLines(crossing, 7, 3).map((line) => line.length), [5]);
    });
}

test('easy varies ordinary opening responses within its shallow shortlist', () => {
    const board = position([[7, 7, BLACK]]);
    const first = findAiMove(board, WHITE, 'easy', deterministic);
    const another = findAiMove(board, WHITE, 'easy', { ...deterministic, random: () => 0.999 });
    assert.equal(first.depth, 1);
    assert.notDeepEqual(first.move, another.move);
    for (const { move } of [first, another]) assert.ok(isEmptyCell(board, move.row, move.col));
});

test('medium searches two plies and can choose a comparable response in a quiet position', () => {
    const board = position([
        [7, 7, BLACK], [10, 4, BLACK], [10, 9, BLACK],
        [5, 5, WHITE], [4, 4, WHITE], [4, 9, WHITE],
    ]);
    const best = findAiMove(board, BLACK, 'medium', deterministic);
    const alternative = findAiMove(board, BLACK, 'medium', { ...deterministic, random: () => 0.999 });
    assert.equal(best.depth, 2);
    assert.equal(alternative.depth, 2);
    assert.deepEqual(best.move, { row: 9, col: 5 });
    assert.deepEqual(alternative.move, { row: 8, col: 6 });
});

test('hard finds the subsequent fork and searches deeper than medium and easy', () => {
    const board = position([
        [7, 6, BLACK], [7, 8, BLACK], [6, 7, BLACK], [8, 7, BLACK],
        [8, 8, WHITE], [6, 6, WHITE], [5, 5, WHITE],
    ]);
    const [easy, medium, hard] = levels.map((level) => findAiMove(board, BLACK, level, deterministic));
    assert.deepEqual([easy.depth, medium.depth, hard.depth], [1, 2, 3]);
    assert.ok(easy.nodes < medium.nodes && medium.nodes < hard.nodes);
    assert.deepEqual(hard.move, { row: 7, col: 7 });
});

test('the search depth and pattern scoring can change medium and hard decisions', () => {
    const board = position([
        [7, 7, BLACK], [5, 9, BLACK], [9, 9, BLACK], [8, 7, BLACK], [5, 12, BLACK], [4, 5, BLACK],
        [8, 8, WHITE], [9, 6, WHITE], [4, 6, WHITE], [7, 4, WHITE], [10, 6, WHITE], [11, 8, WHITE],
    ]);
    const [easy, medium, hard] = levels.map((level) => findAiMove(board, BLACK, level, deterministic));
    assert.deepEqual([easy.depth, medium.depth, hard.depth], [1, 2, 4]);
    assert.equal(new Set([easy, medium, hard].map(({ move }) => JSON.stringify(move))).size, 3);
});

test('timeout returns a legal fallback without mutating the source board', () => {
    const board = position([[7, 7, BLACK], [8, 8, WHITE]]);
    const before = structuredClone(board);
    let time = 0;
    const result = findAiMove(board, BLACK, 'hard', { ...deterministic, now: () => (time += 1_000) });
    assert.equal(result.depth, 0);
    assert.ok(isEmptyCell(board, result.move.row, result.move.col));
    assert.deepEqual(board, before);
    assert.equal(findAiMove(Array(BOARD_SIZE ** 2).fill({ owner: BLACK }), WHITE, 'hard').move, null);
});

test('engine replies enter the reducer once and preserve a complete move history', () => {
    for (const side of [BLACK, WHITE]) {
        let game = omokReducer(createOmokGame({ side, difficulty: 'easy', colorIds: ['black', 'white', 'red'] }), { type: 'start' });
        for (let turn = 0; turn < 8; turn++) {
            const { board, turn: owner } = game;
            const { move } = findAiMove(board, owner, 'easy', deterministic);
            if (owner === side) {
                game = omokReducer(game, { type: 'selectColor', colorId: 'red' });
                game = omokReducer(game, { type: 'play', ...move, owner });
                game = omokReducer(game, { type: 'selectColor', colorId: 'white' });
            } else {
                const action = { type: 'playAi', expectedBoard: board, ...move };
                const reset = omokReducer(game, { type: 'reset' });
                const restarted = omokReducer(reset, { type: 'start' });
                assert.equal(omokReducer(restarted, action), restarted);
                assert.equal(omokReducer(game, { ...action, row: -1 }), game);
                game = omokReducer(game, action);
                assert.equal(omokReducer(game, action), game);
            }
            assert.equal(game.moves.length, turn + 1);
            const stone = game.moves[turn];
            assert.deepEqual(stone, { ...move, owner, displayColor: turn === 0 && side === WHITE ? 'black' : 'red' });
            assert.equal(game.board[cellIndex(move.row, move.col)], stone);
            assert.notEqual(game.turn, owner);
        }
    }
});

test('an AI reply can end the game and subsequent replies are ignored', () => {
    let game = omokReducer(createOmokGame({ side: WHITE, difficulty: 'hard', colorIds: ['black', 'white'] }), { type: 'start' });
    for (let col = 0; col < 4; col++) {
        game = omokReducer(game, { type: 'playAi', expectedBoard: game.board, row: 0, col });
        game = omokReducer(game, { type: 'play', owner: WHITE, row: 7, col: col * 2 });
    }
    const { move } = findAiMove(game.board, BLACK, 'hard', deterministic);
    game = omokReducer(game, { type: 'playAi', expectedBoard: game.board, ...move });
    assert.equal(game.phase, 'finished');
    assert.equal(game.result.winner, BLACK);
    assert.equal(game.result.winningLines[0].length, 5);
    assert.equal(omokReducer(game, { type: 'playAi', expectedBoard: game.board, row: 14, col: 14 }), game);
});

test('AI plays the final empty cell and the reducer records a draw', () => {
    const black = [];
    const white = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
        for (let col = 0; col < BOARD_SIZE; col++) {
            const side = (row + Math.floor(col / 2)) % 2 === 0 ? black : white;
            side.push({ row, col });
        }
    }
    let game = omokReducer(createOmokGame({ side: WHITE, difficulty: 'hard', colorIds: ['black', 'white'] }), { type: 'start' });
    white.forEach((move, index) => {
        game = omokReducer(game, { type: 'playAi', expectedBoard: game.board, ...black[index] });
        game = omokReducer(game, { type: 'play', owner: WHITE, ...move });
    });
    const { move } = findAiMove(game.board, BLACK, 'hard', deterministic);
    assert.deepEqual(move, black.at(-1));
    game = omokReducer(game, { type: 'playAi', expectedBoard: game.board, ...move });
    assert.equal(game.moves.length, BOARD_SIZE ** 2);
    assert.equal(game.phase, 'finished');
    assert.deepEqual(game.result, { winner: null, winningLines: [] });
});
