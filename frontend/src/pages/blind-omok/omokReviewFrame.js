export function getReviewFrame(moves, winningLines, {
    moveNumber = moves.length,
    colorMode = 'actual',
} = {}) {
    const moveCount = moves.length;
    const current = Math.max(0, Math.min(moveNumber, moveCount));
    return {
        moveNumber: current,
        moveCount,
        colorMode,
        moves: moves.slice(0, current),
        revealed: colorMode === 'actual',
        winningLines: current === moveCount ? winningLines : [],
    };
}
