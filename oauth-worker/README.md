# 로그인 중계소

관리자 화면(`/admin`)이 깃헙에 로그인할 때 거치는 곳. 한 번만 올려두면 끝

## 1. 깃헙에 OAuth 앱 등록

github.com/settings/developers 에서 New OAuth App

- Homepage URL: `https://stacknoah.com`
- Authorization callback URL: `https://stacknoah-auth.<계정>.workers.dev/callback`

Client ID 와 Client secret 을 받아둔다

## 2. 올리기

```bash
cd oauth-worker
npx wrangler deploy
npx wrangler secret put GITHUB_CLIENT_ID
npx wrangler secret put GITHUB_CLIENT_SECRET
```

## 3. 주소 적어주기

배포된 주소를 `public/admin/config.yml` 의 `base_url` 에 적는다
