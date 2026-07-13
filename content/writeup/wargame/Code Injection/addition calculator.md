---
title: "Addition Calculator(DH, S3)"
date: 2026-07-07
draft: false
ShowToc: true
---

## TL;DR
- 취약점: `/` POST가 사용자 입력 `formula`를 `eval()`에 그대로 넘김 → 임의 파이썬 코드 실행(RCE). 유일한 방어막은 `filter()` 하나임.
- 트릭: 필터가 문자 화이트리스트(영문·숫자·공백·`. ( ) +`)라 따옴표·언더스코어·대괄호·콤마가 전부 막힘 → 문자열 리터럴 불가. 허용 문자만으로 문자열을 합성하는 유일 수단이 `chr(n)+chr(n)+...`임.
- 페이로드: `open(chr(102)+chr(108)+chr(97)+chr(103)+chr(46)+chr(116)+chr(120)+chr(116)).read()`

## 흐름
| 경로 | 입력 | 통제주체 | 역할 |
|---|---|---|---|
| / (GET) | - | - | 입력 폼 |
| / (POST) | formula (form) | 공격자 | filter 통과 시 eval(formula) 실행 → 결과 렌더 → sink |

flag.txt는 app.py와 같은 경로에 존재함.

## 익스플로잇

### sink
```python
if filter(formula): return "Filtered"
else: formula = eval(formula)   # 사용자 입력을 코드로 실행
```
`eval(formula)`가 사용자 입력을 그대로 실행하므로, 필터만 뚫으면 서버에서 임의 코드가 도는 RCE임. 즉 이 문제 전체가 "filter 우회" 하나로 환원됨.

### 제약 정리
필터가 허용과 금지를 아주 명확히 그어놔서, 뭐가 되고 안 되는지가 곧 풀이를 규정.
- 허용 문자: 영문 대소문자, 숫자, 공백, `.` `(` `)` `+`
- 금지 단어: system, curl, flag, subprocess, popen (대소문자 무관)
- eval이므로 표현식만 가능(문장·대입 불가)

### 제약이 강제하는 결론
- 따옴표가 없음 → 문자열 리터럴을 못 만듦 → 파일명 "flag.txt"를 직접 타이핑 불가.
- 인코딩(base64·hex·bytes)도 결국 인코딩된 데이터를 따옴표나 콤마·대괄호로 적어야 하므로 전부 막힘.
- 그래서 남는 유일한 문자열 합성법이 `chr(정수)`를 `+`로 잇는 것. 허용 문자만 쓰고, 금지어 flag도 숫자로 만들어 정규식 매치를 회피함.
- 파일 읽기 함수 `open`은 내장이자 금지어 아님이자 전부 영문자라 필터 통과. `.read()`로 내용을 꺼냄.

### 페이로드 조립
"flag.txt"를 글자별 아스키 코드로 합성.
```
f=102  l=108  a=97  g=103  .=46  t=116  x=120  t=116
```
```
open(chr(102)+chr(108)+chr(97)+chr(103)+chr(46)+chr(116)+chr(120)+chr(116)).read()
```
eval이 이걸 실행하면 파일 내용이 반환되어 result로 렌더.
- 제출: POST / (form의 formula) | 회수: 응답의 result

## 함정 & 판별점
- 함정: `except subprocess.CalledProcessError`가 "명령 실행이 정답"인 듯 유도하지만, 실제론 `open().read()`로 파일을 직접 읽는 편이 더 짧음. 금지어 flag도 직접 타이핑만 피하면 chr 합성으로 통과함.
- 판별점: `eval`/`exec`에 사용자 입력이 닿으면 pyjail. 화이트리스트 필터를 만나면 "막힌 것"이 아니라 "남은 문자"를 세서 가능한 표현을 역산함. 따옴표가 막히면 `chr()+`가 문자열 합성의 최후 수단임.