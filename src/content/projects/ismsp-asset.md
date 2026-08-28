---
title: ISMS-P 자산 식별
status: done
start: 2026-08-03
end: 2026-08-09
domain: it
summary: AWS 자산을 수집해 등급을 제안하고 자산관리대장을 뽑는 도구
repo: https://github.com/stacknoah/ismsp-asset
tags: [isms-p, aws]
---

- ISMS-P 인증기준 1.2.1은 모든 정보자산을 식별하고 중요도를 매겨 목록을 최신으로 유지하라고 요구
- 클라우드 자산은 분 단위로 생겼다 사라져 반기 실사로는 불충족
- boto3로 AWS를 훑어 자산 수집, 등급 제안과 자산관리대장과 갭 리포트 출력
- 인증 안내서의 10종 분류에 가상자원(머신이미지, 스냅샷, 컨테이너 이미지)을 더해 11종으로 분류
- 화이트햇 스쿨 4기 2인 팀, 판정과 출력 파트 담당
