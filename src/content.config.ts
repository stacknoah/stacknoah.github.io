import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { CATEGORY_KEYS, DOMAIN_KEYS } from './lib/categories';

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
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
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
    attachments,
  }),
});

// 프로젝트 진행 기록. project에 프로젝트 파일명(slug)을 적으면 해당 상세 페이지에 쌓임
const logs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/logs' }),
  schema: z.object({
    project: z.string(),
    date: z.coerce.date(),
    title: z.string(),
  }),
});

export const collections = { notes, articles, projects, logs };
