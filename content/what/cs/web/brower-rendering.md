---
title: Browser-rendering
date: 2026-06-23
draft: false
tags: ["CS", "web"]
ShowToc: true
---

## 화면이 그려지는 5단계

1. 요청: 브라우저가 서버에 페이지 요청
2. 응답: 서버가 HTML을 글자 덩어리로 반환, 이 시점엔 그냥 긴 텍스트
3. 파싱: 글자를 위에서 아래로 한 줄씩 읽으며 DOM 구성 → `<script>` 만나면 즉시 실행
4. 완료: 끝까지 읽으면 DOM 완성(파서 종료)
5. 수정: 이후부터 완성된 DOM을 JS가 고치는 단계

핵심: `<script>` 실행 조건은 3단계(파서가 읽는 중)에 그 `<script>`가 글자 속에 존재 → 4단계 이후 뒤늦게 추가된 `<script>`는 파서가 이미 손을 뗐으므로 실행 안 됨

## sink별 결론

같은 `?param=<script>alert(1)</script>` 입력 시:

- 서버 직접 출력 (`return param`): `<script>`가 2단계 응답 글자에 이미 포함 → 3단계에서 파서가 만남 → 실행
- `document.write(param)`: 3단계 도중 `<script>`를 글자에 삽입 → 아직 파서가 읽는 중 → 실행
- `innerHTML = param`: 5단계에서 추가 → 파서 종료 후 → 태그는 DOM에 생성되나 실행 안 됨

> innerHTML이 `<script>`를 막는 것은 보안 규칙(HTML5 명세) → 사용자 입력이 innerHTML에 들어가는 순간 코드 실행으로 뚫리는 것을 막기 위해, 나중에 삽입된 script의 실행을 차단

## 그래서

innerHTML sink에서 `<script>`가 막히면, 파서를 거치지 않고 JS를 발화시키는 이벤트 핸들러(`<img onerror>` 등)로 우회