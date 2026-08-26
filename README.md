# stacknoah

보안 컨설팅 공부 기록 블로그. Astro 기반, GitHub Pages 배포

## 로컬 실행

```bash
npm install
npm run dev
```

## 글 쓰는 곳

```
src/content/
  notes/      짧은 학습 기록. /notes/파일명 으로 열림
  articles/   긴 글. description 필드가 목록 요약으로 보임
  projects/   프로젝트 메타와 개요
  logs/       프로젝트 진행 기록. project 필드로 프로젝트와 연결
src/data/
  roadmap.ts  메인 페이지 공부 로드맵
```

## 대분류

`category` 필드에 쓰는 값과 화면에 보이는 이름. 정의는 `src/lib/categories.ts`

| 값 | 이름 | 무엇을 담나 |
| --- | --- | --- |
| `cs` | CS | 보안이 아닌 기반 지식 |
| `security` | Security | 환경을 안 가리는 보안 원리 |
| `consulting` | Consulting | 진단 절차, 규제와 인증, 산출물 |
| `it` | IT | 서버, 웹, 클라우드, 컨테이너 환경의 보안 |
| `ot` | OT | 제어시스템 환경에서만 성립하는 것 |

둘에 걸치면 환경 특정성이 먼저. OT 진단 방법론은 `consulting`이 아니라 `ot`.
`topic` 은 로드맵의 어느 컬럼인지. 값은 `src/data/roadmap.ts` 의 컬럼 이름과 같아야 한다

## frontmatter 예시

```yaml
# notes, articles
---
title: 제목
date: 2026-08-25
category: ot          # 위 표의 값, 생략 가능
topic: 산업 프로토콜    # 로드맵 컬럼 이름, 생략 가능
tags: [태그]
description: 요약 한 줄 (articles 권장)
---

# projects
---
title: 프로젝트 이름
status: ongoing   # ongoing, done, paused
start: 2026-08-01
domain: it        # 프로젝트는 it 또는 ot 만
featured: true    # 홈에 띄울지
summary: 한 줄 소개
repo: https://github.com/...   # 생략 가능
---

# logs
---
project: 프로젝트-파일명
date: 2026-08-25
title: 기록 제목
---
```

주제 목록은 `src/data/roadmap.ts`에서 다섯 그룹 아래 카테고리를 수정.
글을 쓰면 그 항목에 `link`를 달면 됨. 링크가 걸린 항목만 진하게 보이고 나머지는 흐리게

## 첨부 파일

파일을 `public/files/`에 두고 frontmatter에서 가리킨다. 노트, 글, 프로젝트 모두 됨

```yaml
attachments:
  - file: files/report.pdf
    label: 진단 보고서      # 생략하면 파일명이 그대로 보임
  - file: files/capture.pcap
```

크기는 빌드할 때 실제 파일에서 읽는다. 손으로 적을 필요 없고 어긋나지도 않음.
파일이 아직 없어도 빌드는 통과하고 크기 자리만 비어 나옴

## 검색

`/search.json` 이 빌드 때 만들어지고 브라우저가 받아서 거름. 제목, 분류, 태그, 요약, 본문 앞 2000자가 대상.
`/` 또는 `Cmd+K` 로 열고 `esc` 로 닫음

## 글쓰기

```bash
npm run write
```

한 번이면 된다. 뜨고 나면 `localhost:4321/admin/` 으로 들어가거나 사이트 맨 아래 글쓰기를 누르면
바로 편집 화면이다. 로그인도 없다. 끄려면 Ctrl+C

제목, 분류, 태그가 칸으로 나오고 이미지와 첨부는 끌어다 놓으면 된다.
오른쪽에 미리보기가 같이 뜬다. 저장하면 `src/content/` 아래에 마크다운 파일이 생긴다

폰이나 다른 컴퓨터에서 `stacknoah.com/admin` 으로 쓰려면 로그인 중계소가 한 번 필요하다.
`oauth-worker/README.md` 참고

설정은 `src/pages/admin/config.yml.ts` 가 만들어 낸다. `config.yml` 은 손으로 고치지 않는다.
컬럼 선택지는 `src/data/roadmap.ts` 에서 자동으로 뽑으므로 로드맵에 칸을 더하면 글쓰기 화면에도 같이 생긴다.
항목 이름은 `src/content.config.ts` 와 맞아야 하고 어긋나면 빌드가 깨진다

파일을 직접 만들어도 된다. `src/content/notes/제목.md` 로 두면 그만이다

## 배포

`stacknoah/stacknoah.github.io` 저장소의 main 에 push 하면 GitHub Actions 가 빌드해서 Pages 로 올린다.
도메인은 이미 붙어 있어서 DNS 는 건드릴 일이 없다

| 항목 | 값 |
| --- | --- |
| 도메인 | stacknoah.com (Namecheap 등록, A 레코드가 GitHub Pages 를 가리킴) |
| 커스텀 도메인 파일 | `public/CNAME` |
| Node 버전 | `.node-version` |

관리자 화면의 깃헙 로그인만 별도 중계소가 필요하다. 절차는 `oauth-worker/README.md`

```bash
npm run auth:deploy   # 워커 올리기
npm run auth:id       # Client ID 넣기
npm run auth:secret   # Client secret 넣기
```

프로젝트 어디서 실행해도 되고, 사이트가 어디에 있든 상관없다
