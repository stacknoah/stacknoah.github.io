---
title: "Source"
date: 2026-07-14
draft: true
ShowToc: true
---
0. 승리 조건 확인
   - flag 위치 + 획득 조건 파악
   - 당위: 찾을 싱크의 "종류"가 여기서 결정됨  
     RCE냐 / 파일읽기냐 / SQL이냐 / SSRF냐에 따라 grep 키워드가 완전히 달라짐

1. 싱크 찾기
   - 승리 조건에 대응하는 위험 함수만 grep  
     RCE   → exec, spawn, system, eval, `child_process`  
     파일  → open, readFile, include, sendFile  
     SQL   → query, raw, execute, f-string 쿼리  
     SSRF  → fetch, curl, requests, axios  
     역직렬화 → pickle, unserialize, yaml.load  
   - 당위: 승리 조건이 범위를 좁혀줘서 한 종류만 보면 됨
   - 프레임워크 기본 파일은 스킵, 출제자 커스텀 코드에만 존재

2. 싱크 → 소스 역추적 (taint tracking)
   - 싱크 인자부터 뒤로 한 홉씩: "이 값 어디서 옴? 내가 조종 가능?"
   - HTTP 입구(파라미터·헤더·바디)에 닿으면 = 경로 존재 확정
   - 당위: 목표(싱크)를 이미 아니까 거꾸로 가는 게 정방향보다 빠름

3. 문지기 우회
   - 역추적하며 만난 guard 전부 나열: 인증 / 입력검증 / 필터
   - 각각 "우회 가능?" 판정 = 문제의 몸통
   - 깨는 재료 3종: 프레임워크 버전 CVE / 로직 허점 / 불완전한 필터