# 로그인 중계소

`stacknoah.com/admin` 이 깃헙에 로그인할 때 거치는 곳. 한 번만 올려두면 끝.
사이트가 어디에 있든 상관없다. 이 워커는 따로 산다

## 1. 깃헙에 OAuth 앱 등록

github.com/settings/developers 에서 New OAuth App

| 칸 | 넣을 값 |
| --- | --- |
| Application name | 아무거나 (stacknoah admin) |
| Homepage URL | `https://stacknoah.com` |
| Authorization callback URL | 아래 2번에서 받은 주소 + `/callback` |

콜백 주소를 아직 모르니 일단 아무 값이나 넣고 등록한 뒤,
2번에서 주소를 받아 다시 고쳐 넣으면 된다.
Client ID 를 받아두고 Client secret 은 새로 만들어 복사해 둔다

## 2. 워커 올리기

프로젝트 어디서 실행해도 된다. `oauth-worker` 폴더로 들어갈 필요 없음

```bash
npm run auth:deploy
```

끝나면 `https://stacknoah-auth.<계정>.workers.dev` 같은 주소가 찍힌다.
이 주소 + `/callback` 을 1번의 콜백 칸에 넣는다

## 3. 비밀값 넣기

```bash
npm run auth:id
npm run auth:secret
```

각각 Client ID 와 Client secret 을 물어본다. 코드나 설정 파일에 적지 않는다

## 4. 주소 알려주기

`src/pages/admin/config.yml.ts` 의 `base_url` 을 2번에서 받은 주소로 고치고 push 한다

## 안 될 때

`Required Worker name missing` 이 뜨면 `oauth-worker` 밖에서 wrangler 를 직접 부른 것이다.
위의 `npm run auth:*` 를 쓰면 그럴 일이 없다
