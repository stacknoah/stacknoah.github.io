// 다루는 주제 목록. 그룹은 글 대분류와 같은 다섯
// 그룹 이름을 여기 적지 않고 category 키로 가리킨다. 표시 이름은 src/lib/categories.ts 한 곳에서만 관리
// 글을 쓰면 link를 달면 됨. 링크가 걸린 항목만 진하게 보이고 나머지는 흐리게

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
        items: [
          { label: '메모리 계층과 캐시' },
          { label: '스택 프레임과 호출 규약' },
          { label: '어셈블리 읽는 법' },
          { label: '바이너리 구조와 적재 과정' },
        ],
      },
      {
        name: '운영체제',
        items: [
          { label: '프로세스와 스레드' },
          { label: '가상 메모리와 페이징' },
          { label: '시스템 호출과 커널 모드 전환' },
          { label: '파일 시스템과 권한 모델' },
        ],
      },
      {
        name: '네트워크',
        items: [
          { label: 'TCP 연결 수립과 종료' },
          { label: '라우팅과 스위칭' },
          { label: 'DNS 질의 흐름' },
          { label: 'HTTP 요청과 응답 구조' },
        ],
      },
      {
        name: '데이터베이스',
        items: [
          { label: '관계형 모델과 정규화' },
          { label: '질의 처리와 인덱스' },
          { label: '트랜잭션과 격리 수준' },
          { label: '계정과 권한 모델' },
        ],
      },
      {
        name: '프로그래밍과 언어',
        items: [
          { label: '컴파일과 링크 과정' },
          { label: '언어별 메모리 관리 방식' },
          { label: '직렬화와 역직렬화' },
          { label: '의존성과 빌드 재현성' },
        ],
      },
    ],
  },
  {
    category: 'security',
    categories: [
      {
        name: '암호',
        items: [
          { label: '대칭키와 공개키' },
          { label: '해시와 전자서명' },
          { label: 'TLS 핸드셰이크 흐름' },
        ],
      },
      {
        name: '인증과 접근통제',
        items: [
          { label: '세션과 토큰' },
          { label: 'OAuth와 OIDC' },
          { label: '접근통제 모델 비교' },
        ],
      },
    ],
  },
  {
    category: 'consulting',
    categories: [
      {
        name: '인증과 규제',
        items: [
          { label: 'ISMS-P 인증기준 훑기' },
          { label: '전자금융감독규정과 망분리' },
          { label: '주요정보통신기반시설 진단 흐름' },
          { label: 'IEC 62443 구역과 통로 모델' },
        ],
      },
      {
        name: '진단 절차',
        items: [
          { label: '위협 모델링 방법' },
          { label: '위험 평가와 등급 산정' },
          { label: '진단 보고서 구성' },
        ],
      },
      {
        name: 'IT 정책과 지침',
        items: [
          { label: '정책, 지침, 절차 3단 체계' },
          { label: '접근통제 지침 작성' },
          { label: '계정과 권한 관리 절차' },
          { label: '로그 보존 기준과 근거' },
          { label: '점검 체크리스트 양식' },
        ],
      },
      {
        name: 'OT 정책과 절차',
        items: [
          { label: 'OT 보안 정책의 적용 범위' },
          { label: '제어시스템 변경 관리 절차' },
          { label: '원격접속 승인과 기록' },
          { label: '반입 매체와 작업자 통제' },
          { label: '비상 대응과 복구 절차' },
        ],
      },
    ],
  },
  {
    category: 'it',
    categories: [
      {
        name: '웹',
        items: [
          { label: 'OWASP Top 10 항목별 정리' },
          { label: '인증과 인가 취약점' },
          { label: 'SSRF와 인스턴스 메타데이터' },
          { label: '파일 업로드와 역직렬화' },
        ],
      },
      {
        name: '서버와 인프라',
        items: [
          { label: '리눅스 서버 진단 항목' },
          { label: '윈도우와 액티브 디렉터리' },
          { label: '네트워크 장비 설정 점검' },
          { label: 'DB 접근통제와 계정 관리' },
        ],
      },
      {
        name: '클라우드',
        items: [
          { label: 'IAM 권한 상승 경로' },
          { label: '클라우드 진단 체크리스트' },
          { label: '계정 분리와 경계 설계' },
          { label: '스토리지 공개 설정 점검' },
        ],
      },
      {
        name: '컨테이너와 런타임',
        items: [
          { label: '컨테이너 탈출 경로' },
          { label: 'eBPF 탐지 규칙 작성' },
          { label: 'io_uring과 시스템 호출 관측 우회' },
          { label: '쿠버네티스 권한 모델' },
        ],
      },
    ],
  },
  {
    category: 'ot',
    categories: [
      {
        name: 'OT 기초',
        items: [
          { label: '퍼듀 모델과 네트워크 계층' },
          { label: 'PLC, HMI, SCADA 구성요소' },
          { label: 'IT 방법론이 OT에서 막히는 지점' },
        ],
      },
      {
        name: '산업 프로토콜',
        items: [
          { label: 'Modbus 구조와 진단 시 위험' },
          { label: 'DNP3' },
          { label: 'OPC UA' },
          { label: 'S7comm' },
        ],
      },
      {
        name: '진단과 통제',
        items: [
          { label: '능동 점검 대신 쓰는 관측 방법' },
          { label: '보상 통제 설계 사례' },
          { label: '망분리와 단방향 전송장비' },
        ],
      },
    ],
  },
];
