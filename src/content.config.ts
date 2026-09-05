import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { CATEGORY_KEYS, DOMAIN_KEYS } from './lib/categories';
import { webSource } from './lib/daily';

// 첨부 파일. public/files/ 에 두고 여기서 가리킨다
const attachments = z
  .array(z.object({ file: z.string(), label: z.string().optional() }))
  .default([]);

// 글 대분류. 목록은 src/lib/categories.ts
const category = z.enum(CATEGORY_KEYS).optional();

// 공부 노트. 짧은 학습 기록
const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category,
    /** 로드맵의 어느 컬럼에 속하는지 */
    topic: z.string().optional(),
    tags: z.array(z.string()).default([]),
    description: z.string().optional(),
    attachments,
  }),
});

// 심층 글. 주제 하나를 길게 파는 글
const articles = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/articles' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    category,
    /** 로드맵의 어느 컬럼에 속하는지 */
    topic: z.string().optional(),
    tags: z.array(z.string()).default([]),
    description: z.string().optional(),
    attachments,
  }),
});

// 프로젝트 메타. 본문은 프로젝트 개요
// 글과 달리 domain(ot/it)만 씀. 프로젝트는 환경으로 갈리지 주제로 갈리지 않음
const projects = defineCollection({
  // 하위 폴더는 연재 세부 페이지(chapters)의 자리라 최상위만 줍는다
  loader: glob({ pattern: '*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    status: z.enum(['ongoing', 'done', 'paused']),
    start: z.coerce.date(),
    end: z.coerce.date().optional(),
    domain: z.enum(DOMAIN_KEYS).optional(),
    /** 홈에 띄울 프로젝트. true 로 표시한 것이 먼저 올라감 */
    featured: z.boolean().default(false),
    summary: z.string(),
    repo: z.string().url().optional(),
    tags: z.array(z.string()).default([]),
    /** 연재 차례. 순번이 chapters 의 order 와 맞물려서, 그 번호의
        세부 페이지를 올리면 차례에 저절로 링크가 걸린다.
        안 쓴 편은 흐린 계획으로 남는다 */
    series: z
      .array(
        z.object({
          title: z.string(),
          /** 한 줄 요지 */
          note: z.string().optional(),
        })
      )
      .optional(),
    attachments,
  }),
});

/** 프로젝트의 세부 페이지. src/content/projects/<프로젝트>/<글>.md
    경로가 곧 소속이라 별도 필드 없이 폴더 이름으로 프로젝트에 묶인다 */
const chapters = defineCollection({
  loader: glob({ pattern: '*/*.md', base: './src/content/projects' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    /** 연재에서 몇 번째인지. 프로젝트 frontmatter 의 series 순번과 맞물린다.
        CMS 의 select 가 문자열로 저장할 수 있어 coerce */
    order: z.coerce.number().int().positive(),
    tags: z.array(z.string()).default([]),
    attachments,
  }),
});

const optionalText = z.preprocess((value) => value === null || value === '' ? undefined : value, z.string().optional());
const daily = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/daily' }),
  schema: z.object({
    title: z.string().trim().min(1).max(300).regex(/^[^\r\n]+$/, '한 문장으로 입력해주세요'),
    date: z.coerce.date(),
    post: optionalText,
    sourceTitle: optionalText,
    sourceUrl: optionalText,
  }).superRefine((data, ctx) => {
    if (data.sourceUrl && !webSource(data.sourceTitle ?? '', data.sourceUrl, 'https://stacknoah.com')) {
      ctx.addIssue({ code: 'custom', path: ['sourceUrl'], message: 'http 또는 https 웹 주소를 입력해주세요' });
    }
  }),
});

export const collections = { notes, articles, projects, chapters, daily };
