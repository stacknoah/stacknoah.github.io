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

    // 프로젝트 연재의 세부 페이지. 폴더가 곧 소속이라 경로에 프로젝트 이름이 들어감
    {
      name: 'chapters',
      label: '연재 글',
      label_singular: '연재 글',
      folder: 'src/content/projects/ot-security',
      create: true,
      slug: '{{slug}}',
      extension: 'md',
      format: 'yaml-frontmatter',
      summary: '{{order}}. {{title}}',
      sortable_fields: ['order', 'date'],
      fields: [
        { name: 'title', label: '제목', widget: 'string' },
        { ...dateField, name: 'date', label: '날짜' },
        {
          name: 'order',
          label: '순번',
          widget: 'number',
          value_type: 'int',
          min: 1,
          hint: '프로젝트 차례에서 몇 번째 편인지',
        },
        { name: 'tags', label: '태그', widget: 'list', required: false, default: [] },
        attachments,
        { name: 'body', label: '본문', widget: 'markdown' },
      ],
    },
  ],
};

export const GET: APIRoute = () =>
  new Response(JSON.stringify(config, null, 2), {
    headers: { 'Content-Type': 'text/yaml; charset=utf-8' },
  });
