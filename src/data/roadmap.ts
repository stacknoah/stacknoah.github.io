// 다루는 주제의 뼈대. 그룹은 글 대분류와 같은 다섯, 컬럼은 그 안의 주제 묶음
// 그룹 이름을 여기 적지 않고 category 키로 가리킨다. 표시 이름은 src/lib/categories.ts 한 곳에서만 관리
// 항목은 글을 쓰면서 직접 채운다. { label: '제목', link: '/notes/...' } 꼴로 넣으면
// 링크가 걸린 항목만 진하게 보이고 나머지는 흐리게. 항목이 없는 컬럼은 빈 줄 세 개로 그려짐

import type { CategoryKey } from '../lib/categories';

export interface RoadmapItem {
  label: string;
  /** 글을 쓴 항목만 link. 링크 유무가 곧 다뤘는지 여부 */
  link?: string;
}

export interface RoadmapCategory {
  name: string;
  items: RoadmapItem[];
}

export interface RoadmapGroup {
  category: CategoryKey;
  categories: RoadmapCategory[];
}

export const roadmap: RoadmapGroup[] = [
  {
    category: 'cs',
    categories: [
      {
        name: '컴퓨터 구조',
        items: [],
      },
      {
        name: '운영체제',
        items: [],
      },
      {
        name: '네트워크',
        items: [],
      },
      {
        name: '데이터베이스',
        items: [],
      },
      {
        name: '프로그래밍과 언어',
        items: [],
      },
    ],
  },
  {
    category: 'security',
    categories: [
      {
        name: '암호',
        items: [],
      },
      {
        name: '인증과 접근통제',
        items: [],
      },
    ],
  },
  {
    category: 'consulting',
    categories: [
      {
        name: '인증과 규제',
        items: [],
      },
      {
        name: '진단 절차',
        items: [],
      },
      {
        name: 'IT 정책과 지침',
        items: [],
      },
      {
        name: 'OT 정책과 절차',
        items: [],
      },
    ],
  },
  {
    category: 'it',
    categories: [
      {
        name: '웹',
        items: [],
      },
      {
        name: '서버와 인프라',
        items: [],
      },
      {
        name: '클라우드',
        items: [],
      },
      {
        name: '컨테이너와 런타임',
        items: [],
      },
    ],
  },
  {
    category: 'ot',
    categories: [
      {
        name: 'OT 기초',
        items: [],
      },
      {
        name: '산업 프로토콜',
        items: [],
      },
      {
        name: '진단과 통제',
        items: [],
      },
    ],
  },
];
