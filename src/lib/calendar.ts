// Publication dates use UTC so build machines and readers see the same day/year.
export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseYear(value: string | null): number | null {
  return value !== null && /^[1-9]\d{3}$/.test(value) ? Number(value) : null;
}

/** Columns are weeks; rows are Monday through Sunday. Padding is not a day. */
export function generateCalendarData(year: number): (Date | null)[][] {
  if (!Number.isInteger(year) || year < 1000 || year > 9999) {
    throw new RangeError('Calendar year must be between 1000 and 9999');
  }
  const first = new Date(Date.UTC(year, 0, 1));
  const cells: (Date | null)[] = Array((first.getUTCDay() + 6) % 7).fill(null);
  for (const day = new Date(first); day.getUTCFullYear() === year; day.setUTCDate(day.getUTCDate() + 1)) {
    cells.push(new Date(day));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  return Array.from({ length: cells.length / 7 }, (_, i) => cells.slice(i * 7, i * 7 + 7));
}

export function generateMonthSegments(weeks: (Date | null)[][]) {
  const segments: { label: string; span: number }[] = [];
  for (const week of weeks) {
    const firstOfMonth = week.find((day) => day?.getUTCDate() === 1);
    if (firstOfMonth) {
      segments.push({ label: `${firstOfMonth.getUTCMonth() + 1}月`, span: 1 });
    } else if (segments.length) {
      segments[segments.length - 1].span++;
    }
  }
  return segments;
}

export function getColorLevel(count: number): number {
  if (count <= 0) return 0;
  if (count <= 2) return count;
  return count <= 4 ? 3 : 4;
}

export function countContributionsForYear(postsByDate: Record<string, number>, year: number): number {
  return Object.entries(postsByDate).reduce(
    (total, [date, count]) => total + (date.startsWith(`${year}-`) ? count : 0), 0,
  );
}

// Years are descending; skip years with no posts, including from an empty-year URL.
export function getPrevYear(years: number[], current: number): number | null {
  return years.find((year) => year < current) ?? null;
}

export function getNextYear(years: number[], current: number): number | null {
  return [...years].reverse().find((year) => year > current) ?? null;
}
