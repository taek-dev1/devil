import { COLOR_LIMIT, REQUIRED_COLOR_IDS, STONE_COLORS } from './omokColors.js';

export const BOARD_SIZE = 15;
export const BLACK = 'BLACK';
export const WHITE = 'WHITE';
export const HINT_DURATION = 5_000;
export const HINT_LIMIT = 2;

export const DIFFICULTIES = [
    { id: 'easy', name: '하' },
    { id: 'medium', name: '중' },
    { id: 'hard', name: '상' },
];

export const DIRECTIONS = [[0, 1], [1, 0], [1, 1], [1, -1]];
const cellCount = BOARD_SIZE ** 2;

export function otherSide(owner) {
    return owner === BLACK ? WHITE : BLACK;
}

export function cellIndex(row, col) {
    return row * BOARD_SIZE + col;
}

export function isOnBoard(row, col) {
    return Number.isInteger(row) && Number.isInteger(col) &&
        row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

export function isEmptyCell(board, row, col) {
    return isOnBoard(row, col) && board[cellIndex(row, col)] === null;
}

export function countStones(board, row, col, rowStep, colStep, owner) {
    let count = 0;
    while (isOnBoard(row, col)) {
        const stone = board[cellIndex(row, col)];
        if (stone?.owner !== owner) break;
        count++;
        row += rowStep;
        col += colStep;
    }
    return count;
}

export function isWinningLength(length) {
    return length === 5 || length === 6;
}

export function getWinningLines(board, row, col) {
    if (!isOnBoard(row, col)) return [];
    const stone = board[cellIndex(row, col)];
    if (!stone) return [];

    const lines = [];
    for (const [dr, dc] of DIRECTIONS) {
        const before = countStones(board, row - dr, col - dc, -dr, -dc, stone.owner);
        const after = countStones(board, row + dr, col + dc, dr, dc, stone.owner);
        const length = before + 1 + after;
        if (isWinningLength(length)) {
            lines.push(Array.from({ length }, (_, index) => {
                const offset = index - before;
                return board[cellIndex(row + offset * dr, col + offset * dc)];
            }));
        }
    }
    return lines;
}

export function createOmokGame(settings = {
    side: BLACK,
    difficulty: 'medium',
    colorIds: [...REQUIRED_COLOR_IDS],
}) {
    return {
        settings,
        board: Array(cellCount).fill(null),
        moves: [],
        turn: BLACK,
        selectedColor: settings.side.toLowerCase(),
        phase: 'setup',
        result: null,
        hintsLeft: HINT_LIMIT,
        hintExpiresAt: null,
    };
}

export function canPlay(game, owner) {
    return game.phase === 'playing' && game.turn === owner && game.hintExpiresAt === null;
}

export function canUseHint(game) {
    return canPlay(game, game.settings.side) && game.hintsLeft > 0;
}

export function getVisibleColor(stone, revealed) {
    return revealed ? stone.owner.toLowerCase() : stone.displayColor;
}

export function getGameStatus(game, aiThinking = false) {
    if (game.phase === 'setup') return 'setup';
    if (game.phase === 'finished') {
        if (game.result.winner === null) return 'draw';
        return game.result.winner === game.settings.side ? 'win' : 'loss';
    }
    if (game.hintExpiresAt !== null) return 'hint';
    if (game.turn === game.settings.side) return 'player';
    return aiThinking ? 'thinking' : 'ai';
}

function playStone(game, { row, col, owner }) {
    if (!canPlay(game, owner) || !isEmptyCell(game.board, row, col)) return game;
    const index = cellIndex(row, col);

    const displayColor = owner === game.settings.side
        ? game.selectedColor
        : (game.moves.at(-1)?.displayColor ?? 'black');
    const stone = { row, col, owner, displayColor };
    const board = game.board.slice();
    board[index] = stone;
    const moves = [...game.moves, stone];
    const winningLines = getWinningLines(board, row, col);
    const result = winningLines.length || moves.length === cellCount
        ? { winner: winningLines.length ? owner : null, winningLines }
        : null;

    return {
        ...game,
        board,
        moves,
        turn: result ? null : otherSide(owner),
        phase: result ? 'finished' : 'playing',
        result,
    };
}

function toggleColor(game, colorId) {
    const { colorIds } = game.settings;
    if (game.phase !== 'setup' || REQUIRED_COLOR_IDS.includes(colorId) ||
        !STONE_COLORS.some(({ id }) => id === colorId)) return game;

    if (colorIds.includes(colorId)) {
        return {
            ...game,
            settings: { ...game.settings, colorIds: colorIds.filter((id) => id !== colorId) },
        };
    }
    if (colorIds.length >= COLOR_LIMIT) return game;
    return { ...game, settings: { ...game.settings, colorIds: [...colorIds, colorId] } };
}

// Receives the current time as an action value, so replaying actions produces the same state.
export function omokReducer(game, action) {
    switch (action.type) {
        case 'setSide':
            if (game.phase !== 'setup' || ![BLACK, WHITE].includes(action.side)) return game;
            return {
                ...game,
                settings: { ...game.settings, side: action.side },
                selectedColor: action.side.toLowerCase(),
            };
        case 'setDifficulty':
            if (game.phase !== 'setup' || !DIFFICULTIES.some(({ id }) => id === action.difficulty)) return game;
            return { ...game, settings: { ...game.settings, difficulty: action.difficulty } };
        case 'toggleColor':
            return toggleColor(game, action.colorId);
        case 'start':
            return game.phase === 'setup' ? { ...game, phase: 'playing' } : game;
        case 'reset':
            return createOmokGame(game.settings);
        case 'selectColor':
            if (game.phase !== 'playing' || !game.settings.colorIds.includes(action.colorId)) return game;
            return { ...game, selectedColor: action.colorId };
        case 'play':
            return playStone(game, action);
        case 'playAi':
            if (action.expectedBoard !== game.board) return game;
            return playStone(game, { row: action.row, col: action.col, owner: otherSide(game.settings.side) });
        case 'useHint':
            if (!canUseHint(game)) return game;
            return { ...game, hintsLeft: game.hintsLeft - 1, hintExpiresAt: action.now + HINT_DURATION };
        case 'expireHint':
            if (game.hintExpiresAt === null || action.now < game.hintExpiresAt) return game;
            return { ...game, hintExpiresAt: null };
        default:
            return game;
    }
}
