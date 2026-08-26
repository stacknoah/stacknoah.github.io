import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const notes = await getCollection('notes');
  const articles = await getCollection('articles');

  const items = [
    ...notes.map((e) => ({
      title: e.data.title,
      pubDate: e.data.date,
      description: e.data.description ?? '',
      link: `/notes/${e.id}`,
    })),
    ...articles.map((e) => ({
      title: e.data.title,
      pubDate: e.data.date,
      description: e.data.description ?? '',
      link: `/articles/${e.id}`,
    })),
  ].sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime());

  return rss({
    title: 'stacknoah',
    description: '보안 컨설팅을 공부하며 쌓는 기록, IT와 OT',
    site: context.site,
    items,
  });
}
