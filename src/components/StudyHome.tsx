import { useRef, useState } from 'react';
import { monthKey, monthWindow, type DailyRecord } from '../lib/daily';
import '../styles/study-home.css';

interface Props { records: DailyRecord[]; today: string }

export default function StudyHome({ records, today }: Props) {
  const touchStart = useRef<number | null>(null);
  const [end, setEnd] = useState(monthKey(today));
  const [pinned, setPinned] = useState(records.at(-1)?.id ?? '');
  const [hovered, setHovered] = useState<string | null>(null);
  const months = monthWindow(records, end);
  const visible = months.flatMap((month) => month.records);
  const current = visible.find((record) => record.id === (hovered ?? pinned)) ?? visible.at(-1);
  const earliest = records[0]?.date.slice(0, 7) ?? monthKey(today);
  const previous = months[0].key > earliest;
  const next = end < monthKey(today);
  const tone = current ? (Number(current.date.slice(5, 7)) - 1) % 3 : 2;

  function move(direction: number) {
    if ((direction < 0 && !previous) || (direction > 0 && !next)) return;
    setHovered(null);
    setEnd(monthKey(end, direction));
  }

  return <div className="study-home">
    <div className="edition-line">
      <h1>Daily studies</h1><span>IT / OT / COMPUTER SCIENCE</span>
      <span>{months[0].key.slice(0, 4) === end.slice(0, 4) ? end.slice(0, 4) : `${months[0].key.slice(0, 4)} / ${end.slice(0, 4)}`}</span>
    </div>
    <section className="collection" aria-label="월별 누적 학습 기록">
      <div className="collection-caption">
        <div className="collection-total"><h2>Collected</h2><span className="collection-count">{records.length}</span></div>
        <article id="record-preview" className={`record-preview tone-${tone}`} aria-label="선택한 학습 기록">
          {current ? <>
            <time className="record-meta" dateTime={current.date}>{current.date.slice(5).replace('-', ' / ')}</time>
            <div key={current.id} className="record-copy">
              <p>{current.text}</p>
              {current.sources.map((source) => <a key={source.href} className="record-source" href={source.href}
                target={source.external ? '_blank' : undefined} rel={source.external ? 'noopener noreferrer' : undefined}
                aria-label={source.title + (source.external ? ' (새 탭에서 열기)' : '')}>
                <span>{source.title}</span><span aria-hidden="true">{source.external ? '↗' : '→'}</span>
              </a>)}
            </div>
          </> : <p className="record-empty">{records.length ? '이 기간에 남긴 기록이 없습니다' : '첫 기록을 기다립니다'}</p>}
        </article>
      </div>
      <div className="month-archive">
        <div className="imprint" onTouchStart={(event) => { touchStart.current = event.touches[0].clientX; }} onTouchEnd={(event) => {
          if (touchStart.current === null) return;
          const distance = event.changedTouches[0].clientX - touchStart.current;
          if (Math.abs(distance) > 60) move(distance < 0 ? 1 : -1);
          touchStart.current = null;
        }}>
          {months.map((month) => <section className={`imprint-month tone-${month.tone}`} key={month.key} aria-label={`${month.key}, ${month.records.length}개의 기록`}>
            <h3>{month.label}<span>{String(month.records.length).padStart(2, '0')}</span></h3>
            <div className="imprint-lines">
              {month.records.map((record) => <button type="button" key={record.id}
                className={current?.id === record.id ? 'is-previewed' : ''}
                aria-label={`${record.date} ${record.text}`} aria-pressed={pinned === record.id} aria-controls="record-preview"
                onPointerEnter={(event) => { if (event.pointerType === 'mouse') setHovered(record.id); }}
                onPointerLeave={() => setHovered(null)} onFocus={() => { setHovered(null); setPinned(record.id); }}
                onClick={() => setPinned(record.id)}>
                <i aria-hidden="true" /><span aria-hidden="true">{record.date.slice(8)}</span>
              </button>)}
            </div>
          </section>)}
        </div>
        {(previous || next) && <nav className="month-navigation" aria-label="기록 월 이동">
          <button type="button" onClick={() => move(-1)} disabled={!previous} aria-label="이전 달">←</button>
          <span aria-live="polite">{months[0].label} – {months[2].label}</span>
          <button type="button" onClick={() => move(1)} disabled={!next} aria-label="다음 달">→</button>
        </nav>}
      </div>
    </section>
  </div>;
}
