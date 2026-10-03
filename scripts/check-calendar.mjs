// Run with Node >= 22.6: node --experimental-strip-types scripts/check-calendar.mjs
// Uses only Node assertions; no test framework or dependency is needed.
import assert from 'node:assert/strict';
import {
  toDateKey, parseYear, generateCalendarData, generateMonthSegments,
  countContributionsForYear, getPrevYear, getNextYear,
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
console.log('Calendar checks passed: 400 years, leap days, week/month alignment, UTC dates, year queries and navigation.');
