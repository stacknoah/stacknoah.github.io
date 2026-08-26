---
title: SSRF와 인스턴스 메타데이터
date: 2026-08-21
category: it
tags: [web, aws]
---

예시 글. 지우고 직접 쓰면 됨

- 서버가 대신 요청을 보내주는 기능이 있으면 내부망 주소가 사정권에 들어옴
- 링크 로컬 주소는 인스턴스 안에서만 닿음. SSRF가 그 조건을 만들어 줌

```bash
# v1 여부만 확인. 자격증명 경로는 건드리지 않음
curl -s -o /dev/null -w '%{http_code}' http://169.254.169.254/latest/meta-data/
```

- 200이면 v1이 살아 있음, 401이면 v2 강제
