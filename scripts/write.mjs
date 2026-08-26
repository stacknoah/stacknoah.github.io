// 글쓰기 한 번에 켜기.
// 파일을 읽고 쓰는 쪽(decap-server, 8081)과 사이트를 보여주는 쪽(astro dev, 4321)을 같이 띄운다.
// 이미 떠 있는 것은 건드리지 않는다

import { spawn } from 'node:child_process';
import { createConnection } from 'node:net';

const kids = [];

function busy(port) {
  return new Promise((done) => {
    const sock = createConnection({ port, host: '127.0.0.1' });
    const finish = (v) => { sock.destroy(); done(v); };
    sock.setTimeout(400);
    sock.on('connect', () => finish(true));
    sock.on('timeout', () => finish(false));
    sock.on('error', () => finish(false));
  });
}

function run(cmd, args, name) {
  const kid = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'pipe'] });
  const tag = (buf) =>
    String(buf).split('\n').filter(Boolean).map((l) => `[${name}] ${l}\n`).join('');
  kid.stdout.on('data', (d) => process.stdout.write(tag(d)));
  kid.stderr.on('data', (d) => process.stderr.write(tag(d)));
  kid.on('exit', (code) => {
    // 스스로 죽은 경우에만 전체를 내린다. 정상 종료는 무시
    if (code && !stopping) {
      console.error(`\n[${name}] 꺼짐 (코드 ${code})`);
      stop();
    }
  });
  kids.push(kid);
}

let stopping = false;
function stop() {
  if (stopping) return;
  stopping = true;
  for (const k of kids) k.kill('SIGTERM');
  setTimeout(() => process.exit(0), 200);
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);

const [saveUp, siteUp] = await Promise.all([busy(8081), busy(4321)]);

if (saveUp) console.log('[저장] 이미 떠 있음');
else run('npx', ['decap-server'], '저장');

if (siteUp) console.log('[사이트] 이미 떠 있음');
else run('npx', ['astro', 'dev'], '사이트');

setTimeout(() => {
  console.log('\n  글쓰기   http://localhost:4321/admin/');
  console.log('  사이트   http://localhost:4321');
  console.log('\n  끄려면 Ctrl+C\n');
}, 2500);
