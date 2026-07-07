---
title: "Approach"
date: 2026-06-24
draft: true
ShowToc: true
---

## 고정 순서 (풀이 프로토콜)

0. 목표 좌표 (Objective)
flag 위치·조건. 도착지를 못 찍으면 공격 표면 전체를 헤맴. 끝점부터 역산.

1. 공격 표면 (Attack Surface)
통제 가능한 입력 전부. `endpoint × {query, body, header, cookie} × 인증여부`. 빠뜨린 입력 = 못 보는 공격로. 쿠키·헤더 빼먹는 게 초보 함정.

2. Source → Sink 추적 (Dataflow)
각 입력이 도달하는 위험 연산. 컨트롤러에서 멈추지 말고 헬퍼 끝까지. Sink 리스트 암기: `subprocess/os.system`, `eval/exec`, `open`, `pickle.loads`, SQL 문자열, `render_template_string`, 파일경로 조합.

3. 신뢰 경계 + 가설 (Trust & Hypotheses)
어떤 신뢰를 깨야 목표에 닿나. 후보 나열 + `가능성 × 목표근접도`로 우선순위. 가짜 검증 감별: `isinstance(x, str)`는 방어가 아니라 연극. 타입 검증 ≠ 내용 검증.

4. 최소 검증 (PoC Atom)
가장 유망한 가설을 관측 가능한 최소 단위로 확인. 한 번에 최종 페이로드 쏘지 말 것. "코드가 실행되긴 하나"부터. 실패 시 다음 후보.

5. 체인 (Chain)
단일로 미달이면 조각을 엮음. blind면 익스 전에 관측 채널부터 확보. 안 보이면 성공해도 성공한 줄 모름.