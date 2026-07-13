---
title: "Express"
date: 2026-07-13
draft: false
tags: ["web", "nodejs", "express", "what"]
---

## Express

Node.js에서 웹 서버를 짜는 최소주의 프레임워크.  
라우팅과 요청/응답 처리라는 뼈대만 주고 나머지는 알아서 붙이는 구조. CTF 웹 문제 서버 코드의 상당수가 Express라, 이거 하나 잡아두면 소스 읽는 속도가 확 붙는다.

## 요청은 함수들의 파이프라인을 통과

미들웨어: 요청(request)이 최종 응답에 닿기까지 거쳐 가는 중간 처리 함수  
요청이 들어오면 Express는 등록된 함수들을 위에서부터 순서대로 통과: 각 함수가 `(req, res, next)`를 받아 자기 할 일을 하고, `next()`를 호출해 다음으로 넘김 → 사슬의 맨 끝이 라우트 핸들러

인증 검사, 바디 파싱, 로깅, CSP 헤더 심기 같은 "모든 요청에 공통으로 거는 처리"가 전부 미들웨어로 얹힘 → 그래서 보안 관점으로 소스를 읽을 땐 `app.use(...)` 줄부터 확인 → 이 서버가 뭘 걸어뒀고 뭘안 걸어뒀는지(CSP 유무 등) 확인 가능

## 라우트: `app.METHOD(경로, 핸들러)`

Flask는 `@app.route('/x', methods=['POST'])` + 함수로 라우트를 정의하지만, Express는 데코레이터 대신 **메소드 호출**이다: `app.post('/x', 핸들러)`. HTTP 메소드가 곧 함수 이름(`app.get`, `app.post`, `app.put`, `app.delete`)이고, 첫 인자가 경로, 둘째가 핸들러다. 서버의 전체 라우트 지도를 뽑고 싶으면 **`app.` 으로 시작하는 줄만 훑으면 된다** — Flask에서 `@app.route` 스캔하는 것과 똑같다.

## 핸들러: `(req, res) => { ... }`

핸들러는 요청 객체 `req`, 응답 객체 `res`를 받는다. `req`는 Flask의 `request`에 해당한다. 결정적 차이 하나 — **Flask는 값을 `return`해서 응답하지만, Express는 `res`의 메소드를 호출해서 응답을 내보낸다.** `return v`가 아니라 `res.json(obj)`, `res.send(text)`. `res.status(400).json({...})`처럼 체이닝도 된다.

## 입력은 세 군데서 온다

사용자가 보낸 값 — 즉 공격자가 조종 가능한 데이터 — 가 들어오는 문은 딱 셋이다.

- 경로 변수 `/:id` → `req.params.id` (Flask의 `<id>`)
- 쿼리스트링 `?q=…` → `req.query.q` (Flask의 `request.args`)
- 요청 바디 → `req.body` (Flask의 `request.json`)

단 `req.body`는 저절로 채워지지 않는다. `app.use(express.json())` 같은 바디 파싱 미들웨어가 있어야 JSON 바디가 `req.body`로 들어온다. 없으면 `undefined`다. **보안 소스 읽기에서 source(입력 진입점)를 찾는 첫걸음이 바로 이 세 곳이다.**

## 자주 보는 내장 미들웨어

`express.json()`은 JSON 바디를 파싱해 `req.body`에 넣고, `express.urlencoded()`는 폼 데이터를 파싱한다. `express.static('dir')`은 지정 폴더 파일을 그대로 정적 서빙하는데, `app.use('/static', express.static(...))`라면 `/static/*` 요청이 그 폴더 파일로 매핑된다.

## Flask ↔ Express 빠른 대응표

| 개념 | Flask | Express |
|---|---|---|
| 라우트 | `@app.route('/x', methods=['GET'])` | `app.get('/x', h)` |
| 핸들러 | `def h():` + 전역 `request` | `(req, res) => {}` |
| 응답 | `return value` | `res.json()` / `res.send()` |
| 경로변수 | `/<id>` → `def h(id)` | `/:id` → `req.params.id` |
| 쿼리 | `request.args.get('q')` | `req.query.q` |
| 바디 | `request.json` | `req.body` (+ `express.json()`) |
| 상태코드 | `return v, 400` | `res.status(400).json(v)` |
| 정적파일 | `static/` 자동 | `express.static()` 명시 |

## 보안 관점에서 Express 소스 읽는 순서

1. **`app.use(...)` 미들웨어부터.** 뭐가 전역으로 걸려 있나 — 인증? CSP? 입력 sanitize? **없는 것**이 곧 공격 표면이다.
2. **`app.METHOD(...)`로 라우트 표를 만든다.** 어떤 엔드포인트가 존재하나.
3. **각 핸들러에서 `req.params/query/body`(source)가 어디로 흐르는지 추적.** DB로? 파일 경로로? 응답 HTML로? 그 종착점(sink)이 취약점 후보다.
4. **`express.static` 경로 확인.** 경로 순회(path traversal)나 의도치 않은 파일 노출 여지.

## 버전 한 줄

지금 최신은 **Express 5**, 아직 많이 쓰이는 건 **4**다. 라우트·미들웨어 기본 문법은 둘이 같아서 위 내용은 그대로 통한다. (5에서 비동기 에러 처리와 일부 경로 매칭 규칙이 바뀐 정도만 다르다.)
