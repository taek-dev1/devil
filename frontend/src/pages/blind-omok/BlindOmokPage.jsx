import { useEffect, useReducer, useState } from 'react';
import OmokBoard from './OmokBoard';
import OmokReview from './OmokReview.jsx';
import { GameSettings, GameStatus, GameControls, GameRules } from './OmokPanels';
import { STONE_COLORS } from './omokColors';
import { BOARD_SIZE, HINT_DURATION, canPlay, canUseHint, createDefaultAiGame, getGameStatus, omokReducer } from './omokGame';
import { scheduleHintCountdown } from './omokHintTimer';
import { getReviewFrame } from './omokReviewFrame.js';
import { useOmokAi } from './useOmokAi';
import './BlindOmokPage.css';

const boardNotes = {
    setup: '보드 미리보기 · 예시 돌이 표시됩니다.',
    playing: '내 차례에 빈 교차점을 클릭하거나 터치해 돌을 놓으세요.',
    hint: '실제 흑백을 공개하는 동안 착수를 멈춥니다.',
    finished: '게임 종료',
};

export default function BlindOmokPage({ title, modeTitle }) {
    const [game, dispatch] = useReducer(omokReducer, undefined, createDefaultAiGame);
    const [countdown, setCountdown] = useState(null);
    const [review, setReview] = useState(undefined);
    const { settings, phase, selectedColor, hintsLeft, hintExpiresAt } = game;
    const palette = STONE_COLORS.filter(({ id }) => settings.colorIds.includes(id));
    const ai = useOmokAi(game, dispatch);
    const status = getGameStatus(game, ai.thinking);
    const placement = canPlay(game, settings.side) ? {
        board: game.board,
        tone: selectedColor,
        onPlay: (row, col) => dispatch({ type: 'play', row, col, owner: settings.side }),
    } : null;
    const reviewFrame = phase === 'finished'
        ? getReviewFrame(game.moves, game.result.winningLines, review)
        : null;
    const boardNote = hintExpiresAt !== null ? 'hint' : phase;
    const hintSeconds = hintExpiresAt === null ? null
        : countdown?.expiresAt === hintExpiresAt ? countdown.seconds : HINT_DURATION / 1000;

    useEffect(() => {
        if (hintExpiresAt === null) return;

        return scheduleHintCountdown(
            hintExpiresAt,
            (seconds) => setCountdown({ expiresAt: hintExpiresAt, seconds }),
            (now) => dispatch({ type: 'expireHint', now }),
        );
    }, [hintExpiresAt]);

    function resetGame() {
        setReview(undefined);
        dispatch({ type: 'reset' });
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
                        <span>{BOARD_SIZE} × {BOARD_SIZE}</span>
                    </div>
                    <figure>
                        <OmokBoard
                            moves={reviewFrame?.moves ?? game.moves}
                            preview={phase === 'setup'}
                            revealed={reviewFrame?.revealed ?? (hintExpiresAt !== null)}
                            winningLines={reviewFrame?.winningLines}
                            placement={placement}
                        />
                        <figcaption>
                            {Object.entries(boardNotes).map(([state, note]) => (
                                <span key={state} aria-hidden={state !== boardNote}>{note}</span>
                            ))}
                        </figcaption>
                    </figure>
                    {reviewFrame && (
                        <OmokReview
                            moveNumber={reviewFrame.moveNumber}
                            moveCount={reviewFrame.moveCount}
                            colorMode={reviewFrame.colorMode}
                            onSeek={(moveNumber) => setReview((current) => ({ ...current, moveNumber }))}
                            onColorModeChange={(colorMode) => setReview((current) => ({ ...current, colorMode }))}
                        />
                    )}
                </section>
                <div className="omok-panels">
                    <GameSettings
                        settings={settings}
                        locked={phase !== 'setup'}
                        onSideChange={(side) => dispatch({ type: 'setSide', side })}
                        onDifficultyChange={(difficulty) => dispatch({ type: 'setDifficulty', difficulty })}
                        onToggleColor={(colorId) => dispatch({ type: 'toggleColor', colorId })}
                    />
                    <GameStatus side={settings.side} status={status} hintSeconds={hintSeconds} aiFailed={ai.failed} onRetry={ai.retry} />
                    <GameControls
                        palette={palette}
                        phase={phase}
                        selectedColor={selectedColor}
                        hintsLeft={hintsLeft}
                        canHint={canUseHint(game)}
                        onColorChange={(colorId) => dispatch({ type: 'selectColor', colorId })}
                        onHint={() => dispatch({ type: 'useHint', now: performance.now() })}
                        onStart={() => dispatch({ type: 'start' })}
                        onReset={resetGame}
                    />
                    <GameRules />
                </div>
            </div>
        </div>
    );
}
