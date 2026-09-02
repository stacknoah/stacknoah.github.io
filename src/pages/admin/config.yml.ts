import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { roadmap } from '../../data/roadmap';
import { CATEGORIES } from '../../lib/categories';

// 관리자 화면 설정을 손으로 적지 않고 실제 데이터에서 만든다.
// 로드맵에 컬럼을 더하면 글쓰기 화면의 선택지도 같이 늘어난다.
// YAML 은 JSON 의 확장이라 JSON 을 그대로 내보내도 읽힌다

const categoryOptions = Object.entries(CATEGORIES).map(([value, label]) => ({ label, value }));

// 컬럼은 대분류 이름을 앞에 붙여 어디 것인지 바로 보이게
const topicOptions = roadmap.flatMap((g) =>
  g.categories.map((c) => ({
    label: `${CATEGORIES[g.category]} / ${c.name}`,
    value: c.name,
  }))
);

const attachments = {
  name: 'attachments',
  label: '첨부',
  label_singular: '파일',
  widget: 'list',
  required: false,
  collapsed: true,
  summary: '{{fields.label}}',
  fields: [
    { name: 'file', label: '파일', widget: 'file' },
    { name: 'label', label: '보일 이름', widget: 'string', required: false },
  ],
};

const dateField = {
  name: 'date',
  label: '날짜',
  widget: 'datetime',
  date_format: 'YYYY-MM-DD',
  time_format: false,
  picker_utc: true,
};

// 노트와 글이 같은 항목을 쓴다
const writingFields = [
  { name: 'title', label: '제목', widget: 'string' },
  dateField,
  {
    name: 'category',
    label: '대분류',
    widget: 'select',
    required: false,
    options: categoryOptions,
    hint: '로드맵 탭과 같은 다섯 갈래',
  },
  {
    name: 'topic',
    label: '컬럼',
    widget: 'select',
    required: false,
    options: topicOptions,
    hint: '로드맵에서 어느 칸에 들어가는지',
  },
  { name: 'tags', label: '태그', widget: 'list', required: false, default: [] },
  {
    name: 'description',
    label: '한 줄 요약',
    widget: 'string',
    required: false,
    hint: '목록에서 제목 아래 보임',
  },
  attachments,
  { name: 'body', label: '본문', widget: 'markdown' },
];

// 컬렉션을 뒤에서 더 밀어 넣으므로 느슨한 타입으로 둔다
const config: { backend: unknown; [k: string]: any; collections: any[] } = {
  backend: {
    name: 'github',
    repo: 'stacknoah/stacknoah.github.io',
    branch: 'main',
    base_url: 'https://stacknoah-auth.stacknoah.workers.dev',
  },
  local_backend: true,
  // 로그인 화면에 Decap 로고 대신 우리 마크
  logo_url: '/admin/logo.svg',
  locale: 'ko',
  media_folder: 'public/files',
  public_folder: '/files',
  collections: [
    {
      name: 'notes',
      label: '노트',
      label_singular: '노트',
      description: '짧게 정리한 기록',
      folder: 'src/content/notes',
      create: true,
      slug: '{{slug}}',
      extension: 'md',
      format: 'yaml-frontmatter',
      summary: '{{title}}',
      sortable_fields: ['date', 'title'],
      view_groups: [{ label: '대분류', field: 'category' }],
      fields: writingFields,
    },
    {
      name: 'articles',
      label: '글',
      label_singular: '글',
      description: '주제 하나를 길게 판 글',
      folder: 'src/content/articles',
      create: true,
      slug: '{{slug}}',
      extension: 'md',
      format: 'yaml-frontmatter',
      summary: '{{title}}',
      sortable_fields: ['date', 'title'],
      view_groups: [{ label: '대분류', field: 'category' }],
      fields: writingFields,
    },
    {
      name: 'projects',
      label: '프로젝트',
      label_singular: '프로젝트',
      folder: 'src/content/projects',
      create: true,
      slug: '{{slug}}',
      extension: 'md',
      format: 'yaml-frontmatter',
      summary: '{{title}}',
      sortable_fields: ['start', 'title'],
      view_groups: [{ label: '상태', field: 'status' }],
      fields: [
        { name: 'title', label: '이름', widget: 'string' },
        {
          name: 'status',
          label: '상태',
          widget: 'select',
          default: 'ongoing',
          options: [
            { label: '진행 중', value: 'ongoing' },
            { label: '완료', value: 'done' },
            { label: '중단', value: 'paused' },
          ],
        },
        { ...dateField, name: 'start', label: '시작일' },
        { ...dateField, name: 'end', label: '종료일', required: false },
        {
          name: 'domain',
          label: '환경',
          widget: 'select',
          required: false,
          options: [
            { label: 'IT', value: 'it' },
            { label: 'OT', value: 'ot' },
          ],
        },
        {
          name: 'featured',
          label: '홈에 띄우기',
          widget: 'boolean',
          default: false,
          required: false,
          hint: '켜면 첫 화면 프로젝트 칸에 올라감',
        },
        { name: 'summary', label: '한 줄 소개', widget: 'string' },
        { name: 'repo', label: '저장소 주소', widget: 'string', required: false },
        { name: 'tags', label: '태그', widget: 'list', required: false, default: [] },
        {
          name: 'series',
          label: '연재 차례',
          label_singular: '편',
          widget: 'list',
          required: false,
          summary: '{{fields.title}}',
          hint: '순번이 세부 페이지의 order 와 맞물림. 그 번호의 글을 올리면 저절로 링크가 걸림',
          fields: [
            { name: 'title', label: '제목', widget: 'string' },
            { name: 'note', label: '한 줄 요지', widget: 'string', required: false },
          ],
        },
        attachments,
        { name: 'body', label: '개요', widget: 'markdown' },
      ],
    },

  ],
};

// 연재 차례가 있는 프로젝트마다 글쓰기 메뉴가 하나씩 생긴다.
// 순번은 숫자 입력이 아니라 차례에서 편을 고르는 선택지다.
// 프로젝트에 series 를 더하면 여기 손대지 않아도 메뉴가 따라 생긴다
const projects = await getCollection('projects');
for (const pr of projects) {
  const series = pr.data.series;
  if (!series || series.length === 0) continue;
  config.collections.push({
    name: `chapters_${pr.id.replace(/[^a-z0-9]/gi, '_')}`,
    label: `연재 · ${pr.data.title}`,
    label_singular: '편',
    folder: `src/content/projects/${pr.id}`,
    create: true,
    // 파일과 주소가 순번을 따른다. /projects/<프로젝트>/<순번>
    slug: '{{fields.order}}',
    extension: 'md',
    format: 'yaml-frontmatter',
    summary: '{{order}}. {{title}}',
    sortable_fields: ['order', 'date'],
    fields: [
      {
        name: 'order',
        label: '어느 편인지',
        widget: 'select',
        options: series.map((c, i) => ({ label: `${String(i + 1).padStart(2, '0')}  ${c.title}`, value: i + 1 })),
        hint: '차례에서 고르면 그 자리에 링크가 걸림',
      },
      {
        name: 'title',
        label: '제목',
        widget: 'string',
        hint: '차례의 제목과 달라도 됨. 여기 적는 것이 실제 글 제목',
      },
      { ...dateField, name: 'date', label: '날짜' },
      { name: 'tags', label: '태그', widget: 'list', required: false, default: [] },
      attachments,
      { name: 'body', label: '본문', widget: 'markdown' },
    ],
  });
}

export const GET: APIRoute = () =>
  new Response(JSON.stringify(config, null, 2), {
    headers: { 'Content-Type': 'text/yaml; charset=utf-8' },
  });
