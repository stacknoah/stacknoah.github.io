---
title: XSS-1 (Dreamhack, B2)
draft: true
tags:
  - XSS
ShowToc: true
---
## 문제 분석
![XSS-1 경로](/uploads/xss1.png)
~~~
/vuln: 
	param = request.args.get("param", "")
    return param
    # 사용자 입력이 param으로 전달
    # check_xss에서 param 사용해서 url 정의
/flag: 
    if request.method == "GET":
        return render_template("flag.html")
    elif request.method == "POST":
        param = request.form.get("param")
        if not check_xss(param, {"name": "flag", "value": FLAG.strip()}):
            return '<script>alert("wrong??");history.go(-1);</script>'
        return '<script>alert("good");history.go(-1);</script>'
	# GET일 때 그냥 반환 
	# POST일 때도 그냥 반환하는거 아닌가? Reflected-XSS이려면 파라미터값을 넣어서 반환해야 하지 않나

/memo: 
~~~

## 취약점

## 공격

## 풀이

## 배운 점