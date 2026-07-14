---
title: grep
date: 2026-07-14
draft: false
ShowToc: true
tags:
  - CS
  - System
---

## grep이란

파일 안에서 패턴에 맞는 줄을 찾아 출력하는 도구. 코드 감사의 주력 무기 — 소스에서 싱크(위험 함수)·소스(입력 진입점)·시크릿을 위치시키는 1차 도구

골격

```
grep [옵션] "패턴" [검색할 경로]
```

경로 안 주면 stdin 대기하며 멈춤 → 경로 필수

## 자주 쓰는 플래그

이 8개로 대부분 커버

```
-r      하위 폴더까지 재귀
-n      매칭 줄번호 표시 (파일:줄번호 로 점프)
-i      대소문자 무시
-E      확장 정규식 ( | ( ) { } + 를 특수문자로 인식)
-w      단어 단위 매칭 (exec 검색 시 execute 제외)
-l      매칭된 파일 이름만
-c      파일별 매칭 개수만
-o      매칭된 부분만 출력 (줄 전체 말고)
```

플래그 묶어쓰기 가능 → `-r -n -E` = `-rnE`

- 값 받는 옵션(`-A 3` 등)은 묶음 맨 뒤에
- 긴 옵션(`--include`)은 못 묶음

## 범위 좁히기

노이즈(node_modules·소스맵 등) 제거가 핵심

```
--include="*.ts"              특정 확장자만
--exclude-dir=node_modules    특정 폴더 제외
-A 3    매칭 줄 + 아래 3줄 (after)
-B 3    매칭 줄 + 위 3줄 (before)
-C 3    매칭 줄 + 위아래 3줄 (context)
```

## 정규식 최소 지식

`-E`와 함께

```
|      또는          exec|system
()     그룹          (get|post)Handler
.      임의 문자 1개
.*     임의 문자 0개+
\(     괄호 문자 자체 (특수의미 끄기 = 이스케이프)
^ $    줄 시작 / 끝
```

`exec` 대신 `exec\(` 로 검색하는 이유 = `execute` `execution` 같은 무관 단어 제거, 함수 호출부만 정밀 타격

## 실전 패턴 (코드 감사)

```bash
# 싱크 사냥 (RCE 계열 위험 함수)
grep -rnE "exec\(|system|eval|spawn|child_process" src --include="*.js"

# 소스 사냥 (사용자 입력 진입점)
grep -rnE "req\.(query|body|params)|request\.args" .

# 서버 발신 요청 (SSRF 발판)
grep -rnE "fetch\(|axios|http\.request|curl|wget" . --include="*.ts"

# 하드코딩 시크릿
grep -rniE "password|secret|api_key|token" . --include="*.env*"

# 함수 호출부 추적 (reachability)
grep -rn "doRequest" .

# 매칭 줄 맥락까지 (앞뒤 검증 로직 같이 보기)
grep -rn -C 5 "exec\(" app
```

원칙 = grep 결과는 후보 목록일 뿐. 뜬 줄마다 "여기 들어가는 값 중 내가 조종하는 게 있나(taint)" 확인해야 진짜 싱크

낯선 코드일수록 좁게 찍지 말고, 이미 관찰한 조각(예: `prisma.api`)을 앵커로 넓게 긁은 뒤 결과를 눈으로 필터

## zsh 따옴표 함정

zsh는 `*` 낀 인자를 grep에 넘기기 전에 자기가 먼저 확장 시도 → 매칭 없으면 `no matches found` 에러

```
--include=*.ts     → zsh가 * 확장 → 에러
--include="*.ts"   → 따옴표로 감싸 grep에 그대로 전달 (해결)
```

`*` 낀 옵션은 항상 따옴표

## ripgrep (rg) 대안

현업 로컬 감사는 `rg`가 표준 — 훨씬 빠르고 `.gitignore`·`node_modules` 자동 무시, 기본이 재귀

```bash
rg "exec\(" -t ts        # -t ts = 타입스크립트만, --include 불필요
rg -C 5 "exec\("         # 맥락 포함
```

설치 = `brew install ripgrep`

grep을 버리지 않는 이유 = 침투한 원격 서버·제한 셸엔 rg 없음. grep·awk·sed·find는 어느 리눅스에나 있는 기본 생존 장비. 로컬은 rg, 원격은 grep
