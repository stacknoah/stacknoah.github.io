import type { APIRoute } from 'astro';
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

const config = {
  backend: {
    name: 'github',
    repo: 'stacknoah/stacknoah.github.io',
    branch: 'main',
    base_url: 'https://stacknoah-auth.stacknoah.workers.dev',
  },
  local_backend: true,
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
        attachments,
        { name: 'body', label: '개요', widget: 'markdown' },
      ],
    },
    {
      name: 'logs',
      label: '진행 기록',
      label_singular: '기록',
      description: '프로젝트에 날짜별로 쌓이는 기록',
      folder: 'src/content/logs',
      create: true,
      slug: '{{fields.project}}-{{year}}{{month}}{{day}}',
      extension: 'md',
      format: 'yaml-frontmatter',
      summary: '{{project}}  {{title}}',
      sortable_fields: ['date'],
      fields: [
        {
          name: 'project',
          label: '프로젝트',
          widget: 'relation',
          collection: 'projects',
          search_fields: ['title'],
          display_fields: ['title'],
          value_field: '{{slug}}',
        },
        dateField,
        { name: 'title', label: '기록 제목', widget: 'string' },
        { name: 'body', label: '내용', widget: 'markdown' },
      ],
    },
  ],
};

export const GET: APIRoute = () =>
  new Response(JSON.stringify(config, null, 2), {
    headers: { 'Content-Type': 'text/yaml; charset=utf-8' },
  });
