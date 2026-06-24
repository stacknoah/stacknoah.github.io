---
title: HTTP
date: 2026-06-24
draft: false
tags: ["CS", "web"]
ShowToc: true
---

## 기본

요청 1개에 응답 1개, 브라우저가 요청을 보내면 서버가 응답을 돌려줌  
무상태(stateless): 요청끼리 서로 기억 못 함 → 로그인 유지 같은 건 쿠키로 따로 처리

## 요청 구조

```
GET /memo?memo=test HTTP/1.1      요청 줄: 메서드 + 경로 + 버전
Host: example.com                 헤더: 부가 정보 (key: value)
Cookie: flag=DH{...}
User-Agent: Mozilla/5.0

(본문)                            POST 등에서 보낼 데이터
```

요청 줄: 무엇을(메서드) 어디에(경로) 보내는지

헤더: 요청에 딸린 정보, Host(어느 서버), Cookie(인증 값), Content-Type(본문 형식)

본문: 서버로 보내는 데이터, GET엔 보통 없고 POST에 있음

## URL 구조

```
https://example.com/path?name=test&id=5
```

scheme `https` → host `example.com` → path `/path` → query `?name=test&id=5`

쿼리는 `?`부터 시작 → `key=value` 한 쌍 → `&`로 여러 쌍 구분

값에 특수문자(`&` `=` 공백 한글)를 넣으면 URL 인코딩 필요 (`&` → `%26`), 안 하면 구조 깨짐

## 메서드

| 메서드 | 용도 | 파라미터 위치 |
|---|---|---|
| GET | 조회 | URL 쿼리 (`?key=value`) |
| POST | 전송/생성 | 본문 |
| PUT / DELETE | 수정 / 삭제 | 본문 |

GET은 파라미터가 URL에 그대로 드러남 → 주소창/기록에 남음 → 민감한 값은 POST 본문으로

## 응답 구조

```
HTTP/1.1 200 OK                   상태 줄: 버전 + 상태 코드
Content-Type: text/html           헤더
Set-Cookie: session=abc

<html>...</html>                  본문: 실제 내용
```

## 상태 코드

| 대 | 뜻 | 예 |
|---|---|---|
| 2xx | 성공 | 200 OK |
| 3xx | 다른 곳으로 이동 | 301 영구, 302 임시 |
| 4xx | 요청 잘못 | 403 거부, 404 없음 |
| 5xx | 서버 잘못 | 500 내부 오류 |