
import { Grid3X3, Hash } from 'lucide-react';

// 상세 페이지에는 선택적으로 introduction(문자열), rules와 instructions(문자열 배열)를 추가할 수 있습니다.
export const games = [
    {
        id: 'blind-omok',
        title: '블라인드 오목',
        description: '상대방의 돌이 보이지 않는 전략 오목 게임',
        category: '전략 게임',
        image: null,
        icon: Grid3X3,
        rules: [],
        instructions: [],
    },
    {
        id: 'number-game',
        title: '숫자 게임',
        description: '숫자를 활용한 심리 전략 게임',
        category: '심리 게임',
        image: null,
        icon: Hash,
        rules: [],
        instructions: [],
    },
];
