import { Link } from 'react-router';
import { gamePath, playModes } from '../data/playModes';

function GameModeLinks({ gameId }) {
    return (
        <div className="game-card-buttons">
            {playModes.map(({ id, path, label, Icon }) => (
                <Link
                    key={id}
                    className={`game-button game-button--${id}`}
                    to={`${gamePath(gameId)}/${path}`}
                >
                    <Icon size={18} aria-hidden="true" />
                    <span>{label}</span>
                </Link>
            ))}
        </div>
    );
}

export default GameModeLinks;
