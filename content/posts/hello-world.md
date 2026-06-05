+++
title = "첫 글: 블로그를 시작하며"
date = 2026-06-05T00:00:00+09:00
draft = false
tags = ["meta", "kaggle", "ml"]
categories = ["writeup"]
summary = "Hugo + PaperMod로 블로그를 세팅했다. 앞으로 ML/데이터사이언스 라이트업과 Kaggle 회고를 여기에 기록한다."
ShowToc = true
+++

## 왜 블로그

코드는 GitHub에, 생각은 여기에. 풀어둔 문제를 다시 들여다볼 자리가 필요했다.
완성도보다 **꾸준함**이 목표 — 일단 라이트업 한두 개부터 올리고 본다.

## 앞으로 다룰 것

- Kaggle 대회 회고 (시도한 것, 안 통한 것, 배운 것)
- ML 모델·실험 노트
- 그때그때 부딪힌 디버깅 기록

## 라이트업 템플릿

새 글은 아래로 만든다:

```bash
hugo new content posts/my-post.md
```

생성되면 `draft = true`라 로컬에서만 보인다. 다 쓰면 `false`로 바꾸고 push.

### 코드 블록 예시

```python
import pandas as pd

df = pd.read_csv("train.csv")
print(df.shape)
```

### 수식도 필요하면

문제 정의나 손실 함수 적을 때 KaTeX를 붙이면 되는데, 그건 첫 글 욕심내지 말고
실제로 필요할 때 설정 추가하자.

---

세팅 끝. 이제 글만 쓰면 된다.
