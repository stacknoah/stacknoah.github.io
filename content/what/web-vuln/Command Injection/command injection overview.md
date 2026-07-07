---
title: Command Injcetion Overview
date: 2026-06-20
draft: false
tags:
  - Command Injection
ShowToc: true
---
## 1. 결함의 본질
입력을 시스템 명령어로 실행하게 하는 취약점 → 명령어 실행 함수에 이용자가 인자를 전달할 수 있을 때 발생  
→ 이용자의 입력 검사 필요(셸 메타문자(`;` `|` `&&` `` `$()`)로 명령어를 이어붙일 수 있음)
```

```

## 2. 공격 대상


## 3. 전제 조건


## 4. 공격 경로


## 5. 판별점
```python
# 위험 sink (셸 경유) → 인젝션 의심
os.system(cmd) # 항상 셸 경유
subprocess.*(cmd, shell=True) # shell=True면 셸 경유
subprocess.*(['/bin/sh','-c',cmd]) # 리스트여도 sh -c면 셸 경유
안전 → subprocess.*(['ping','-c',query]) # 명령/인자 분리, 셸 안 거침
```

## 6. 방어
