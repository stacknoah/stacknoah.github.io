import { useEffect, useMemo, useRef, useState } from 'react';

export interface HeatEntry {
  date: string; // YYYY-MM-DD
  title: string;
  kind: '노트' | '글' | '프로젝트';
}

interface Props {
  entries: HeatEntry[];
  /** 몇 개월치를 보여줄지. 기본 12 */
  months?: number;
}

const DAY_LABELS = ['', '월', '', '수', '', '금', ''];

function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function level(count: number): number {
  if (count <= 0) return 0;
  if (count >= 4) return 4;
  return count;
}

export default function Heatmap({ entries, months = 12 }: Props) {
  // 기간이 짧을수록 칸을 키워 같은 폭을 채움
  const CELL = months <= 4 ? 18 : months <= 7 ? 16 : 14;
  const GAP = months <= 8 ? 4 : 3;
  const GUTTER = 28;
  const [tip, setTip] = useState<{ x: number; y: number; date: string; items: HeatEntry[] } | null>(null);

  const { weeks, monthTicks, byDate, stats } = useMemo(() => {
    const byDate = new Map<string, HeatEntry[]>();
    for (const e of entries) {
      const list = byDate.get(e.date) ?? [];
      list.push(e);
      byDate.set(e.date, list);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(today);
    start.setMonth(start.getMonth() - months);
    start.setDate(start.getDate() + 1);
    start.setDate(start.getDate() - start.getDay()); // 시작 주의 일요일로

    const weeks: { date: Date; key: string }[][] = [];
    const cursor = new Date(start);
    while (cursor <= today) {
      const week: { date: Date; key: string }[] = [];
      for (let i = 0; i < 7 && cursor <= today; i++) {
        week.push({ date: new Date(cursor), key: ymd(cursor) });
        cursor.setDate(cursor.getDate() + 1);
      }
      weeks.push(week);
    }

    const monthTicks: { col: number; label: string }[] = [];
    let prevMonth = -1;
    weeks.forEach((week, col) => {
      const m = week[0].date.getMonth();
      if (m !== prevMonth) {
        if (week[0].date.getDate() <= 14 || col === 0) {
          monthTicks.push({ col, label: `${m + 1}월` });
        }
        prevMonth = m;
      }
    });

    // 겹치지 않는 값으로. 전체 누적은 계속 늘고, 30일은 지금 속도, 연속은 습관
    const total = entries.length;


    let streak = 0;
    const probe = new Date(today);
    const todayDone = byDate.has(ymd(today));
    if (!todayDone) probe.setDate(probe.getDate() - 1);
    while (byDate.has(ymd(probe))) {
      streak++;
      probe.setDate(probe.getDate() - 1);
    }


    return { weeks, monthTicks, byDate, stats: { total, streak, todayDone } };
  }, [entries, months]);

  const gridWidth = weeks.length * (CELL + GAP) - GAP;

  // 좁은 화면에서는 최근 기록이 있는 오른쪽 끝부터 보이게
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  return (
    <div className="heatmap">
      <div className="stats">
        <span className="stat">
          <span className="lab">전체</span>
          <span className="num">{stats.total}</span>
          <span className="unit">편</span>
        </span>
        <span className="stat">
          <span className="lab">연속</span>
          <span className="num">{stats.streak}</span>
          <span className="unit">일</span>
          {stats.todayDone && <i className="live" aria-label="오늘도 기록함" />}
        </span>
      </div>

      <div className="scroll" ref={scrollRef}>
        <div style={{ width: gridWidth + GUTTER }}>
          <div className="month-row" style={{ paddingLeft: GUTTER }}>
            {monthTicks.map((m, i) => {
              const next = monthTicks[i + 1];
              const span = (next ? next.col : weeks.length) - m.col;
              return (
                <span key={m.col} style={{ width: span * (CELL + GAP) }}>
                  {m.label}
                </span>
              );
            })}
          </div>

          <div className="grid-wrap">
            <div className="day-col mono">
              {DAY_LABELS.map((label, i) => (
                <span key={i} style={{ height: CELL, lineHeight: `${CELL}px` }}>
                  {label}
                </span>
              ))}
            </div>

            <div
              className="grid"
              role="img"
              aria-label={`최근 ${months}개월 기록 히트맵, 기록 ${stats.total}개`}
              onMouseLeave={() => setTip(null)}
            >
              {weeks.map((week, wi) => (
                <div className="week" key={wi}>
                  {week.map((cell) => {
                    const items = byDate.get(cell.key) ?? [];
                    return (
                      <div
                        key={cell.key}
                        className={`cell heat-${level(items.length)}`}
                        onMouseEnter={() =>
                          setTip({
                            x: GUTTER + wi * (CELL + GAP),
                            y: cell.date.getDay() * (CELL + GAP),
                            date: cell.key,
                            items,
                          })
                        }
                      />
                    );
                  })}
                </div>
              ))}

              {tip && (
                <div
                  className="tooltip"
                  style={{
                    left: Math.min(tip.x, gridWidth - 150),
                    top: tip.y + CELL + 8,
                  }}
                >
                  <div className="tip-date mono">{tip.date}</div>
                  {tip.items.length === 0 ? (
                    <div className="tip-empty">기록 없음</div>
                  ) : (
                    tip.items.slice(0, 4).map((item, i) => (
                      <div key={i} className="tip-item">
                        <span className="tip-kind">{item.kind}</span> {item.title}
                      </div>
                    ))
                  )}
                  {tip.items.length > 4 && (
                    <div className="tip-empty">외 {tip.items.length - 4}개</div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="legend">
            <span>적게</span>
            {[0, 1, 2, 3, 4].map((l) => (
              <span key={l} className={`cell heat-${l}`} />
            ))}
            <span>많이</span>
          </div>
        </div>
      </div>

      <style>{`
        .heatmap { position: relative; }
        /* 라벨을 앞에 두고 한 줄로. 숫자 아래 캡션을 달면 활자가 겉돈다 */
        .heatmap .stats {
          display: flex;
          flex-wrap: wrap;
          align-items: baseline;
          gap: 0.5rem 2.5rem;
          margin-bottom: 2rem;
        }
        .heatmap .stat {
          display: inline-flex;
          align-items: baseline;
          gap: 0.4rem;
        }
        .heatmap .lab {
          font-size: var(--t-7);
          font-weight: 500;
          letter-spacing: var(--track-ko);
          color: var(--ink-3);
        }
        .heatmap .num {
          font-size: var(--t-2);
          font-weight: 500;
          line-height: 1;
          letter-spacing: var(--track-2);
          color: var(--ink);
          font-variant-numeric: lining-nums proportional-nums;
        }
        .heatmap .unit {
          font-size: var(--t-6);
          font-weight: 500;
          color: var(--ink-3);
          margin-left: -0.15rem;
        }
        /* 오늘도 기록했을 때만 켜지는 점 */
        .heatmap .live {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: var(--accent);
          align-self: center;
          margin-left: 0.1rem;
        }
        .heatmap .scroll { overflow-x: auto; padding-bottom: 4px; }
        .heatmap .month-row {
          display: flex;
          font-size: 0.625rem;
          color: var(--ink-3);
          margin-bottom: 4px;
        }
        .heatmap .month-row span { display: inline-block; }
        .heatmap .grid-wrap { display: flex; }
        .heatmap .day-col {
          display: flex;
          flex-direction: column;
          gap: ${GAP}px;
          width: 28px;
          font-size: 0.625rem;
          color: var(--ink-3);
        }
        .heatmap .grid {
          position: relative;
          display: flex;
          gap: ${GAP}px;
        }
        .heatmap .week {
          display: flex;
          flex-direction: column;
          gap: ${GAP}px;
        }
        .heatmap .cell {
          width: ${CELL}px;
          height: ${CELL}px;
          border-radius: 2.5px;
          flex-shrink: 0;
        }
        .heatmap .grid .cell:hover {
          outline: 1.5px solid var(--accent);
          outline-offset: 1px;
        }
        .heatmap .heat-0 { background: var(--heat-0); }
        .heatmap .heat-1 { background: var(--heat-1); }
        .heatmap .heat-2 { background: var(--heat-2); }
        .heatmap .heat-3 { background: var(--heat-3); }
        .heatmap .heat-4 { background: var(--heat-4); }
        .heatmap .tooltip {
          position: absolute;
          z-index: 10;
          background: var(--ink);
          color: #fff;
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          font-size: 0.75rem;
          line-height: 1.5;
          width: max-content;
          max-width: 220px;
          pointer-events: none;
          box-shadow: 0 6px 20px rgba(0, 88, 85, 0.22);
          animation: tip-in 0.12s ease;
        }
        @keyframes tip-in {
          from {
            opacity: 0;
            transform: translateY(2px);
          }
        }
        .heatmap .tip-date { opacity: 0.7; font-size: 0.6875rem; }
        .heatmap .tip-kind { opacity: 0.7; font-size: 0.6875rem; margin-right: 2px; }
        .heatmap .tip-empty { opacity: 0.7; }
        .heatmap .legend {
          display: flex;
          align-items: center;
          gap: ${GAP}px;
          justify-content: flex-end;
          margin-top: 8px;
          font-size: 0.625rem;
          color: var(--ink-3);
        }
        .heatmap .legend span:first-child { margin-right: 4px; }
        .heatmap .legend span:last-child { margin-left: 4px; }
      `}</style>
    </div>
  );
}
