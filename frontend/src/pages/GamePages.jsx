import { ArrowLeft } from 'lucide-react';
import { Link, Outlet, useOutletContext, useParams } from 'react-router';
import GameArtwork from '../components/GameArtwork';
import GameModeLinks from '../components/GameModeLinks';
import { games } from '../data/games';
import './GamePages.css';

function BackLink({ to, children }) {
    return (
        <Link className="game-back-link" to={to}>
            <ArrowLeft size={16} aria-hidden="true" />
            {children}
        </Link>
    );
}

function GameSteps({ items, placeholder }) {
    if (!items?.length) {
        return <p>{placeholder}</p>;
    }

    return (
        <ol>
            {items.map((item, index) => (
                <li key={index}>{item}</li>
            ))}
        </ol>
    );
}

export function GameRoute() {
    const { gameId } = useParams();
    const game = games.find(({ id }) => id === gameId);

    return game ? <Outlet context={game} /> : <NotFoundPage missingGame />;
}

export function GameDetailPage() {
    const game = useOutletContext();

    return (
        <main className="page-content game-page">
            <BackLink to="/">게임 목록으로 돌아가기</BackLink>
            <article className="game-page-panel">
                <div className="game-detail-heading">
                    <GameArtwork
                        game={game}
                        className="game-card-media game-detail-artwork"
                        size={32}
                    />
                    <div>
                        <span className="game-badge">{game.category}</span>
                        <h2>{game.title}</h2>
                    </div>
                </div>

                <section className="game-detail-section">
                    <h3>게임 소개</h3>
                    <p>{game.introduction || game.description}</p>
                </section>

                <section className="game-detail-section">
                    <h3>게임 규칙</h3>
                    <GameSteps items={game.rules} placeholder="상세 규칙 준비 중" />
                </section>

                <section className="game-detail-section">
                    <h3>게임 시작</h3>
                    <GameModeLinks gameId={game.id} />
                </section>

                <details className="game-detail-section">
                    <summary>자세한 게임 방법</summary>
                    <GameSteps items={game.instructions} placeholder="자세한 게임 방법 준비 중" />
                </details>
            </article>
        </main>
    );
}

export function GameModePage({ mode }) {
    const game = useOutletContext();

    return (
        <main className="page-content game-page">
            <BackLink to="..">게임 상세로 돌아가기</BackLink>
            <section className="game-page-panel">
                <span className="game-badge">{mode.title}</span>
                <h2>{game.title}</h2>
                <p>{mode.title} 화면은 준비 중입니다.</p>
            </section>
        </main>
    );
}

export function NotFoundPage({ missingGame = false }) {
    return (
        <main className="page-content game-page">
            <BackLink to="/">게임 목록으로 돌아가기</BackLink>
            <section className="game-page-panel">
                <h2>{missingGame ? '게임을 찾을 수 없습니다.' : '페이지를 찾을 수 없습니다.'}</h2>
                <p>{missingGame ? '등록된 게임은 게임 목록에서 확인할 수 있습니다.' : '주소를 확인해 주세요.'}</p>
            </section>
        </main>
    );
}
