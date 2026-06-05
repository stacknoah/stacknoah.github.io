# Stacknoah Blog

Hugo + PaperMod 정적 블로그. GitHub Pages(무료) 자동 배포, 커스텀 도메인 `stacknoah.com`.

## 📦 이 폴더에 들어있는 것

```
stacknoah.github.io/
├── .github/workflows/hugo.yaml   # push 시 자동 빌드·배포 (Hugo 0.161.1, 공식 워크플로)
├── archetypes/default.md         # 새 글 템플릿
├── content/
│   ├── posts/hello-world.md      # 첫 글 (라이트업 템플릿 겸용)
│   ├── archives.md               # 아카이브 페이지
│   └── search.md                 # 검색 페이지
├── static/CNAME                  # 커스텀 도메인 (stacknoah.com)
├── hugo.toml                     # 사이트 설정 (한국어, GitHub 링크, 검색·TOC 등)
├── .gitmodules                   # PaperMod 테마 submodule 참조
├── setup.sh                      # 로컬 한 방 세팅 스크립트
└── .gitignore
```

테마(PaperMod)는 용량 문제로 포함하지 않았다. 아래 1단계에서 submodule로 받는다.

## 🚀 빠른 시작

### 0. Hugo 설치 (extended 버전)

| OS | 명령 |
|----|------|
| macOS | `brew install hugo` |
| Windows | `winget install Hugo.Hugo.Extended` |
| Linux | `sudo snap install hugo` 또는 [공식 릴리스](https://github.com/gohugoio/hugo/releases) tar |

### 1. 로컬 세팅 (자동)

이 폴더 안에서:

```bash
bash setup.sh
```

git 초기화 + PaperMod submodule 추가 + Hugo 확인까지 한 번에 한다.

> 수동으로 하려면:
> ```bash
> git init
> git submodule add --depth=1 https://github.com/adityatelange/hugo-PaperMod.git themes/PaperMod
> ```

### 2. 로컬 미리보기

```bash
hugo server -D     # http://localhost:1313  (-D: 초안 포함)
```

### 3. GitHub에 올리기

레포 이름은 **정확히** `stacknoah.github.io` 여야 user 사이트로 인식된다.

```bash
git add .
git commit -m "init blog"
git branch -M main
git remote add origin https://github.com/stacknoah/stacknoah.github.io.git
git push -u origin main
```

### 4. Pages 소스 설정

GitHub 레포 → **Settings → Pages → Source** 를 **GitHub Actions** 로 변경.
push하면 `Actions` 탭에서 빌드가 돌고, 끝나면 초록불 + 사이트 링크가 뜬다.
이 시점에 `https://stacknoah.github.io` 로 먼저 확인 가능하다.

### 5. 커스텀 도메인 연결 *(도메인 재활성화 확인된 뒤)*

`static/CNAME` 에 이미 `stacknoah.com` 이 들어있다. 나머지는 DNS:

**Namecheap → Advanced DNS → Host Records**
- A 레코드 4개 — Host `@`, Value:
  `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
- CNAME 1개 — Host `www`, Value `stacknoah.github.io.`
- 기존 parkingpage CNAME 있으면 삭제

그 다음 GitHub 레포 → **Settings → Pages → Custom domain** 에 `stacknoah.com` 입력 → Save.
DNS check 통과하면 **Enforce HTTPS** 체크.

## ✍️ 글 쓰기

```bash
hugo new content posts/my-writeup.md
```

생성된 글은 `draft = true` 라 로컬에서만 보인다. 다 쓰면 `false` 로 바꾸고 push → 자동 배포.

## 🔧 자주 만지는 곳

- 사이트 제목·소개·소셜 링크: `hugo.toml`
- 첫 화면 인사말: `hugo.toml` 의 `[params.homeInfoParams]`
- 메뉴 항목: `hugo.toml` 의 `[[menu.main]]`

테마 꾸미기는 나중에. 일단 라이트업부터 올려서 습관 잡는 게 우선.
