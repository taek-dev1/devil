import { useState } from 'react';
import OmokBoard from './OmokBoard';
import { GameSettings, GameStatus, GameControls, GameRules } from './OmokPanels';
import './BlindOmokPage.css';

const colors = [
    { id: 'black', name: '검정', fill: '#252830' },
    { id: 'white', name: '흰색', fill: '#f8fafc' },
    { id: 'red', name: '빨강', fill: '#ef555c' },
    { id: 'orange', name: '주황', fill: '#f99142' },
    { id: 'yellow', name: '노랑', fill: '#f6d154' },
    { id: 'green', name: '초록', fill: '#56bc76' },
    { id: 'blue', name: '파랑', fill: '#528df5' },
    { id: 'navy', name: '남색', fill: '#354896' },
    { id: 'purple', name: '보라', fill: '#a678e3' },
];

const requiredColors = colors.slice(0, 2);
const colorLimit = 7;

export default function BlindOmokPage({ title, modeTitle }) {
    const [settings, setSettings] = useState({ side: 'black', difficulty: 'medium', extraColors: [] });
    const [started, setStarted] = useState(false);
    const palette = colors.filter(({ id }) => requiredColors.some((color) => color.id === id) || settings.extraColors.includes(id));

    function updateSetting(key, value) {
        setSettings((current) => ({ ...current, [key]: value }));
    }

    function toggleColor(id) {
        setSettings((current) => {
            const { extraColors } = current;
            if (extraColors.includes(id)) {
                return { ...current, extraColors: extraColors.filter((color) => color !== id) };
            }
            if (extraColors.length + requiredColors.length >= colorLimit) {
                return current;
            }
            return { ...current, extraColors: [...extraColors, id] };
        });
    }

    return (
        <div className="omok-page">
            <div className="omok-heading">
                <h2>{title}</h2>
                <span className="game-badge">{modeTitle}</span>
            </div>
            <div className="omok-layout">
                <section className="omok-board-card" aria-labelledby="omok-board-title">
                    <div className="omok-board-heading">
                        <h3 id="omok-board-title">오목판</h3>
                        <span>15 × 15</span>
                    </div>
                    <figure>
                        <OmokBoard preview={!started} />
                        <figcaption>{started ? '착수 기능은 준비 중입니다.' : '보드 미리보기 · 예시 돌이 표시됩니다.'}</figcaption>
                    </figure>
                </section>
                <div className="omok-panels">
                    <GameSettings
                        settings={settings}
                        colors={colors}
                        requiredColors={requiredColors}
                        colorLimit={colorLimit}
                        locked={started}
                        onChange={updateSetting}
                        onToggleColor={toggleColor}
                    />
                    <GameStatus side={settings.side} started={started} />
                    <GameControls
                        palette={palette}
                        started={started}
                        onStart={() => setStarted(true)}
                        onReset={() => setStarted(false)}
                    />
                    <GameRules />
                </div>
            </div>
        </div>
    );
}
