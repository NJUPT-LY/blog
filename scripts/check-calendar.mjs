// Node >= 22.6：node --experimental-strip-types scripts/check-calendar.mjs
// 使用 Node 内置断言，无需额外测试框架或依赖。
import assert from 'node:assert/strict';
import {
  toDateKey, parseYear, generateCalendarData, generateMonthSegments,
  countContributionsForYear, getPrevYear, getNextYear,
  parseDateKey, getArchiveFilter, matchesArchiveDate,
} from '../src/lib/calendar.ts';

// A full Gregorian cycle covers all leap-year and weekday arrangements.
for (let year = 2000; year < 2400; year++) {
  const weeks = generateCalendarData(year);
  const days = weeks.flat().filter(Boolean);
  const expectedDays = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 366 : 365;
  assert.equal(days.length, expectedDays, `${year}: day count`);
  assert.equal(new Set(days.map(toDateKey)).size, expectedDays, `${year}: unique dates`);
  assert.equal(toDateKey(days[0]), `${year}-01-01`);
  assert.equal(toDateKey(days.at(-1)), `${year}-12-31`);
  for (const week of weeks) {
    assert.equal(week.length, 7);
    week.forEach((date, row) => {
      if (date) assert.equal((date.getUTCDay() + 6) % 7, row, `${year}: weekday alignment`);
    });
  }
  const months = generateMonthSegments(weeks);
  assert.deepEqual(months.map((month) => month.label), Array.from({ length: 12 }, (_, i) => `${i + 1}月`));
  assert.equal(months.reduce((total, month) => total + month.span, 0), weeks.length);
}
assert.equal(generateCalendarData(2012).length, 54, 'Leap year starting on Sunday needs 54 columns');
assert.equal(toDateKey(new Date('2024-01-01')), '2024-01-01');
assert.equal(toDateKey(new Date('2024-01-01T01:00:00+08:00')), '2023-12-31');
for (const value of [null, '', '2024x', '2024.5', ' 2024 ', '0', '-2024', '02024', '10000', '<script>']) {
  assert.equal(parseYear(value), null);
}
assert.equal(parseYear('2024'), 2024);
assert.equal(parseYear('2026'), 2026, 'Valid empty years still filter to an empty list');
assert.throws(() => generateCalendarData(NaN), RangeError);
assert.throws(() => generateCalendarData(2024.5), RangeError);
assert.equal(getPrevYear([2024, 2022], 2024), 2022);
assert.equal(getNextYear([2024, 2022], 2022), 2024);
assert.equal(getPrevYear([2024, 2022], 2023), 2022);
assert.equal(getNextYear([2024, 2022], 2023), 2024);
assert.equal(getPrevYear([2024, 2022], 2022), null);
assert.equal(getNextYear([2024, 2022], 2024), null);
assert.equal(getPrevYear([], 2024), null);
assert.equal(getNextYear([], 2024), null);
assert.equal(countContributionsForYear({ '2024-02-29': 2, '2024-12-31': 1, '2023-12-31': 4 }, 2024), 3);
assert.equal(countContributionsForYear({}, 2024), 0);
for (const value of [null, '', '2024-2-9', '2023-02-29', '2024-02-30', '2024-13-01', '2024-00-01', '2024-01-00', '2024-01-32', '2024-01-01x', '2024-01-01T00:00:00Z']) {
  assert.equal(parseDateKey(value), null, `拒绝无效日期：${value}`);
}
assert.equal(parseDateKey('2024-02-29'), '2024-02-29');
assert.equal(parseDateKey('2024-12-31'), '2024-12-31');
const dayFilter = getArchiveFilter(new URLSearchParams('year=2022&date=2024-06-19'));
assert.deepEqual(dayFilter, { year: 2024, date: '2024-06-19' }, '有效日期决定所属年份');
assert.deepEqual(getArchiveFilter(new URLSearchParams('year=2022&date=2023-02-29')), { year: 2022, date: null });
assert.deepEqual(getArchiveFilter(new URLSearchParams('date=2024-06-19')), dayFilter);
assert.deepEqual(getArchiveFilter(new URLSearchParams()), { year: null, date: null });
const postDates = ['2024-06-19', '2024-06-19', '2024-06-01', '2022-07-08'];
assert.deepEqual(postDates.filter((date) => matchesArchiveDate(date, dayFilter)), ['2024-06-19', '2024-06-19'], '保留同一天的全部文章');
assert.equal(postDates.filter((date) => matchesArchiveDate(date, { year: 2024, date: null })).length, 3);
assert.equal(postDates.filter((date) => matchesArchiveDate(date, { year: null, date: null })).length, 4);
assert.equal(postDates.filter((date) => matchesArchiveDate(date, { year: 2024, date: '2024-02-29' })).length, 0);
console.log('日历检查通过：400 年周期、闰日、月份对齐、年份导航、日期校验与同日多篇筛选。');
