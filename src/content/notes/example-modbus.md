---
title: Modbus 함수 코드와 진단 시 위험
date: 2026-08-24
category: ot
tags: [ics, protocol]
attachments:
  - file: files/modbus-function-codes.csv
    label: 함수 코드 정리표
---

예시 글. 지우고 직접 쓰면 됨

## 프레임 구조

```
RTU (직렬)   [주소 1B][함수코드 1B][데이터][CRC 2B]
TCP (502)    [MBAP 7B][함수코드 1B][데이터]
```

- TCP에는 CRC 없음. MBAP의 Length 필드로 프레임 경계를 정함
- 자격 증명 필드가 어느 쪽에도 없음. 연결되면 첫 프레임이 곧 명령

## 위험한 함수 코드

| 성격 | 코드 |
|---|---|
| 읽기 | 01, 02, 03, 04 |
| 쓰기 | 05, 06, 15, 16 |
| 진단 | 08 |

- 08의 서브 함수 0x0004는 응답을 멈춤. 읽기만 던진다고 안전하지 않음
