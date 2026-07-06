---
title: Encoding-bypass
date: 2026-06-24
draft: false
tags: ["CS", "web"]
ShowToc: true
---

# 디코딩 시점과 인코딩 우회

## 핵심 원리

인코딩 우회 = 아래 2개 동시 충족
1. 검사 시점 → 인코딩된 글자 그대로라 필터에 안 걸림
2. 도착 시점 → 그 자리에서 디코딩되어 원래 글자로 실행

검사 레이어 ≠ 디코딩 레이어 → 우회 가능
검사 전에 이미 디코딩되는 구조 → 우회 불가
→ 우회 여부 = 어느 단계에서 누가 디코딩하느냐로 결정

## 디코딩 레이어 지도

| 인코딩 | 디코딩 주체 | 디코딩 시점 |
|---|---|---|
| URL 인코딩 `%3c` | 웹서버 / WSGI / Flask `request` | 요청 수신 직후, 서버 필터보다 먼저 |
| HTML 엔티티 `&#40;` | HTML 파서 | DOM 파싱 중, 자리별로 갈림 |
| URL 구조 파싱 | `urlparse` | `%xx` 디코딩 안 함, 글자 그대로 분리 |

URL 인코딩 → 서버 필터 도착 전 이미 디코딩 → 서버 측 필터엔 우회력 없음 (`%28` 보내도 필터는 `(` 로 봄)
HTML 엔티티 → 디코딩 주체가 HTML 파서 → 들어간 자리에 종속 (XSS 참고)

## 사례: XSS

### 엔티티 디코딩 — 자리별

| 자리 | 디코딩 주체 | `&#40;` 디코딩 |
|---|---|---|
| 본문 / 속성값 | HTML 파서 | O |
| `<script>` 안 | JS 엔진 | X |

JS 엔진은 HTML 엔티티 모름 → 엔티티 우회는 속성값 자리(이벤트 핸들러 등)에서만 동작, `<script>` 안에선 디코딩 안 됨

### 실행 시점 — 단계별

화면 그려지는 5단계
1. 요청 → 브라우저가 페이지 요청
2. 응답 → 서버가 HTML을 글자 덩어리로 반환 (이 시점엔 텍스트)
3. 파싱 → 위→아래로 읽으며 DOM 구성, `<script>` 만나면 즉시 실행
4. 완료 → 끝까지 읽어 DOM 완성, 파서 종료
5. 수정 → 완성된 DOM을 JS가 변경

`<script>` 실행 조건 → 3단계(파서가 읽는 중)에 글자 속 존재
4단계 이후 추가된 `<script>` → 파서 종료 후라 실행 안 됨

sink별 (`?param=<script>alert(1)</script>` 입력 시)

| sink | 글자 삽입 단계 | 실행 |
|---|---|---|
| 서버 직접 출력 `return param` | 2단계 응답 글자에 포함 | O |
| `document.write(param)` | 3단계 파싱 중 삽입 | O |
| `innerHTML = param` | 5단계, 파서 종료 후 | X |

`innerHTML`이 `<script>` 차단 → HTML5 명세 보안 규칙(나중 삽입 `<script>` 실행 차단), 이벤트 핸들러는 동작
→ `innerHTML` sink → `<img onerror>` 등 이벤트 핸들러로 우회

연결 → 이벤트 핸들러 속성 = HTML 파서가 읽는 자리 → `&#40;` 디코딩 + `<script>` 차단 동시 우회 / `<script>` 안 = JS 엔진 자리 → 엔티티 디코딩 안 됨

## 사례: SSRF

### urlparse netloc 분리

    urlparse("http://localhost:8000@127.0.0.1:1500/flag.txt")
      netloc   → 'localhost:8000@127.0.0.1:1500'   # @앞 userinfo 포함 통째
      hostname → '127.0.0.1'                        # userinfo 떼고 host만

netloc = `userinfo@host:port` 전체 → @ 앞에 숨긴 `localhost` / `127.0.0.1` 글자도 netloc에 포함
→ netloc 문자열 검사 시 그 글자 그대로 매칭 → @ 트릭 우회 실패

판별점: SSRF 필터가 netloc을 보나 hostname을 보나
→ netloc 검사 = userinfo 글자까지 포함 → @ 무력
→ hostname 검사였다면 userinfo 떨어져 우회 여지