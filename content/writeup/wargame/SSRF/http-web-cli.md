---
title: web-HTTP-CLI
date: 2026-07-14
draft: false
ShowToc: true
tags:
  - Writeup
  - Dreamhack
  - SSRF
  - LFR
---

## 승리 조건
- 서버가 입력받은 url을 `urllib.request.urlopen(url)`로 열어줌
- 목표 = 로컬 `flag.txt` 읽기 (file:// 스킴으로 로컬 파일 읽기)

## 진행

### 1. 구조 파악
- Flask 아님. raw TCP 소켓 서비스 → 브라우저 X, `nc host port`로 접속
- `>` 프롬프트에 url 입력 → `urlopen(url)` 결과 반환
- 상단 `FLAG = open('./flag.txt').read()`는 미사용 잉여코드, 진짜 타겟은 디스크의 flag.txt 파일

### 2. 스킴 관찰 → LFR 가능성
- `requests`(crawling)와 달리 `urllib`은 file:// 스킴 지원
- `urlopen('file:///path')` = 네트워크 안 타고 로컬 디스크 읽기 → HTTP SSRF가 아니라 파일 읽기(LFR) 문제

### 3. 필터 확인
```python
(host, port) = get_host_port(url)   # url.split('://')[1].split('/')[0].lower().split(':')
if 'localhost' == host: block
if 'dreamhack.io' != host and '.' in host: block
urlopen(url)
```
- 입력 url 하나가 검증(get_host_port)과 실제 fetch(urlopen)에 동시에 쓰임 → 한 문자열로 둘 다 만족해야 함
- 제약: netloc에 콜론 1개(언패킹) + host는 localhost 아님 + 점 없음

### 4. 실패 케이스
- `file:///flag.txt` → host가 빈 문자열 1개라 `(host,port)` 언패킹 에러
- `file://host3.dreamhack.games/...` → host에 점 → 차단
- `%20`/`\u0020`로 host 채우기 → urlopen이 공백을 host로 보고 non-local 에러

### 5. 핵심
- file://의 "로컬" host는 loopback IP가 아니라 빈 문자열(`file:///path`의 슬래시 3개)
- 빈 host는 필터 통과(점 없음, localhost 아님)
- 빈 host + 콜론 하나면 언패킹도 성립:
```
file://:1/flag.txt
→ split(':') = ['', '1'] → (host='', port='1')   통과
→ urlopen이 빈 host라 로컬 읽기
```

### 6. 경로 확정 → flag
- `flag.txt`는 상대경로라 cwd 절대경로 필요
- `/proc/self/cwd/flag.txt`로 확정(추측 불요), 또는 흔한 `/app` 추정
```
file://:11944/app/flag.txt
```
```
DH{5e2c73de0f2b273731665914bfaff022}
```

## 배운 점
- `urllib`은 file:// 스킴 지원 → 임의 파일 읽기(LFR). 요청 함수가 어떤 스킴을 여는지 항상 확인(requests=http만, urllib=file 포함)
- 같은 입력이 "검증"과 "실행"에 동시에 쓰이면, 둘을 동시에 만족하는 단일 페이로드가 우회의 열쇠
- file://의 로컬 host = 빈 문자열. loopback IP로 착각 금지
- 파일 읽기로 경로를 모를 땐 `/proc/self/cwd`로 cwd 확정. LFR은 RCE가 아니므로 상한은 파일 읽기
- 방어: 스킴 화이트리스트(http/https만 허용), 검증과 실제 요청의 대상 일치 보장