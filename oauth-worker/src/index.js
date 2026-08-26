// 관리자 화면이 깃헙에 로그인할 때 거치는 중계소.
// 정적 사이트에는 비밀키를 둘 곳이 없어서 이 작은 서버가 대신 토큰을 받아온다.
// 비밀키는 코드가 아니라 Cloudflare 비밀값으로 넣는다

const GITHUB_AUTH = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN = 'https://github.com/login/oauth/access_token';

function html(body) {
  return new Response(body, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

// 팝업이 부모 창에 토큰을 건네는 정해진 절차
function handshake(payload) {
  return html(`<!doctype html><meta charset="utf-8"><body><script>
  (function () {
    function receive(e) {
      window.opener.postMessage(
        'authorization:github:${payload.token ? 'success' : 'error'}:${JSON.stringify(payload).replace(/</g, '\\\\u003c')}',
        e.origin
      );
      window.removeEventListener('message', receive, false);
      window.close();
    }
    window.addEventListener('message', receive, false);
    window.opener.postMessage('authorizing:github', '*');
  })();
  </script>로그인 처리 중</body>`);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/auth') {
      // 되돌아올 때 위조를 걸러내려고 무작위 값을 쿠키에 심어둔다
      const state = crypto.randomUUID();
      const to = new URL(GITHUB_AUTH);
      to.searchParams.set('client_id', env.GITHUB_CLIENT_ID);
      to.searchParams.set('scope', url.searchParams.get('scope') || 'repo');
      to.searchParams.set('state', state);
      return new Response(null, {
        status: 302,
        headers: {
          Location: to.toString(),
          'Set-Cookie': `oauth_state=${state}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=600`,
        },
      });
    }

    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const cookie = (request.headers.get('Cookie') || '').match(/oauth_state=([^;]+)/);

      if (!code) return handshake({ message: '인가 코드가 없음' });
      if (!cookie || cookie[1] !== state) return handshake({ message: '상태값이 맞지 않음' });

      const res = await fetch(GITHUB_TOKEN, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });
      const data = await res.json();
      if (!data.access_token)
        return handshake({ message: data.error_description || '토큰을 받지 못함' });

      return handshake({ token: data.access_token, provider: 'github' });
    }

    return new Response('stacknoah auth', { status: 200 });
  },
};
