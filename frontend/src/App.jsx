
import './App.css';
import Header from './components/Header';
import GameCard from './components/GameCard';
import { games } from './data/games';

function App() {
    return (
        <>
            <Header />

            <main className="page-content">
                <h2>게임 목록</h2>
                <p>게임을 선택해 주세요.</p>

                <div className="game-grid">
                    {games.map((game) => (
                        <GameCard key={game.id} game={game} />
                    ))}
                </div>
            </main>
        </>
    );
}

export default App;
