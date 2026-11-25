const sides = [
    { id: 'black', name: '흑 (선공)' },
    { id: 'white', name: '백 (후공)' },
];

const difficulties = [
    { id: 'easy', name: '하' },
    { id: 'medium', name: '중' },
    { id: 'hard', name: '상' },
];

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

export function GameSettings({ settings, colors, requiredColors, colorLimit, locked, onChange,  onToggleColor }) {
    const selectedCount = requiredColors.length + settings.extraColors.length;

    return (
        <section className="omok-panel" aria-labelledby="omok-settings-title">
            <h3 id="omok-settings-title">게임 설정</h3>
            <fieldset disabled={locked} aria-labelledby="omok-settings-title">
                <ChoiceGroup label="내 돌" choices={sides} value={settings.side} onChange={(side) => onChange('side', side)} />
                <ChoiceGroup label="AI 난이도" choices={difficulties} value={settings.difficulty} onChange={(difficulty) => onChange('difficulty', difficulty)} />
                <div className="omok-choice-row">
                    <span id="omok-palette-label">사용 색상</span>
                    <span className="omok-color-count" aria-live="polite">{selectedCount} / {colorLimit}개</span>
                </div>
                <div className="omok-colors" role="group" aria-labelledby="omok-palette-label" aria-describedby="omok-palette-note">
                    {colors.map((color) => {
                        const required = requiredColors.includes(color);
                        const selected = required || settings.extraColors.includes(color.id);
                        return (
                            <button
                                key={color.id}
                                type="button"
                                className="omok-color"
                                aria-label={required ? `${color.name} (필수)` : color.name}
                                aria-pressed={selected}
                                disabled={required || (!selected && selectedCount >= colorLimit)}
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
                {locked ? '새 게임을 선택하면 설정을 변경할 수 있습니다.' : '검정과 흰색은 필수이며, 최대 7개를 사용할 수 있습니다.'}
            </p>
        </section>
    );
}

export function GameStatus({ side, started }) {
    const isBlack = side === 'black';

    return (
        <section className="omok-panel" aria-labelledby="omok-status-title">
            <h3 id="omok-status-title">현재 게임 정보</h3>
            <dl className="omok-status">
                <div><dt>내 돌</dt><dd>{isBlack ? '흑 (선공)' : '백 (후공)'}</dd></div>
                <div><dt>AI 돌</dt><dd>{isBlack ? '백 (후공)' : '흑 (선공)'}</dd></div>
                <div><dt>현재 턴</dt><dd>대기</dd></div>
                <div><dt>착수 색상</dt><dd>선택 대기</dd></div>
                <div><dt>남은 힌트</dt><dd>2회 (예정)</dd></div>
                <div><dt>진행 상태</dt><dd role="status">{started ? '설정 완료' : '설정 대기'}</dd></div>
            </dl>
        </section>
    );
}

export function GameControls({ palette, started, onStart, onReset }) {
    return (
        <section className="omok-panel" aria-labelledby="omok-controls-title">
            <h3 id="omok-controls-title">게임 조작</h3>
            <p id="omok-controls-note" className="omok-note">착수, 힌트, AI 대전은 준비 중입니다.</p>
            <div className="omok-colors" role="group" aria-label="착수 색상" aria-describedby="omok-controls-note">
                {palette.map((color) => (
                    <button key={color.id} type="button" className="omok-color" disabled>
                        <Swatch color={color} />
                        <span>{color.name}</span>
                    </button>
                ))}
            </div>
            <button className="omok-hint" type="button" disabled>힌트 5초</button>
            <p className="omok-note">게임 시작을 누르면 설정이 확정되고 빈 판이 표시됩니다.</p>
            <div className="omok-actions">
                <button className="omok-primary" type="button" onClick={onStart} disabled={started}>게임 시작</button>
                <button type="button" onClick={onReset} disabled={!started}>새 게임</button>
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
                <li>표시 색으로 돌을 숨기며, AI는 내가 직전에 둔 돌의 색을 따라갑니다.</li>
                <li>힌트는 한 판에 두 번, 실제 흑백을 5초간 공개합니다.</li>
            </ul>
        </section>
    );
}
