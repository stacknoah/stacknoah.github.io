---
title: "web-ssrf (DH, S2)"
date: 2026-06-30
draft: false
tags: ["SSRF"]
ShowToc: true
---
<!--
■ 고정 형식 규칙
1) 섹션은 항상 아래 5개. 이름·순서 고정. 해당 없으면 "—"로 비우되 칸은 지우지 않는다.
2) 제목에 '문제의 내용'(수신처·전송수단·도구명 등)을 올리지 않는다. 제목은 '사고의 단계'다.
3) '공격'은 [번호 흐름 → 페이로드 → 함정 → 핵심 당위] 순서 고정. ###로 쪼개지 않고 수단·검증은 번호 안에 녹인다.
■ 함정 = 실제로 빠진 막다른 길을 한 줄로. 당연히 먼저 해볼 법한데 막힌 것 → 왜 실패 → 어떻게 전환. 정답만 남기지 말 것. 여정 서사로 늘리지 말 것. 없으면 "—".
■ 당위는 단계마다 풀지 말고 '핵심 당위' 1개로 수렴. 깊은 당위는 별도 학습노트로.
-->

## TL;DR

- 취약점: (어디서 무엇이 터지나 — 한 줄)
- 핵심 트릭: (이 문제만의 급소/함정 — 다시 볼 때 가장 먼저 떠올릴 한 줄)
- 페이로드: `(최종 한 방)`

## 분석

```python 
try:
    FLAG = open("./flag.txt", "r").read()  # Flag is here!!

@app.route("/img_viewer", methods=["GET", "POST"])
def img_viewer():
    if request.method == "GET":
        return render_template("img_viewer.html")
    elif request.method == "POST":
        url = request.form.get("url", "")
        urlp = urlparse(url)
        if url[0] == "/":
            url = "http://localhost:8000" + url
        elif ("localhost" in urlp.netloc) or ("127.0.0.1" in urlp.netloc):
            data = open("error.png", "rb").read()
            img = base64.b64encode(data).decode("utf8")
            return render_template("img_viewer.html", img=img)
		try:
            data = requests.get(url, timeout=3).content
            # requests: 다른 서버로 요청 보낼 때 requests.get(url)
            # 검증 진행하지 않고 바로 보내 SSRF 취약점 발생
            # .content: 응답 본문을 바이트로 꺼내오는 속성
            img = base64.b64encode(data).decode("utf8")
        except:
            data = open("error.png", "rb").read()
            img = base64.b64encode(data).decode("utf8")
        return render_template("img_viewer.html", img=img)

local_host = "127.0.0.1"
local_port = random.randint(1500, 1800)
```
1. 항상 flag read/반환은 안 함 → 이 flag를 어떻게 내가 읽어낼 것인지가 이 문제의 핵심
2. 만약 /~처럼 상대경로로 접근 → localhost:8000 + url
3. 만약 localhost 입력 시도 -> 에러페이지 반환
4. try~: 접근해서 컨텐츠 가져온 뒤 render_template으로 반환
5. http://127.0.0.1:<1500~1800>/flag.txt: 이 경로에 flag 존재 
6. 어떻게 저 주소로 접근할 것인가? 그리고 포트는 어떻게 확정할 것인가?
7. 

| 대상 | 동작 |
|---|---|
|  |  |

## 취약점

<!-- 식별. "왜 뚫리나." 어디가 왜 약한지 1~2줄 + 이 문제의 급소 한 줄. -->

## 공격

<!-- 설계+실행. "어떻게 치나." 번호 흐름 하나로. 수단·검증은 번호 안에 녹인다(소제목 금지). -->

1. (단계)
2. (단계)  ← 필요할 때만 끝에 한 줄 당위
3. (단계)

```
(최종 페이로드 / 명령)
```

> 함정: (당연히 먼저 해볼 법한데 막힌 것 → 왜 실패 → 어떻게 전환. 1~2줄. 없으면 "—")
> 핵심 당위: (이 공격이 성립하는 단 하나의 이유. 1~2줄. 당위는 여기로 모은다.)

## 배운 점

<!-- 일반화. "다음에 어떻게 쓰나." 이 문제 → 재사용 원리로. 2~4개. -->
