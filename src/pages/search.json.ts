import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { categoryLabel, domainLabel } from '../lib/categories';

// 마크다운에서 본문 글자만 남김. 코드블록과 표 기호는 검색에 방해라 걷어냄
function plain(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`\n]*`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^[>\-*+]\s+/gm, '')
    .replace(/[|*_~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 2000);
}

export const GET: APIRoute = async () => {
  const [notes, articles, projects, chapters] = await Promise.all([
    getCollection('notes'),
    getCollection('articles'),
    getCollection('projects'),
    getCollection('chapters'),
  ]);

  const docs = [
    ...notes.map((e) => ({
      url: `/notes/${e.id}`,
      kind: '노트',
      title: e.data.title,
      category: categoryLabel(e.data.category) ?? '',
      tags: e.data.tags,
      desc: e.data.description ?? '',
      text: plain(e.body ?? ''),
    })),
    ...articles.map((e) => ({
      url: `/articles/${e.id}`,
      kind: '글',
      title: e.data.title,
      category: categoryLabel(e.data.category) ?? '',
      tags: e.data.tags,
      desc: e.data.description ?? '',
      text: plain(e.body ?? ''),
    })),
    ...projects.map((e) => ({
      url: `/projects/${e.id}`,
      kind: '프로젝트',
      title: e.data.title,
      category: domainLabel(e.data.domain) ?? '',
      tags: e.data.tags,
      desc: e.data.summary,
      text: plain(e.body ?? ''),
    })),
    ...chapters.map((e) => ({
      url: `/projects/${e.id}`,
      kind: '연재',
      title: e.data.title,
      category: '',
      tags: e.data.tags,
      desc: '',
      text: plain(e.body ?? ''),
    })),
  ];

  return new Response(JSON.stringify(docs), {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
};
