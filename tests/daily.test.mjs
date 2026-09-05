import test from 'node:test';
import assert from 'node:assert/strict';
import { monthKey, monthWindow, webSource } from '../src/lib/daily.ts';

test('three calendar months, including empty months and year boundaries', () => {
  assert.deepEqual(monthWindow([], '2026-09').map((m) => m.key), ['2026-07', '2026-08', '2026-09']);
  assert.deepEqual(monthWindow([], '2026-01').map((m) => m.label), ['Nov', 'Dec', 'Jan']);
  assert.equal(monthKey('2026-01', -1), '2025-12');
  assert.equal(monthKey('2026-12', 1), '2027-01');
});

test('one line per record, not per day; no record loss at higher counts', () => {
  for (const count of [0, 1, 4, 31, 300]) {
    const entries = Array.from({ length: count }, (_, i) => ({ id: String(i), date: '2026-09-05', text: '공부 기록', sources: [] }));
    const months = monthWindow(entries, '2026-09');
    assert.equal(months[2].records.length, count);
    assert.equal(months[0].records.length, 0);
  }
});

test('month grouping includes year, and colors do not change with navigation', () => {
  const entries = [{ id: 'old', date: '2025-09-05', text: '작년', sources: [] }];
  assert.equal(monthWindow(entries, '2026-09')[2].records.length, 0);
  assert.equal(monthWindow([], '2026-09')[2].tone, monthWindow([], '2026-10')[1].tone);
});

test('internal links are portable and external links retain origin', () => {
  assert.deepEqual(webSource('내 글', 'https://stacknoah.com/notes/test?x=1#section', 'https://stacknoah.com'), {
    title: '내 글', href: '/notes/test?x=1#section', external: false,
  });
  assert.equal(webSource('', 'https://learn.microsoft.com/test', 'https://stacknoah.com').title, 'learn.microsoft.com');
  assert.equal(webSource('외부', 'https://example.com/', 'https://stacknoah.com').external, true);
});

test('unsafe and malformed source URLs never become links', () => {
  for (const href of ['javascript:alert(1)', 'data:text/html,<script>', 'file:///tmp/test', '//example.com', 'not a url', 'https://user:password@example.com']) {
    assert.equal(webSource('출처', href, 'https://stacknoah.com'), null);
  }
});
