import { COLOR_LIMIT, REQUIRED_COLOR_IDS, STONE_COLORS } from './omokColors';
import { BLACK, DIFFICULTIES, WHITE, otherSide } from './omokGame';

const sides = [
    { id: BLACK, name: '흑 (선공)' },
    { id: WHITE, name: '백 (후공)' },
];

const statusLabels = {
    setup: '게임 시작 전',
    player: '내 차례',
    ai: 'AI 차례',
    thinking: 'AI가 생각 중',
    hint: '힌트 공개 중',
    win: '승리',
    loss: '패배',
    draw: '무승부',
};

function ChoiceGroup({ label, choices, value, onChange }) {
    return (
        <div className="omok-choice-row">
            <span>{label}</span>
            <div className="omok-choices" role="group" aria-label={label}>
                {choices.map(({ id, name }) => (
                    <button key={id} type="button" aria-pressed={value === id} onClick={() => onChange(id)}>
                        {name}
                    </button>
                ))}
            </div>
        </div>
    );
}

function Swatch({ color }) {
    return <span className="omok-swatch" style={{ '--omok-color': color.fill }} aria-hidden="true" />;
}

export function GameSettings({ settings, locked, onSideChange, onDifficultyChange, onToggleColor }) {
    const selectedCount = settings.colorIds.length;

    const fields = (
        <>
            <fieldset disabled={locked} aria-labelledby="omok-settings-title">
                <ChoiceGroup label="내 돌" choices={sides} value={settings.side} onChange={onSideChange} />
                <ChoiceGroup label="AI 난이도" choices={DIFFICULTIES} value={settings.difficulty} onChange={onDifficultyChange} />
                <div className="omok-choice-row">
                    <span id="omok-palette-label">사용 색상</span>
                    <span className="omok-color-count" aria-live="polite">{selectedCount} / {COLOR_LIMIT}개</span>
                </div>
                <div className="omok-colors" role="group" aria-labelledby="omok-palette-label" aria-describedby="omok-palette-note">
                    {STONE_COLORS.map((color) => {
                        const required = REQUIRED_COLOR_IDS.includes(color.id);
                        const selected = settings.colorIds.includes(color.id);
                        return (
                            <button
                                key={color.id}
                                type="button"
                                className="omok-color"
                                aria-label={required ? `${color.name} (필수)` : color.name}
                                aria-pressed={selected}
                                disabled={required || (!selected && selectedCount >= COLOR_LIMIT)}
                                onClick={() => onToggleColor(color.id)}
                            >
                                <Swatch color={color} />
                                <span>{color.name}</span>
                            </button>
                        );
                    })}
                </div>
            </fieldset>
            <p id="omok-palette-note" className="omok-note">
                {locked ? '새 게임을 선택하면 설정을 변경할 수 있습니다.' : `검정과 흰색은 필수이며, 최대 ${COLOR_LIMIT}개를 사용할 수 있습니다.`}
            </p>
        </>
    );

    if (locked) {
        const difficulty = DIFFICULTIES.find(({ id }) => id === settings.difficulty).name;
        return (
            <details className="omok-panel omok-settings" aria-labelledby="omok-settings-title">
                <summary>
                    <span id="omok-settings-title">게임 설정</span>
                    <span className="omok-settings-summary">
                        내 돌 {settings.side === BLACK ? '흑' : '백'} · AI 난이도 {difficulty} · 색상 {selectedCount}개
                    </span>
                </summary>
                {fields}
            </details>
        );
    }

    return (
        <section className="omok-panel" aria-labelledby="omok-settings-title">
            <h3 id="omok-settings-title">게임 설정</h3>
            {fields}
        </section>
    );
}

export function GameStatus({ side, status }) {
    return (
        <section className="omok-panel" aria-labelledby="omok-status-title">
            <h3 id="omok-status-title">현재 게임 정보</h3>
            <div className="omok-current-status" role="status">
                <strong>{statusLabels[status]}</strong>
                {status === 'ai' && <p className="omok-note">AI 착수는 3단계에서 연결됩니다.</p>}
            </div>
            <dl className="omok-status">
                <div><dt>내 돌</dt><dd>{sides.find(({ id }) => id === side).name}</dd></div>
                <div><dt>AI 돌</dt><dd>{sides.find(({ id }) => id === otherSide(side)).name}</dd></div>
            </dl>
        </section>
    );
}

export function GameControls({ palette, phase, selectedColor, hintsLeft, canHint, onColorChange, onHint, onStart, onReset }) {
    const inSetup = phase === 'setup';
    return (
        <section className="omok-panel" aria-labelledby="omok-controls-title">
            <h3 id="omok-controls-title">게임 조작</h3>
            <div className="omok-colors" role="group" aria-label="착수 색상">
                {palette.map((color) => (
                    <button
                        key={color.id}
                        type="button"
                        className="omok-color"
                        disabled={phase !== 'playing'}
                        aria-pressed={!inSetup && color.id === selectedColor}
                        onClick={() => onColorChange(color.id)}
                    >
                        <Swatch color={color} />
                        <span>{color.name}</span>
                    </button>
                ))}
            </div>
            <div className="omok-hint-row">
                <button type="button" onClick={onHint} disabled={!canHint}>힌트 5초</button>
                <span className="omok-color-count">남은 힌트 {hintsLeft}회</span>
            </div>
            <div className="omok-actions">
                <button className="omok-primary" type="button" onClick={onStart} disabled={!inSetup}>게임 시작</button>
                <button type="button" onClick={onReset} disabled={inSetup}>새 게임</button>
            </div>
        </section>
    );
}

export function GameRules() {
    return (
        <section className="omok-panel" aria-labelledby="omok-rules-title">
            <h3 id="omok-rules-title">게임 규칙</h3>
            <ul className="omok-rules">
                <li>실제 흑백 기준으로 연속 5목 또는 6목을 만들면 승리합니다.</li>
                <li>7목 이상도 놓을 수 있습니다. 33·44 금수는 없습니다.</li>
                <li>착수할 때 고른 색으로 돌의 실제 흑백을 숨깁니다.</li>
                <li>힌트는 한 판에 두 번, 실제 흑백을 5초간 공개합니다.</li>
            </ul>
        </section>
    );
}
