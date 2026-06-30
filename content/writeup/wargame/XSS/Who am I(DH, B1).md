---
title: "Who am I(DH, B1)"
date: 2026-06-24
draft: true
tags: ["XSS"]
ShowToc: true
---
/intro: 파라미터 2개 입력 받으면 화면에 그대로 표시해줌
	http://host3.dreamhack.games:22877/intro?name=guest&detail=hello
/report: 입력값 path에 저장 -> False일시 report.html 반환(fail msg)
	/intro?name=guest&detail=hello 입력하니까 Success 반환
	name, detail 변수에 값 저장한 다음에 access_page(name, detail) True -> Success 반환
access_page(): 어떤 부분을 참고해서 봐야하는지 잘 모르겠음
/whoami: if id가 'admin'일시 FLAG 반환해줌
	/intro?name=admin&detail=hello -> Success지만 FLAG 반환은 안해줌 
	-> detail에 들어갈 password를 찾아야 함
아무리 봐도 POST는 report밖에 없고, 여기에서 적절한 값을 입력해 그게 whoami에서 파싱되어야 함 -> /report에 /report?name=admin&detail=1234 입력해도 whoami에서 pw불일치하는듯
