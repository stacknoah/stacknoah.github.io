---
title: "Question"
date: 2026-07-13
draft: false
tags: ["web", "SSRF", "IHHH-CTF"]
---

## 한 줄
공개 app의 URL 프리뷰(SSRF)로 내부 admin에 도달, admin의 curl에 file://를 먹여 로컬 flag 파일 읽기

## 구조
- app (공개, :3000) + admin (내부, :8080, flag 보유)
- docker-compose에서 app만 ports로 외부 노출, admin은 expose라 내부 컨테이너에서만 접근 가능
- flag는 admin 컨테이너의 /flag (Dockerfile의 `COPY flag /flag`)

## 취약점
두 지점

### app SSRF
```python
url = request.args.get("url")
if parsed.scheme not in {"http", "https"}:   # 스킴만 검증
    return bad_request(...)
requests.get(url, ...)                        # 목적지 무검증, 서버가 임의 url fetch
```
- 목적지(host) 검증 없음 → url에 http://admin:8080 넣으면 서버가 내부 admin에 요청
- app은 같은 도커 네트워크라 admin에 닿고, 나는 직접 못 닿음

### admin 파일 읽기
```python
target = request.args.get("url")
subprocess.run(["curl", "--silent", ..., target])   # 리스트형, 스킴 검증 없음
```
- 리스트형 subprocess = 셸 없음 → command injection 불가, argument injection만 가능
- curl은 file:// 지원, admin은 스킴 무검증 → curl file:///flag로 로컬 파일 읽기

## 핵심 개념
- SSRF: 요청 목적지가 하드코딩이 아니라 사용자 입력(데이터), 서버 권한으로 외부에서 못 닿는 내부에 접근
- 2단 체인이 강제된 이유: 공개면은 스킴을 http/https로 제한해 file:// 직접 불가, 내부면은 스킴 무제한 → 공개면으로 내부에 닿은 뒤 내부면에서 file:// 사용, 방어의 비대칭
- 리스트형 subprocess는 각 원소가 argv 한 칸으로 직행 → 셸 메타문자 안 먹음, command injection 아님
- curl 다중 스킴: file://로 로컬 파일 읽기, 사용자 입력을 curl에 그대로 넘기면 파일읽기 증폭기

## 익스플로잇
preview 박스에:
```
/api/preview?url=http://admin:8080/health?url=file:///flag
```
- app이 `http://admin:8080/health?url=file:///flag`를 fetch (1단 SSRF)
- admin이 `curl file:///flag` 실행 (2단, 파일 읽기)
- curl 출력(flag) → admin 응답 → app preview 응답 → 화면

## flag
IHHH{st1ll_h4v3_qu3st10ns?:Habyr2tS}