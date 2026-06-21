---
title: "XSS-1 (Dreamhack, B2)"
date: 2026-06-21
draft: false
tags: ["XSS"]
ShowToc: true
---

## 문제 분석

- `/vuln`: `param`을 받아 이스케이프 없이 그대로 응답에 출력 → reflected XSS가 터지는 지점
- `/flag`: POST로 받은 `param`을 `check_xss`에 넘김 → `check_xss`는 그 `param`을 `/vuln?param=...` URL로 조립 → FLAG가 쿠키로 심긴 봇(Selenium)이 그 URL을 방문
- `/memo`: `memo` 파라미터로 받은 값을 전역 변수 `memo_text`에 누적 저장하고 보여줌

```python
@app.route("/vuln")
def vuln():
    param = request.args.get("param", "")
    return param   # 입력을 그대로 출력 → reflected XSS

def check_xss(param, cookie=...):
    url = f"http://127.0.0.1:8000/vuln?param={urllib.parse.quote(param)}"
    return read_url(url, cookie)   # FLAG 쿠키 든 봇이 이 URL 방문
```

## 취약점

`/vuln`이 사용자 입력을 검증/이스케이프 없이 응답에 출력 → 입력에 `<script>`를 넣으면 그대로 실행

핵심: FLAG는 어떤 응답에도 없음, FLAG는 오직 봇의 쿠키에만 존재 `/flag`의 good/wrong 메시지는 공격자와 무관(봇이 방문에 성공했는지 여부일 뿐) → 목표는 응답에서 FLAG 읽기가 아니라 봇의 쿠키를 탈취하는 것

## 공격

### 흐름 설계

1. 공격자가 `/flag`에 `param` 입력 → 봇을 호출
2. 봇이 `/vuln?param=공격자스크립트` 방문 → 봇 브라우저에서 스크립트 실행
3. 그 스크립트가 봇의 쿠키(FLAG)를 읽음
4. 읽은 쿠키를 공격자가 볼 수 있는 곳(`/memo`)으로 전송
5. 공격자가 `/memo`를 열어 FLAG 확인

> 핵심 당위: 봇은 격리된 환경에 존재 → 스크립트가 쿠키를 읽어도 그 값이 봇 안에만 있으면 공격자는 볼 수 없음 → `alert`로 띄워도 봇 화면(내가 볼 수 없는)에 출력 → ***따라서 "읽기"와 "공격자에게 도달시키기"는 완전히 별개의 문제임을 반드시 명심***

### 수신처 확보

외부 서버(webhook 등) 없이 `/memo`를 수신처로 사용 가능

> 당위: `memo_text`는 전역 변수 → 봇이 `/memo`에 저장하든 공격자가 저장하든 같은 하나의 저장소에 쌓임 → 봇과 공격자가 저장소를 공유하므로, 봇이 남긴 값을 공격자가 GET으로 읽을 수 있음 → 수신처 확보

### 전송 수단

JS에서 특정 URL로 요청을 발생시키는 데 이미지 객체 사용

```js
new Image().src = "URL"
```

> 당위: 이미지 객체에 `src`를 지정 → 브라우저가 그 이미지를 불러오려고 해당 URL로 GET 요청을 자동 발생→ 이미지가 실제로 존재하는지는 무관, 요청을 보내는 것 자체가 목적 → 데이터를 은밀히 빼낼 때 흔히 사용(CSRF에서 `<img src>`가 자동 요청을 보내던 것과 같은 원리)

### 페이로드 조립

`param`에 넣을 최종 페이로드:

```html
<script>new Image().src="http://127.0.0.1:8000/memo?memo=" + document.cookie</script>
```

> 당위: 따옴표 안은 글자 그대로, 밖은 실행할 코드 → `document.cookie`를 따옴표 안에 넣으면 `document.cookie`라는 글자가 전송, 밖에 두고 `+`로 이으면 실행해서 읽은 실제 쿠키값이 전송


### 단계적 검증

한 번에 완성 페이로드를 넣지 않고 쪼개서 확인

1. `<script>alert(1)</script>`: 스크립트 실행 여부 (단, 봇 화면이라 공격자는 못 봄)
2. `<script>new Image().src="http://127.0.0.1:8000/memo?memo=test"</script>`: `/memo`에 `test` 뜨는지로 전송 통로 검증
3. `test`를 `document.cookie`로 교체: 쿠키 탈취

> 당위: 완성 페이로드를 한 번에 넣으면 실패 시 실행이 안 된 건지 / 전송이 틀린 건지 / 쿠키 읽기가 틀린 건지 구분이 불가 → 끊어서 검증하면 실패 지점을 좁힐 수 있음

## 풀이

`/flag` 폼의 입력칸에 페이로드 제출 → 봇이 방문·실행 → `/memo`에서 쿠키 확인

## 배운 점

- reflected XSS의 흐름: 단순히 입력이 출력된다가 아니라, 피해자(봇)가 페이로드 박힌 페이지를 방문하게 만들고 → 그 쿠키를 외부로 빼내는 과정
- FLAG가 응답이 아니라 쿠키에 있을 때, 공격 목표는 출력 읽기가 아니라 쿠키 탈취
- 데이터 유출 통로로 `new Image().src` 활용 (세부 내용은 what/payloads 참고)
- 익스플로잇은 한 번에 짜지 않고 조각별 검증 후 작성