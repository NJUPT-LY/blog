import {
  toDateKey, parseYear, generateCalendarData, generateMonthSegments,
  getColorLevel, countContributionsForYear, getPrevYear, getNextYear,
} from '../lib/calendar';

const archive = document.querySelector<HTMLElement>('[data-blog-archive]');
if (archive) {
  const calendar = archive.querySelector<HTMLElement>('#github-calendar')!;
  const select = calendar.querySelector('select')!;
  const previous = archive.querySelector<HTMLButtonElement>('#prev-year')!;
  const next = archive.querySelector<HTMLButtonElement>('#next-year')!;
  const posts = Array.from(archive.querySelectorAll<HTMLLIElement>('[data-post-date]'));
  const years = Array.from(select.options).map((option) => Number(option.value)).filter(Boolean);
  const initialYear = Number(calendar.dataset.initialYear);
  const counts: Record<string, number> = {};
  for (const post of posts) {
    const date = post.dataset.postDate!;
    counts[date] = (counts[date] ?? 0) + 1;
  }

  function render() {
    const year = parseYear(new URL(window.location.href).searchParams.get('year'));
    const calendarYear = year ?? initialYear;
    select.querySelector('[data-empty-year]')?.remove();
    if (year !== null && !years.includes(year)) {
      const option = new Option(String(year), String(year));
      option.dataset.emptyYear = '';
      select.add(option);
    }
    select.value = year === null ? '' : String(year);
    let visibleCount = 0;
    for (const post of posts) {
      post.hidden = year !== null && !post.dataset.postDate!.startsWith(`${year}-`);
      post.classList.toggle('featured', !post.hidden && visibleCount === 0);
      if (!post.hidden) visibleCount++;
    }
    archive!.querySelector<HTMLElement>('#archive-summary')!.textContent =
      `${year === null ? '全部文章' : `${year} 年文章`} · ${visibleCount} 篇`;
    archive!.querySelector<HTMLElement>('#empty-posts')!.hidden = visibleCount !== 0;
    archive!.querySelector<HTMLElement>('[data-all-years]')!.hidden = year === null;

    const weeks = generateCalendarData(calendarYear);
    calendar.querySelector<HTMLElement>('.calendar-layout')!.style.setProperty('--weeks', String(weeks.length));
    const days = weeks.flat().map((date) => {
      const cell = document.createElement('span');
      const key = date ? toDateKey(date) : '';
      const count = counts[key] ?? 0;
      cell.className = `calendar-day level-${getColorLevel(count)}`;
      if (date) {
        cell.dataset.date = key;
        cell.dataset.count = String(count);
        cell.title = `${key}：${count} 篇文章`;
        cell.setAttribute('aria-label', cell.title);
      } else {
        cell.setAttribute('aria-hidden', 'true');
      }
      return cell;
    });
    calendar.querySelector('#calendar-grid')!.replaceChildren(...days);
    const months = generateMonthSegments(weeks).map((month) => {
      const label = document.createElement('span');
      label.textContent = month.label;
      label.style.gridColumn = `span ${month.span}`;
      return label;
    });
    calendar.querySelector('#calendar-months')!.replaceChildren(...months);
    calendar.querySelector<HTMLElement>('#calendar-summary')!.textContent =
      `${calendarYear} 年 · ${countContributionsForYear(counts, calendarYear)} 篇文章`;
    previous.disabled = getPrevYear(years, calendarYear) === null;
    next.disabled = getNextYear(years, calendarYear) === null;
  }

  function navigate(year: number | null) {
    const url = new URL(window.location.href);
    if (year === null) url.searchParams.delete('year');
    else url.searchParams.set('year', String(year));
    if (url.href !== window.location.href) window.history.pushState(null, '', url);
    render();
  }

  select.addEventListener('change', () => navigate(parseYear(select.value)));
  previous.addEventListener('click', () => {
    const target = getPrevYear(years, parseYear(select.value) ?? initialYear);
    if (target !== null) navigate(target);
  });
  next.addEventListener('click', () => {
    const target = getNextYear(years, parseYear(select.value) ?? initialYear);
    if (target !== null) navigate(target);
  });
  archive.querySelector<HTMLAnchorElement>('[data-all-years]')!.addEventListener('click', (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    navigate(null);
  });
  window.addEventListener('popstate', render);
  render();
  archive.querySelector<HTMLElement>('#year-controls')!.hidden = false;
}
