
import { Link } from 'react-router';
import { gamePath } from '../data/playModes';
import GameArtwork from './GameArtwork';
import GameModeLinks from './GameModeLinks';

function GameCard({ game }) {
    return (
        <article className="game-card">
            <GameArtwork game={game} />

            <div className="game-card-content">
                <span className="game-badge">{game.category}</span>

                <h3>
                    <Link className="game-card-title" to={gamePath(game.id)}>
                        {game.title}
                    </Link>
                </h3>
                <p>{game.description}</p>
            </div>

            <GameModeLinks gameId={game.id} />
        </article>
    );
}

export default GameCard;
