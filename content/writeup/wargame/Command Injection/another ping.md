---
title: "Another Ping (DH, B2)"
date: 2026-07-07
draft: false
tags: ["Command Injection"]
ShowToc: true
---

## TL;DR
- 취약점: `/ping`이 `ip`를 `subprocess.run(f"ping -c 4 {ip}", shell=True)`에 삽입 → Command Injection. stdout/stderr 반환 = non-blind
- 트릭: 정규식 검증 `is_valid_ip`는 정의만 되고 호출 안 됨(dead code). 블랙리스트만 작동 → 백틱(`$()` 대체) + bare `$IFS`(`${IFS}` 대체)로 우회
- 페이로드:
```
`cat$IFS/app/flag.txt`
```

## 흐름
| 경로 | 입력 | 통제주체 | 역할 |
|---|---|---|---|
| / | - | - | 메인 |
| /ping | ip (POST form) | 공격자 | filter_input 후 shell 실행 → sink |

단일 행위자, non-blind → 다이어그램 불필요.

## 익스플로잇
```python
FILTERED_CHARS = [' ',';','|','&','>','<','(',')','[',']','{','}','\n','\r']
# is_valid_ip(정규식) 정의됨 → 호출 안 됨(dead code) → 형식검증 미적용
cmd = f"ping -c 4 {ip}"
subprocess.run(cmd, shell=True, capture_output=True, text=True)   # stdout/stderr 반환
```
생존 문자: 백틱, `$`, `/`, `.`, 문자·숫자.
1. 명령 실행 — `()` 막힘 → 백틱 치환
2. 공백 — space·`${IFS}` 막힘(`{}` 필터) → bare `$IFS` + 뒤를 `/`로 끊기
3. exfil — non-blind → flag를 ping 인자로 실어 실패시킴 → stderr에 `ping: DH{...}: Name or service not known`
4. 경로 — `/deploy/flag.txt`(로컬 경로) 실패 → `` `pwd` ``로 cwd=`/app` 확인 → `/app/flag.txt`
- 제출: POST /ping (form `ip`)  |  회수: 응답 JSON `stderr`
```
ip=`cat$IFS/app/flag.txt`
```

## 함정 & 판별점
- 삽질: `is_valid_ip`가 도는 줄 알았으나 dead code / `/deploy/flag.txt` 로컬 경로 가정 실패(stderr가 "No such file"로 알려줌) / `$IFS` 뒤에 문자 오면(`$IFSflag`) 변수명에 먹혀 깨짐
- 판별점: 블랙리스트 필터는 "막힌 것" 말고 "생존 문자"를 세라. 정의된 검증 함수가 실제로 호출되는지 확인(정의 ≠ 실행). `${IFS}` 막히면 bare `$IFS` + non-변수명 구분자(`/`·`-`·`.`)