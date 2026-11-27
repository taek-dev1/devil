import {
    BOARD_SIZE, DIRECTIONS, cellIndex, countStones, isEmptyCell, isWinningLength, otherSide,
} from './omokGame.js';

export const AI_LEVELS = {
    easy: { depth: 1, candidates: 6, maxMs: 60, maxNodes: 80, patterns: 0, variety: 0.18 },
    medium: { depth: 2, candidates: 8, maxMs: 160, maxNodes: 400, patterns: 1, variety: 0.06, varietyLimit: 2 },
    hard: { depth: 4, candidates: 14, maxMs: 350, maxNodes: 1_600, patterns: 2, variety: 0 },
};

const mate = 1_000_000;
const budgetExceeded = Symbol('AI search budget exceeded');
const center = Math.floor(BOARD_SIZE / 2);
const cells = Array.from({ length: BOARD_SIZE ** 2 }, (_, index) => {
    const row = Math.floor(index / BOARD_SIZE);
    const col = index % BOARD_SIZE;
    const neighbors = [];
    for (let r = Math.max(0, row - 2); r <= Math.min(BOARD_SIZE - 1, row + 2); r++) {
        for (let c = Math.max(0, col - 2); c <= Math.min(BOARD_SIZE - 1, col + 2); c++) {
            if (r !== row || c !== col) neighbors.push(cellIndex(r, c));
        }
    }
    return { row, col, index, neighbors, centerScore: BOARD_SIZE - Math.abs(row - center) - Math.abs(col - center) };
});

// Indexed by run length and number of open ends.
const runScores = [[0, 0, 0], [0, 1, 3], [0, 5, 18], [0, 28, 220], [0, 280, 3_200]];
const gapScores = [0, 0, 0, 55, 340, 420];

function inspectMove(board, { row, col }, owner, patterns) {
    let score = 0;
    let threats = 0;
    for (const [dr, dc] of DIRECTIONS) {
        const before = countStones(board, row - dr, col - dc, -dr, -dc, owner);
        const after = countStones(board, row + dr, col + dc, dr, dc, owner);
        const length = before + 1 + after;
        if (isWinningLength(length)) return { wins: true, score: 0 };
        if (length > 6) continue;

        const startRow = row - (before + 1) * dr;
        const startCol = col - (before + 1) * dc;
        const endRow = row + (after + 1) * dr;
        const endCol = col + (after + 1) * dc;
        const startOpen = isEmptyCell(board, startRow, startCol);
        const endOpen = isEmptyCell(board, endRow, endCol);
        const checkGap = patterns >= 1 || length === 4;
        const beforeGap = startOpen && checkGap ? countStones(board, startRow - dr, startCol - dc, -dr, -dc, owner) : 0;
        const afterGap = endOpen && checkGap ? countStones(board, endRow + dr, endCol + dc, dr, dc, owner) : 0;
        const openEnds = Number(startOpen && length + beforeGap < 6) + Number(endOpen && length + afterGap < 6);
        let lineScore = runScores[length][openEnds];
        if (patterns >= 1) {
            // The gap itself adds another stone, so a total above five would overline.
            if (beforeGap) lineScore = Math.max(lineScore, gapScores[length + beforeGap] ?? 0);
            if (afterGap) lineScore = Math.max(lineScore, gapScores[length + afterGap] ?? 0);
        }
        score += lineScore;
        if (lineScore >= 220) threats++;
    }
    if (patterns >= 2 && threats >= 2) score += 500 * (threats - 1);
    return { wins: false, score };
}

function assessPosition(board, nearby, owner, config) {
    const opponent = otherSide(owner);
    const candidates = [];
    const blocks = [];
    let attack = 0;
    let defense = 0;
    for (const cell of cells) {
        if (board[cell.index] || nearby[cell.index] === 0) continue;
        const own = inspectMove(board, cell, owner, config.patterns);
        if (own.wins) return { win: cell };
        const opposing = inspectMove(board, cell, opponent, config.patterns);
        if (opposing.wins) blocks.push(cell);
        attack = Math.max(attack, own.score);
        defense = Math.max(defense, opposing.score);
        candidates.push({ cell, order: own.score + opposing.score * 0.95 + cell.centerScore * 0.25 });
    }
    return { candidates, blocks, evaluation: attack - defense };
}

