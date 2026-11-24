import { Bot, Users } from 'lucide-react';

export const playModes = [
    { id: 'ai', path: 'ai', label: 'AI와 하기', title: 'AI 대전', Icon: Bot },
    { id: 'player', path: 'rooms', label: '사람과 하기', title: '사람 대전 대기실', Icon: Users },
];

export function gamePath(gameId) {
    return `/games/${encodeURIComponent(gameId)}`;
}
