import { useId } from 'react';

const size = 15;
const step = 36;
const padding = 34;
const edge = padding + (size - 1) * step;
const viewSize = edge + padding;
const intersections = Array.from({ length: size }, (_, index) => padding + index * step);
const starPoints = [[3, 3], [3, 11], [7, 7], [11, 3], [11, 11]];

const previewStones = [
    { row: 6, col: 8, tone: 'white' },
    { row: 7, col: 6, tone: 'white' },
    { row: 7, col: 7, tone: 'black' },
    { row: 8, col: 7, tone: 'black' },
    { row: 8, col: 8, tone: 'blue' },
];

export default function OmokBoard({ preview }) {
    const id = useId();

    return (
        <svg className="omok-board" viewBox={`0 0 ${viewSize} ${viewSize}`} role="img" aria-labelledby={`${id}-title`}>
            <title id={`${id}-title`}>{preview ? '예시 돌이 놓인 15×15 오목판' : '빈 15×15 오목판'}</title>
            <defs>
                <linearGradient id={`${id}-wood`} x2="100%" y2="100%">
                    <stop stopColor="#f4d093" />
                    <stop offset="1" stopColor="#c88d50" />
                </linearGradient>
                <pattern id={`${id}-grain`} width="210" height="83" patternUnits="userSpaceOnUse">
                    <path d="M-35 13Q55 21 125 12T245 13 M-35 37Q35 31 117 38T245 37 M-35 64Q40 73 112 63T245 64" fill="none" stroke="#7f4a23" strokeOpacity=".13" />
                </pattern>
                <radialGradient id={`${id}-black`} cx="34%" cy="27%" r="72%">
                    <stop stopColor="#626975" />
                    <stop offset="1" stopColor="#12151c" />
                </radialGradient>
                <radialGradient id={`${id}-white`} cx="34%" cy="27%" r="72%">
                    <stop stopColor="#fff" />
                    <stop offset="1" stopColor="#c4cad4" />
                </radialGradient>
                <radialGradient id={`${id}-blue`} cx="34%" cy="27%" r="72%">
                    <stop stopColor="#84c2ff" />
                    <stop offset="1" stopColor="#2961bf" />
                </radialGradient>
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
            {preview && previewStones.map(({ row, col, tone }) => (
                <g key={`${row}-${col}`} transform={`translate(${intersections[col]} ${intersections[row]})`}>
                    <ellipse cy="4" rx="15.5" ry="14.5" fill="#41270e" opacity=".32" />
                    <circle r="15.5" fill={`url(#${id}-${tone})`} />
                </g>
            ))}
        </svg>
    );
}
