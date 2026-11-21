
import { Bot, Users, Gamepad2 } from 'lucide-react';

// 모든 게임에서 사용하는 대전 방식
const playModes = [
    {
        id: 'ai',
        label: 'AI와 하기',
        Icon: Bot,
    },
    {
        id: 'player',
        label: '사람과 하기',
        Icon: Users,
    },
];

function GameCard({ game }) {
    const GameIcon = game.icon || Gamepad2;

    function handlePlay(mode) {
        const modeName = mode === 'ai' ? 'AI 대전' : '사람 대전';
        alert(`${game.title} ${modeName}은 준비 중입니다.`);
    }

    return (
        <article className="game-card">

            <div className="game-card-media">
                {game.image ? (
                    <img src={game.image} alt={`${game.title} 대표 이미지`} />
                ) : (
                    <GameIcon size={48} strokeWidth={1.5} aria-hidden="true" />
                )}
            </div>

            <div className="game-card-content">
                <span className="game-badge">{game.category}</span>

                <h3>{game.title}</h3>
                <p>{game.description}</p>
            </div>

            <div className="game-card-buttons">
                {playModes.map(({ id, label, Icon }) => (
                    <button
                        key={id}
                        type="button"
                        className={`game-button game-button--${id}`}
                        onClick={() => handlePlay(id)}
                    >
                        <Icon size={18} aria-hidden="true" />
                        <span>{label}</span>
                    </button>
                ))}
            </div>

        </article>
    );
}

export default GameCard;
