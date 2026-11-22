
import { useState } from 'react';
import './App.css';
import Header from './components/Header';
import GameCard from './components/GameCard';
import { games } from './data/games';

function App() {
    // 검색어 상태 관리
    const [searchTerm, setSearchTerm] = useState('');

    // 검색어에 맞는 게임만 추출
    const filteredGames = games.filter((game) => {
        const keyword = searchTerm.trim().toLowerCase();

        return (
            game.title.toLowerCase().includes(keyword) ||
            game.description.toLowerCase().includes(keyword)
        );
    });

    return (
        <>
            <Header />

            <main className="page-content">
                <h2>게임 목록</h2>
                <p>게임을 선택해 주세요.</p>

                {/* 게임 검색창 */}
                <input
                    className="game-search"
                    type="text"
                    placeholder="게임 이름을 검색하세요..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                {/* 검색 결과에 맞는 게임 목록 */}
                <div className="game-grid">
                    {filteredGames.map((game) => (
                        <GameCard key={game.id} game={game} />
                    ))}
                </div>

                {/* 검색 결과가 없을 때 */}
                {filteredGames.length === 0 && (
                    <p>검색 결과가 없습니다.</p>
                )}
            </main>
        </>
    );
}

export default App;
