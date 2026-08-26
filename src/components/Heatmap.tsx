import type { CSSProperties } from 'react';

export interface HeatEntry {
  date: string; // YYYY-MM-DD
  title: string;
  kind: '노트' | '글' | '프로젝트';
  href?: string;
}

interface Props {
  entries: HeatEntry[];
  /** 몇 개월치를 보여줄지. 기본 6 */
  months?: number;
}

const DAY = 86400000;

/** CSS 사용자 지정 속성을 style 에 넣기 위한 우회 */
const vars = (o: Record<string, number | string>) => o as CSSProperties;

function parseYmd(s: string): Date {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** 서머타임이 있는 지역에서도 어긋나지 않게 반올림 */
function daysBetween(a: Date, b: Date): number {
  return Math.round((b.getTime() - a.getTime()) / DAY);
}

function mmdd(s: string): string {
  return s.slice(5).replace('-', '.');
}

const styles = `
/* 빈 날을 사각형으로 그리면 175개가 실제 기록 5개와 같은 무게로 싸운다.
   빈 날은 점으로 낮춰서 배경 하나로 그리고, 태그로 남는 건 글 쓴 날뿐이다.
   칸 크기를 고정하지 않고 폭을 따라가게 해서 미디어 쿼리도 가로 스크롤도 없다 */
.heatmap {
  position: relative;
  max-width: 42rem;
  /* 라벨 줄 점선 간격을 격자 열 간격에서 뽑기 위한 기준.
     cqw 를 못 쓰는 브라우저에서는 아래 값이 그대로 쓰인다 */
  --px: 24px;
  --dot: 1.5px;
}

/* 격자 열 간격을 실제 폭에서 계산한다. 분기점이 없으니 어긋날 구간도 없다 */
@supports (width: 1cqw) {
  .heatmap {
    container-type: inline-size;
    --px: calc(100cqw / var(--cols));
    --dot: calc(var(--px) * 0.075);
  }
}

/* 라벨 줄. 왼쪽 단어와 오른쪽 값 하나로 끝나는 완결된 줄이고,
   아래 격자에 가로 폭을 지정해준다 */
.heatmap .section-label {
  margin-bottom: 1.25rem;
}

/* 점 간격이 열 간격의 4분의 1이라 네 번째 점마다 아래 열 중앙에 떨어진다.
   오른쪽 끝을 기준으로 깔아야 위상이 격자와 맞는다.
   열 간격 그대로 찍으면 22px 간격이 되어 이어주는 선으로 안 읽힌다 */
.heatmap .lead {
  flex: 1 1 auto;
  min-width: 1.5rem;
  align-self: center;
  margin: 0 0.875rem;
  height: 2px;
  background-image: radial-gradient(
    circle at right center,
    var(--line-strong) 1px,
    transparent 1.5px
  );
  background-size: calc(var(--px) / 4) 2px;
  background-position: right center;
  background-repeat: repeat-x;
  opacity: 0.75;
}

.heatmap .tally {
  display: inline-flex;
  align-items: baseline;
  flex-shrink: 0;
}

/* 숫자와 단위를 같은 크기로 둬서 5편이 한 낱말로 붙는다.
   크기를 벌리면 한글 한 음절이 숫자 발치에 붙은 조각으로 보인다.
   차이는 색으로만 낸다 */
.heatmap .tally b {
  font-family: var(--font-mono);
  font-size: var(--t-7);
  font-weight: 500;
  letter-spacing: 0;
  color: var(--ink-2);
  font-variant-numeric: tabular-nums;
}

/* 고정폭 스택에 한글이 없다. 여기서 다시 잡지 않으면
   .section-label 의 고정폭을 물려받아 시스템 글꼴로 떨어진다 */
.heatmap .tally i {
  font-family: var(--font-sans);
  font-style: normal;
  font-size: var(--t-7);
  font-weight: 500;
  letter-spacing: var(--track-ko);
  color: var(--ink-3);
  margin-left: -0.02em;
}

/* 칸이 폭을 따라간다. aspect-ratio 덕에 폭이 얼마든 칸이 정사각형이다.
   요일 라벨을 없애서 라벨 줄, 격자, 월 눈금이 같은 세로선에서 시작한다 */
.heatmap .field {
  position: relative;
  width: 100%;
  aspect-ratio: var(--cols) / 7;
  background-image: radial-gradient(
    circle at center,
    var(--line-strong) var(--dot),
    transparent calc(var(--dot) + 0.5px)
  );
  background-size: calc(100% / var(--cols)) calc(100% / 7);
}

.heatmap .mark,
.heatmap .now,
.heatmap .ahead {
  position: absolute;
  left: calc(var(--c) * (100% / var(--cols)));
  top: calc(var(--r) * (100% / 7));
  width: calc(100% / var(--cols));
  height: calc(100% / 7);
}

.heatmap .mark {
  display: grid;
  place-items: center;
}

/* 78퍼센트다. 62퍼센트로 두면 다 채워졌을 때 사이가 벌어져
   덩어리로 안 뭉치고 흩어진 점점으로 보인다.
   하루 한 편도 제 무게를 갖게 두 번째 단계에서 시작한다 */
.heatmap .mark::before {
  content: '';
  width: 78%;
  aspect-ratio: 1;
  border-radius: 24%;
  background: var(--heat-2);
  transition: transform var(--out) var(--ease), background var(--out) ease;
}

.heatmap .lv2::before { background: var(--heat-3); }
.heatmap .lv3::before { background: var(--heat-4); }

.heatmap .mark:hover::before,
.heatmap .mark:focus-visible::before {
  transform: scale(1.14);
  background: var(--accent-strong);
  transition-duration: var(--in);
}

.heatmap .mark:focus-visible {
  outline: none;
}

/* 오늘 칸. 오른쪽 끝이 지금이라는 것만 알린다.
   오늘 기록이 있으면 이 칸은 마크가 대신한다 */
.heatmap .now {
  display: grid;
  place-items: center;
}

.heatmap .now::before {
  content: '';
  width: 78%;
  aspect-ratio: 1;
  border-radius: 24%;
  box-shadow: inset 0 0 0 1.5px var(--accent-mid);
}

/* 오늘 이후는 아직 오지 않은 날이라 점도 지운다 */
.heatmap .ahead {
  height: calc(var(--n) * (100% / 7));
  background: var(--bg);
}

/* 제목은 손이 닿을 때만. 쉬는 화면에 글자를 늘리지 않는다 */
.heatmap .tip {
  position: absolute;
  z-index: 5;
  top: calc(100% + 6px);
  left: 50%;
  transform: translate(-50%, 2px);
  width: max-content;
  max-width: 15rem;
  background: var(--ink);
  color: #fff;
  border-radius: 7px;
  padding: 0.4rem 0.6rem;
  font-size: var(--t-8);
  line-height: 1.5;
  word-break: keep-all;
  text-align: left;
  opacity: 0;
  pointer-events: none;
  box-shadow: 0 6px 20px rgba(0, 88, 85, 0.18);
  transition: opacity var(--out) ease, transform var(--out) var(--ease);
}

.heatmap .tip b {
  font-family: var(--font-mono);
  font-weight: 500;
  opacity: 0.65;
  margin-right: 0.3rem;
}

.heatmap .tip em {
  font-style: normal;
  opacity: 0.65;
  margin-left: 0.3rem;
}

.heatmap .mark:hover .tip,
.heatmap .mark:focus-visible .tip {
  opacity: 1;
  transform: translate(-50%, 0);
}

/* 양 끝 칸은 말풍선이 칸 밖으로 나가서 한쪽에 붙인다 */
.heatmap .mark.end .tip {
  left: auto;
  right: 0;
  transform: translate(0, 2px);
}

.heatmap .mark.end:hover .tip,
.heatmap .mark.end:focus-visible .tip {
  transform: translate(0, 0);
}

.heatmap .mark.start .tip {
  left: 0;
  transform: translate(0, 2px);
}

.heatmap .mark.start:hover .tip,
.heatmap .mark.start:focus-visible .tip {
  transform: translate(0, 0);
}

/* 월 눈금. 그 달이 시작하는 열에 왼쪽을 맞춘다 */
.heatmap .months {
  position: relative;
  height: 1rem;
  margin-top: 0.625rem;
}

.heatmap .months span {
  position: absolute;
  left: calc(var(--c) * (100% / var(--cols)));
  font-family: var(--font-sans);
  font-size: var(--t-8);
  font-weight: 500;
  letter-spacing: var(--track-ko);
  color: var(--ink-3);
  white-space: nowrap;
}

/* 오른쪽 끝에 붙는 달은 글자가 격자 밖으로 나가지 않게 오른쪽을 맞춘다 */
.heatmap .months span.tail {
  left: auto;
  right: 0;
}

@media (prefers-reduced-motion: reduce) {
  .heatmap .mark::before,
  .heatmap .tip {
    transition: none;
  }
}
`;

export default function Heatmap({ entries, months = 6 }: Props) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 창의 시작을 달 경계에 맞춘다. 6개월 전의 그 날이 아니라
  // months 개월 전 달 1일을 품은 일요일이다. 안 맞추면 첫 열이 토막 나서
  // 월 눈금만 한 칸 들여쓰기 된 것처럼 보인다
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth() - (months - 1), 1);
  const start = new Date(firstOfMonth);
  start.setDate(start.getDate() - start.getDay());

  const span = daysBetween(start, today); // 시작 일요일부터 오늘까지 며칠
  const cols = Math.floor(span / 7) + 1;

  // 날짜별로 묶는다. 창 밖 글은 격자에 안 그리고 누적 편수에만 들어간다
  const byDate = new Map<string, HeatEntry[]>();
  for (const e of entries) {
    const list = byDate.get(e.date);
    if (list) list.push(e);
    else byDate.set(e.date, [e]);
  }

  const marks: {
    key: string;
    col: number;
    row: number;
    level: number;
    items: HeatEntry[];
  }[] = [];

  for (const [date, items] of byDate) {
    const idx = daysBetween(start, parseYmd(date));
    if (idx < 0 || idx > span) continue;
    marks.push({
      key: date,
      col: Math.floor(idx / 7),
      row: idx % 7,
      level: Math.min(items.length, 3),
      items,
    });
  }
  marks.sort((a, b) => (a.key < b.key ? -1 : 1));

  const total = entries.length;

  // 오늘 이후는 아직 오지 않은 날이라 점도 지운다
  const todayRow = span % 7;
  const aheadCount = 6 - todayRow;
  const todayCol = Math.floor(span / 7);
  const todayDone = byDate.has(
    `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
      today.getDate(),
    ).padStart(2, '0')}`,
  );

  // 월 눈금. 그 달이 시작하는 주의 열에 왼쪽을 맞춘다
  const monthTicks: { col: number; label: string }[] = [];
  {
    const cursor = new Date(firstOfMonth);
    for (let i = 0; i < months; i++) {
      const idx = daysBetween(start, cursor);
      if (idx >= 0 && idx <= span) {
        monthTicks.push({ col: Math.floor(idx / 7), label: `${cursor.getMonth() + 1}월` });
      }
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  // 말풍선이 칸 밖으로 나가는 쪽을 서버에서 정한다. React 상태가 필요 없다
  const anchor = (col: number) => (col >= cols - 6 ? ' end' : col <= 5 ? ' start' : '');

  return (
    <div className="heatmap" style={vars({ '--cols': cols })}>
      <p className="section-label">
        activity
        {total > 0 && (
          <>
            <span className="lead" aria-hidden="true" />
            <span className="tally">
              <b>{total}</b>
              <i>편</i>
            </span>
          </>
        )}
      </p>

      <div className="field">
        {marks.map((m) => {
          const label = `${m.key}, ${m.items.length}편`;
          const cls = `mark lv${m.level}${anchor(m.col)}`;
          const style = vars({ '--c': m.col, '--r': m.row });
          const tip = (
            <span className="tip" aria-hidden="true">
              <b>{mmdd(m.key)}</b>
              {m.items[0].title}
              {m.items.length > 1 && <em>외 {m.items.length - 1}편</em>}
            </span>
          );
          const href = m.items[0].href;
          return href ? (
            <a key={m.key} className={cls} style={style} href={href} aria-label={label}>
              {tip}
            </a>
          ) : (
            <span key={m.key} className={cls} style={style} role="img" aria-label={label}>
              {tip}
            </span>
          );
        })}

        {!todayDone && (
          <span className="now" style={vars({ '--c': todayCol, '--r': todayRow })} aria-hidden="true" />
        )}

        {aheadCount > 0 && (
          <span
            className="ahead"
            style={vars({ '--c': todayCol, '--r': todayRow + 1, '--n': aheadCount })}
            aria-hidden="true"
          />
        )}
      </div>

      <div className="months" aria-hidden="true">
        {monthTicks.map((t) => (
          <span
            key={t.col}
            className={t.col > cols - 3 ? 'tail' : undefined}
            style={vars({ '--c': t.col })}
          >
            {t.label}
          </span>
        ))}
      </div>

      <style>{styles}</style>
    </div>
  );
}