function applyMove(board, nearby, cell, owner) {
    board[cell.index] = { owner };
    for (const neighbor of cell.neighbors) nearby[neighbor]++;
}

function undoMove(board, nearby, cell) {
    board[cell.index] = null;
    for (const neighbor of cell.neighbors) nearby[neighbor]--;
}

function orderMoves(position, limit) {
    if (position.blocks.length) return position.blocks;
    return position.candidates
        .sort((a, b) => b.order - a.order)
        .slice(0, limit)
        .map(({ cell }) => cell);
}

function negamax(search, owner, depth, alpha, beta, ply) {
    const { board, nearby, config } = search;
    if (search.nodes >= config.maxNodes || search.now() >= search.deadline) throw budgetExceeded;
    search.nodes++;

    const position = assessPosition(board, nearby, owner, config);
    if (position.win) return mate - ply;
    if (!position.candidates.length) return 0;
    // With two distinct winning points, one defensive stone cannot cover both.
    if (position.blocks.length > 1) return -mate + ply + 1;
    if (depth === 0) return position.blocks.length ? -4_000 : position.evaluation;

    let best = -Infinity;
    for (const cell of orderMoves(position, config.candidates)) {
        applyMove(board, nearby, cell, owner);
        const score = -negamax(search, otherSide(owner), depth - 1, -beta, -alpha, ply + 1);
        undoMove(board, nearby, cell);
        best = Math.max(best, score);
        alpha = Math.max(alpha, best);
        if (alpha >= beta) break;
    }
    return best;
}

function searchRoot(search, owner, candidates, depth) {
    const { board, nearby, config } = search;
    const results = [];
    let alpha = -Infinity;
    for (const cell of candidates) {
        applyMove(board, nearby, cell, owner);
        const score = -negamax(search, otherSide(owner), depth - 1, -Infinity, config.variety ? Infinity : -alpha, 1);
        undoMove(board, nearby, cell);
        results.push({ cell, score });
        alpha = Math.max(alpha, score);
    }
    return results.sort((a, b) => b.score - a.score);
}

export function findAiMove(board, owner, difficulty, { now = () => performance.now(), random = Math.random } = {}) {
    const config = AI_LEVELS[difficulty];
    const search = { board: board.slice(), nearby: new Uint8Array(board.length), config, now, deadline: now() + config.maxMs, nodes: 0 };
    let depth = 0;
    function result(cell) {
        return { move: cell ? { row: cell.row, col: cell.col } : null, depth, nodes: search.nodes };
    }

    if (board.every((cell) => cell === null)) return result(cells[cellIndex(center, center)]);
    for (const cell of cells) {
        if (board[cell.index]) applyMove(search.board, search.nearby, cell, board[cell.index].owner);
    }

    const root = assessPosition(search.board, search.nearby, owner, config);
    if (root.win) return result(root.win);
    const candidates = orderMoves(root, config.candidates);
    if (root.blocks.length === 1 || candidates.length < 2) return result(candidates[0]);

    let best = candidates[0];
    let completedResults;
    for (let nextDepth = 1; nextDepth <= config.depth; nextDepth++) {
        try {
            completedResults = searchRoot(search, owner, candidates, nextDepth);
            depth = nextDepth;
            best = completedResults[0].cell;
            if (Math.abs(completedResults[0].score) >= mate - BOARD_SIZE ** 2) break;
            // Search the previous iteration's best move first to improve pruning.
            candidates.splice(candidates.indexOf(best), 1);
            candidates.unshift(best);
        } catch (error) {
            if (error !== budgetExceeded) throw error;
            break; // Use the best move from the last fully completed iteration.
        }
    }
    if (config.variety && root.blocks.length === 0 && completedResults) {
        const bestScore = completedResults[0].score;
        if (Math.abs(bestScore) < mate - BOARD_SIZE ** 2) {
            // Only vary among comparably scored ordinary moves in the completed search.
            const tolerance = Math.max(8, Math.abs(bestScore) * config.variety);
            const choices = completedResults
                .filter(({ score }) => bestScore - score <= tolerance)
                .slice(0, config.varietyLimit ?? 3);
            best = choices[Math.floor(random() * choices.length)].cell;
        }
    }
    return result(best);
}
