import { useId, useState } from 'react';
import { STONE_COLORS } from './omokColors';
import { BOARD_SIZE, cellIndex, getVisibleColor } from './omokGame';

const step = 36;
const padding = 34;
const edge = padding + (BOARD_SIZE - 1) * step;
const viewSize = edge + padding;
const intersections = Array.from({ length: BOARD_SIZE }, (_, index) => padding + index * step);
const starPoints = [[3, 3], [3, 11], [7, 7], [11, 3], [11, 11]];

const previewStones = [
    { row: 6, col: 8, tone: 'white' },
    { row: 7, col: 6, tone: 'white' },
    { row: 7, col: 7, tone: 'black' },
    { row: 8, col: 7, tone: 'black' },
    { row: 8, col: 8, tone: 'blue' },
];

function Stone({ id, row, col, tone, ghost = false, latest = false }) {
    return (
        <g
            className={ghost ? 'omok-stone-preview' : 'omok-stone'}
            transform={`translate(${intersections[col]} ${intersections[row]})`}
            opacity={ghost ? 0.55 : 1}
        >
            <ellipse cy="4" rx="15.5" ry="14.5" fill="#41270e" opacity=".32" />
            <circle r="15.5" fill={`url(#${id}-${tone})`} />
            {latest && <circle className="omok-last-move" r="18" fill="none" stroke="#fff4b3" strokeWidth="2.5" />}
        </g>
    );
}

function BoardTargets({ id, board, tone, onPlay }) {
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const showPreview = hoveredIndex !== null && !board[hoveredIndex];

    return (
        <g onPointerLeave={() => setHoveredIndex(null)}>
            {showPreview && (
                <Stone
                    id={id}
                    row={Math.floor(hoveredIndex / BOARD_SIZE)}
                    col={hoveredIndex % BOARD_SIZE}
                    tone={tone}
                    ghost
                />
            )}
            {intersections.map((y, row) => intersections.map((x, col) => {
                const index = cellIndex(row, col);
                return (
                    <rect
                        key={index}
                        className="omok-board-target"
                        x={x - step / 2}
                        y={y - step / 2}
                        width={step}
                        height={step}
                        fill="transparent"
                        data-row={row}
                        data-col={col}
                        onPointerMove={(event) => {
                            if (event.pointerType === 'mouse') setHoveredIndex(index);
                        }}
                        onClick={() => onPlay(row, col)}
                    />
                );
            }))}
        </g>
    );
}

export default function OmokBoard({ game, canPlace, onPlay }) {
    const id = useId();
    const { board, moves, phase, hintExpiresAt, selectedColor, result } = game;
    const preview = phase === 'setup';
    const revealed = phase === 'finished' || hintExpiresAt !== null;
    const stones = preview ? previewStones : moves;

    return (
        <svg className="omok-board" viewBox={`0 0 ${viewSize} ${viewSize}`} role="img" aria-labelledby={`${id}-title`}>
            <title id={`${id}-title`}>{preview ? '예시 돌이 놓인 15×15 오목판' : '15×15 오목판'}</title>
            <defs>
                <linearGradient id={`${id}-wood`} x2="100%" y2="100%">
                    <stop stopColor="#f4d093" />
                    <stop offset="1" stopColor="#c88d50" />
                </linearGradient>
                <pattern id={`${id}-grain`} width="210" height="83" patternUnits="userSpaceOnUse">
                    <path d="M-35 13Q55 21 125 12T245 13 M-35 37Q35 31 117 38T245 37 M-35 64Q40 73 112 63T245 64" fill="none" stroke="#7f4a23" strokeOpacity=".13" />
                </pattern>
                {STONE_COLORS.map(({ id: tone, light, shadow }) => (
                    <radialGradient key={tone} id={`${id}-${tone}`} cx="34%" cy="27%" r="72%">
                        <stop stopColor={light} />
                        <stop offset="1" stopColor={shadow} />
                    </radialGradient>
                ))}
            </defs>
            <rect width={viewSize} height={viewSize} rx="13" fill={`url(#${id}-wood)`} />
            <rect width={viewSize} height={viewSize} rx="13" fill={`url(#${id}-grain)`} />
            <g stroke="#654322" strokeWidth="1.15">
                {intersections.map((point) => <line key={`h-${point}`} x1={padding} x2={edge} y1={point} y2={point} />)}
                {intersections.map((point) => <line key={`v-${point}`} x1={point} x2={point} y1={padding} y2={edge} />)}
                <rect x={padding} y={padding} width={edge - padding} height={edge - padding} fill="none" />
            </g>
            <g fill="#654322">
                {starPoints.map(([row, col]) => (
                    <circle key={`${row}-${col}`} cx={intersections[col]} cy={intersections[row]} r="4" />
                ))}
            </g>
            {stones.map((stone) => (
                <Stone
                    key={cellIndex(stone.row, stone.col)}
                    id={id}
                    row={stone.row}
                    col={stone.col}
                    tone={preview ? stone.tone : getVisibleColor(stone, revealed)}
                    latest={stone === moves.at(-1)}
                />
            ))}
            {result?.winningLines.map((line) => {
                const first = line[0];
                const last = line.at(-1);
                return (
                    <line
                        key={`${cellIndex(first.row, first.col)}-${cellIndex(last.row, last.col)}`}
                        x1={intersections[first.col]}
                        y1={intersections[first.row]}
                        x2={intersections[last.col]}
                        y2={intersections[last.row]}
                        stroke="#f9bc43"
                        strokeWidth="5"
                        strokeLinecap="round"
                    />
                );
            })}
            {canPlace && <BoardTargets id={id} board={board} tone={selectedColor} onPlay={onPlay} />}
        </svg>
    );
}
