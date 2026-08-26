// 글 대분류. 키가 frontmatter의 category 값, 값이 화면에 보이는 이름
// 분류 기준
//   특정 환경에서만 성립하면      -> ot 또는 it
//   환경을 안 가리는 보안 원리면  -> security
//   절차, 규제, 산출물이면        -> consulting
//   보안이 아닌 기반 지식이면     -> cs
// 둘에 걸치면 환경 특정성이 먼저. OT 진단 방법론은 consulting이 아니라 ot

export const CATEGORIES = {
  ot: 'OT',
  it: 'IT',
  consulting: 'Consulting',
  security: 'Security',
  cs: 'CS',
} as const;

export type CategoryKey = keyof typeof CATEGORIES;

export const CATEGORY_KEYS = Object.keys(CATEGORIES) as [CategoryKey, ...CategoryKey[]];

export function categoryLabel(key?: string): string | undefined {
  return key && key in CATEGORIES ? CATEGORIES[key as CategoryKey] : undefined;
}

// 프로젝트는 글과 축이 다름. 프로젝트에 "보안기초"나 "CS"가 붙을 일은 없어서
// 환경 둘만 씀
export const DOMAINS = {
  ot: 'OT',
  it: 'IT',
} as const;

export type DomainKey = keyof typeof DOMAINS;

export const DOMAIN_KEYS = Object.keys(DOMAINS) as [DomainKey, ...DomainKey[]];

export function domainLabel(key?: string): string | undefined {
  return key && key in DOMAINS ? DOMAINS[key as DomainKey] : undefined;
}
