// 统一使用 UTC，避免构建机器和读者的时区改变文章所属日期。
export function toDateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function parseYear(value: string | null): number | null {
  return value !== null && /^[1-9]\d{3}$/.test(value) ? Number(value) : null;
}

/** 严格校验真实日期，拒绝 2 月 30 日等会被 Date 自动进位的输入。 */
export function parseDateKey(value: string | null): string | null {
  if (value === null || !/^[1-9]\d{3}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.valueOf()) && toDateKey(date) === value ? value : null;
}

export function getArchiveFilter(params: URLSearchParams) {
  const date = parseDateKey(params.get('date'));
  // 日期精度高于年份；分享链接里的年份不一致时，以有效日期为准。
  const year = date ? Number(date.slice(0, 4)) : parseYear(params.get('year'));
  return { year, date };
}

export function matchesArchiveDate(postDate: string, filter: { year: number | null; date: string | null }) {
  if (filter.date) return postDate === filter.date;
  return filter.year === null || postDate.startsWith(`${filter.year}-`);
}

/** 每列为一周，每行依次为周一至周日；补齐用的空白格不是日期。 */
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

// 年份按降序排列；导航时跳过没有文章的年份。
export function getPrevYear(years: number[], current: number): number | null {
  return years.find((year) => year < current) ?? null;
}

export function getNextYear(years: number[], current: number): number | null {
  return [...years].reverse().find((year) => year > current) ?? null;
}
