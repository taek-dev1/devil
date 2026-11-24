import { Gamepad2 } from 'lucide-react';

function GameArtwork({ game, className = 'game-card-media', size = 48 }) {
    const GameIcon = game.icon || Gamepad2;

    return (
        <div className={className}>
            {game.image ? (
                <img src={game.image} alt={`${game.title} 대표 이미지`} />
            ) : (
                <GameIcon size={size} strokeWidth={1.5} aria-hidden="true" />
            )}
        </div>
    );
}

export default GameArtwork;
