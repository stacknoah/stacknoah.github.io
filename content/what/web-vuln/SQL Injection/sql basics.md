---
title: SQL basics
date: 2026-07-15
draft: false
ShowToc: true
tags:
  - SQL Injection
  - Web
---

## 테이블 = 행·열

- DB는 스프레드시트 집합. 하나가 테이블(table)
- 열(column) = 필드, 행(row) = 레코드 하나

```
users 테이블
 idx │ username │ password
 ────┼──────────┼──────────
  1  │ admin    │ s3cr3t
  2  │ guest    │ guest
```

## SELECT: 읽기

- 구조: `SELECT 열 FROM 테이블 WHERE 조건`
- 해석: "이 테이블에서, 조건 맞는 행의, 이 열을 줘"

```sql
SELECT * FROM users WHERE username = 'admin'
```

- `*` = 모든 열 → `(idx, username, password)` 통째
- `WHERE` = 행 필터 (없으면 전체 행)
- 조건 없거나 항상 참이면 → 모든 행 반환 (`WHERE 1=1`)

## 결과가 앱으로 오는 법

- 앱은 커서(cursor)로 쿼리를 실행하고 결과를 읽음 (언어별 이름만 다름)

```python
cursor.execute(query)     # SQL을 DB에 보내 실행
row = cursor.fetchone()   # 결과 행 하나 꺼냄 → 튜플, 없으면 None
rows = cursor.fetchall()  # 결과 행 전부
```

- `SELECT *` 결과 행 → `row[0]=idx`, `row[1]=username`, `row[2]=password` (열 순서대로)
- 로그인 판정 = "조건 맞는 행이 있나(`row` 존재)"로 성공/실패 결정하는 게 흔한 패턴

## 문자열, 주석
- 문자열 리터럴 = 작은따옴표 `'...'`: 입력이 여기 들어감
- 주석: `-- `(뒤 공백 필수), `#`(MySQL), `/* */`(인라인)
- 주석은 "뒤 SQL 무효화"에 씀 → 원 쿼리의 나머지를 잘라냄

```sql
SELECT * FROM users WHERE username = 'admin'-- ' AND password = '...'
                                          └── 뒤가 주석 처리돼 사라짐
```

## 주요 구문

```sql
SELECT  ... 읽기        (데이터 유출의 주력)
INSERT  ... 행 추가
UPDATE  ... 행 수정
DELETE  ... 행 삭제
```

- 대부분 SQLi는 SELECT 문맥에서 데이터를 빼내는 것. INSERT/UPDATE 문맥이면 파괴적

## 왜 주입이 생기나

- 사용자 입력을 쿼리 문자열에 그대로 이어붙이면 발생 (문자열 결합 = source→sink)

```python
# 취약: 입력이 SQL 구조에 날것으로 박힘
query = "SELECT * FROM users WHERE username = '%s'" % user_input
query = f"... WHERE id = {user_input}"
query = "... '" + user_input + "'"
```

- 입력에 `'`를 넣으면 문자열을 탈출해 SQL 구조 자체를 조작 → 주입 성립
- 판별점: `'` 하나 넣어 에러/동작 변화 관찰

## 데이터 추출에 자주 쓰는 함수

```sql
SUBSTR(s, pos, len) / MID(s, pos, len)   문자열에서 일부 잘라내기
ASCII(c) / ORD(c)                        글자 → 숫자 코드
LENGTH(s)                                길이
CONCAT(a, b) / GROUP_CONCAT(col)         이어붙이기 / 여러 행 한 줄로
information_schema.tables / .columns     테이블·컬럼 이름 메타데이터
```

- 한 글자씩 빼낼 때: `ASCII(SUBSTR(password,1,1)) = 65` = "1번째 글자가 A냐"

## DBMS별 시그니처

```
MySQL       # 주석, SLEEP(), BENCHMARK(), LIMIT, information_schema
PostgreSQL  -- 주석, pg_sleep(), || 연결, :: 캐스팅
MSSQL       -- 주석, WAITFOR DELAY, + 연결, xp_cmdshell
SQLite      -- 주석, sqlite_master, SLEEP 없음
Oracle      dual 테이블, || 연결, UTL_HTTP
```

- 타겟 DBMS 파악이 먼저 → 문법·시간지연·메타데이터 경로가 갈림

## 방어

- Prepared statement(파라미터 바인딩): 입력을 "구조"가 아닌 "값"으로만 취급 → 근본 차단

```python
cursor.execute("SELECT * FROM users WHERE username = %s", (user_input,))
```

- ORM 사용, raw 쿼리 지양 / 최소권한 DB 계정 / 허용목록 검증
- 블랙리스트 필터는 보조: 우회 가능 (다음 노트 참고)

## 다음

- 기법 전체(인증 우회 / UNION / blind / error) → `sql injection` 노트
- UNION 실전 → `baby union` 노트
