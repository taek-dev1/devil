import { useEffect, useReducer } from 'react';
import OmokBoard from './OmokBoard';
import { GameSettings, GameStatus, GameControls, GameRules } from './OmokPanels';
import { STONE_COLORS } from './omokColors';
import { BOARD_SIZE, canPlay, canUseHint, createOmokGame, getGameStatus, omokReducer } from './omokGame';
import './BlindOmokPage.css';

const boardNotes = {
    setup: '보드 미리보기 · 예시 돌이 표시됩니다.',
    player: '빈 교차점을 클릭하거나 터치해 돌을 놓으세요.',
    hint: '실제 흑백을 공개하는 동안 착수를 멈춥니다.',
    win: '게임 종료 · 모든 돌의 실제 흑백을 공개했습니다.',
    loss: '게임 종료 · 모든 돌의 실제 흑백을 공개했습니다.',
    draw: '게임 종료 · 모든 돌의 실제 흑백을 공개했습니다.',
};

export default function BlindOmokPage({ title, modeTitle }) {
    const [game, dispatch] = useReducer(omokReducer, undefined, createOmokGame);
    const { settings, phase, selectedColor, hintsLeft, hintExpiresAt } = game;
    const palette = STONE_COLORS.filter(({ id }) => settings.colorIds.includes(id));
    const status = getGameStatus(game);
    const canPlace = canPlay(game, settings.side);

    useEffect(() => {
        if (hintExpiresAt === null) return;

        let timer;
        function expireHint() {
            const now = performance.now();
            const remaining = hintExpiresAt - now;
            if (remaining > 0) {
                timer = window.setTimeout(expireHint, Math.ceil(remaining));
            } else {
                dispatch({ type: 'expireHint', now });
            }
        }
        expireHint();
        return () => window.clearTimeout(timer);
    }, [hintExpiresAt]);

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
                        <span>{BOARD_SIZE} × {BOARD_SIZE}</span>
                    </div>
                    <figure>
                        <OmokBoard
                            game={game}
                            canPlace={canPlace}
                            onPlay={(row, col) => dispatch({ type: 'play', row, col, owner: settings.side })}
                        />
                        {boardNotes[status] && <figcaption>{boardNotes[status]}</figcaption>}
                    </figure>
                </section>
                <div className="omok-panels">
                    <GameSettings
                        settings={settings}
                        locked={phase !== 'setup'}
                        onSideChange={(side) => dispatch({ type: 'setSide', side })}
                        onDifficultyChange={(difficulty) => dispatch({ type: 'setDifficulty', difficulty })}
                        onToggleColor={(colorId) => dispatch({ type: 'toggleColor', colorId })}
                    />
                    <GameStatus side={settings.side} status={status} />
                    <GameControls
                        palette={palette}
                        phase={phase}
                        selectedColor={selectedColor}
                        hintsLeft={hintsLeft}
                        canHint={canUseHint(game)}
                        onColorChange={(colorId) => dispatch({ type: 'selectColor', colorId })}
                        onHint={() => dispatch({ type: 'useHint', now: performance.now() })}
                        onStart={() => dispatch({ type: 'start' })}
                        onReset={() => dispatch({ type: 'reset' })}
                    />
                    <GameRules />
                </div>
            </div>
        </div>
    );
}
