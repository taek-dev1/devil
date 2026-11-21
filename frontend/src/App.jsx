
import './App.css';
import Header from './components/Header';
import GameCard from './components/GameCard';

function App() {
  return (
      <>
        <Header />

        <main>
          <h2>게임 목록</h2>
          <p>게임을 선택해 주세요.</p>

          <div className="game-grid">
          <GameCard
              title="블라인드 오목"
              description="상대방의 돌이 보이지 않는 전략 오목 게임"
          />

          <GameCard
              title="숫자 게임"
              description="숫자를 활용한 심리 전략 게임"
          />
          </div>
        </main>
      </>
  );
}

export default App;
