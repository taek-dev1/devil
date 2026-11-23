
import { useState } from 'react';
import './App.css';
import Header from './components/Header';
import GameCard from './components/GameCard';
import { games } from './data/games';

function App() {
    // 검색어 상태
    const [searchTerm, setSearchTerm] = useState('');

    // 선택한 카테고리 상태
    const [selectedCategory, setSelectedCategory] = useState('전체');

    // 게임 데이터에서 카테고리 목록 자동 생성
    const categories = [
        '전체',
        ...new Set(games.map((game) => game.category)),
    ];

    // 검색어와 선택한 카테고리에 맞는 게임 추출
    const filteredGames = games.filter((game) => {
        const keyword = searchTerm.trim().toLowerCase();

        const matchesSearch =
            game.title.toLowerCase().includes(keyword) ||
            game.description.toLowerCase().includes(keyword);

        const matchesCategory =
            selectedCategory === '전체' ||
            game.category === selectedCategory;

        return matchesSearch && matchesCategory;
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
                    onChange={(e ) => setSearchTerm(e.target.value)}
                />

                {/* 카테고리 필터 버튼 */}
                <div
                    className="category-filters"
                    role="group"
                    aria-label="게임 카테고리"
                >
                    {categories.map((category) => (
                        <button
                            key={category}
                            type="button"
                            className={`category-filter ${
                                selectedCategory === category ? 'active' : ''
                            }`}
                            aria-pressed={selectedCategory === category}
                            onClick={() => setSelectedCategory(category)}
                        >
                            {category}
                        </button>
                    ))}
                </div>

                {/* 필터링된 게임 목록 */}
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
