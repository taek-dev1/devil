function GameCard({ title, description }) {
    return (
        <div className="game-card">
            <h3>{title}</h3>
            <p>{description}</p>
        </div>
    );
}

export default GameCard;