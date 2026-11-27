import { useId } from 'react';

const colorModes = [
    { id: 'actual', label: '실제 흑백' },
    { id: 'blind', label: '블라인드 색상' },
];

export default function OmokReview({ moveNumber, moveCount, colorMode, onSeek, onColorModeChange }) {
    const titleId = useId();
    const atStart = moveNumber === 0;
    const atEnd = moveNumber === moveCount;

    return (
        <section className="omok-review" aria-labelledby={titleId}>
            <div className="omok-review-header">
                <h3 id={titleId}>게임 복기</h3>
                <span className="omok-review-count" role="status">{moveNumber}수 / {moveCount}수</span>
            </div>
            <div className="omok-review-colors" role="group" aria-label="복기 돌 색상">
                {colorModes.map(({ id, label }) => (
                    <button key={id} type="button" aria-pressed={colorMode === id} onClick={() => onColorModeChange(id)}>
                        {label}
                    </button>
                ))}
            </div>
            <input
                className="omok-review-slider"
                type="range"
                min={0}
                max={moveCount}
                value={moveNumber}
                onChange={(event) => onSeek(event.currentTarget.valueAsNumber)}
                aria-label="복기 착수 시점"
                aria-valuetext={`${moveCount}수 중 ${moveNumber}수`}
            />
            <div className="omok-review-navigation" role="group" aria-label="복기 착수 이동">
                <button type="button" disabled={atStart} onClick={() => onSeek(0)}>처음</button>
                <button type="button" disabled={atStart} onClick={() => onSeek(moveNumber - 1)}>이전</button>
                <button type="button" disabled={atEnd} onClick={() => onSeek(moveNumber + 1)}>다음</button>
                <button type="button" disabled={atEnd} onClick={() => onSeek(moveCount)}>마지막</button>
            </div>
        </section>
    );
}
