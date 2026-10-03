import {
  toDateKey, parseYear, parseDateKey, getArchiveFilter, matchesArchiveDate,
  generateCalendarData, generateMonthSegments, getColorLevel,
  countContributionsForYear, getPrevYear, getNextYear,
} from '../lib/calendar';

const archive = document.querySelector<HTMLElement>('[data-blog-archive]');
if (archive) {
  const calendar = archive.querySelector<HTMLElement>('#github-calendar')!;
  const select = calendar.querySelector('select')!;
  const previous = archive.querySelector<HTMLButtonElement>('#prev-year')!;
  const next = archive.querySelector<HTMLButtonElement>('#next-year')!;
  const results = archive.querySelector<HTMLElement>('#post-results')!;
  const summary = archive.querySelector<HTMLElement>('#archive-summary')!;
  const empty = archive.querySelector<HTMLElement>('#empty-posts')!;
  const clearDate = archive.querySelector<HTMLButtonElement>('[data-clear-date]')!;
  const allYears = archive.querySelector<HTMLAnchorElement>('[data-all-years]')!;
  const grid = calendar.querySelector<HTMLElement>('#calendar-grid')!;
  const tooltip = calendar.querySelector<HTMLElement>('#calendar-tooltip')!;
  const posts = Array.from(archive.querySelectorAll<HTMLLIElement>('[data-post-date]'));
  const years = Array.from(select.options).map((option) => Number(option.value)).filter(Boolean);
  const initialYear = Number(calendar.dataset.initialYear);
  const counts: Record<string, number> = {};
  let tooltipCell: HTMLElement | null = null;
  for (const post of posts) {
    const date = post.dataset.postDate!;
    counts[date] = (counts[date] ?? 0) + 1;
  }

  function hideTooltip() {
    tooltip.hidden = true;
    tooltipCell?.removeAttribute('aria-describedby');
    tooltipCell = null;
  }

  function showTooltip(cell: HTMLElement) {
    hideTooltip();
    tooltipCell = cell;
    tooltip.textContent = `${cell.dataset.date}：${cell.dataset.count} 篇文章`;
    tooltip.hidden = false;
    cell.setAttribute('aria-describedby', 'calendar-tooltip');
    const rect = cell.getBoundingClientRect();
    const left = Math.max(8, Math.min(rect.left + rect.width / 2 - tooltip.offsetWidth / 2,
      window.innerWidth - tooltip.offsetWidth - 8));
    const above = rect.top - tooltip.offsetHeight - 8;
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${above < 8 ? rect.bottom + 8 : above}px`;
  }

  function filterURL(year: number | null, date: string | null = null) {
    const url = new URL(window.location.href);
    if (year === null) url.searchParams.delete('year');
    else url.searchParams.set('year', String(year));
    if (date === null) url.searchParams.delete('date');
    else url.searchParams.set('date', date);
    if (date) url.hash = 'post-results';
    else if (url.hash === '#post-results') url.hash = '';
    return url;
  }

  function render() {
    hideTooltip();
    const filter = getArchiveFilter(new URL(window.location.href).searchParams);
    const calendarYear = filter.year ?? initialYear;
    select.querySelector('[data-empty-year]')?.remove();
    if (filter.year !== null && !years.includes(filter.year)) {
      const option = new Option(String(filter.year), String(filter.year));
      option.dataset.emptyYear = '';
      select.add(option);
    }
    select.value = filter.year === null ? '' : String(filter.year);
    let visibleCount = 0;
    for (const post of posts) {
      post.hidden = !matchesArchiveDate(post.dataset.postDate!, filter);
      post.classList.toggle('featured', !post.hidden && visibleCount === 0);
      if (!post.hidden) visibleCount++;
    }
    const label = filter.date ?? (filter.year === null ? '全部文章' : `${filter.year} 年文章`);
    summary.textContent = `${label} · ${visibleCount} 篇`;
    empty.hidden = visibleCount !== 0;
    empty.textContent = filter.date ? '这一天还没有发布文章。' : '暂无文章。';
    clearDate.hidden = filter.date === null;
    allYears.hidden = filter.year === null;
    allYears.href = filterURL(null).href;

    const weeks = generateCalendarData(calendarYear);
    calendar.querySelector<HTMLElement>('.calendar-layout')!.style.setProperty('--weeks', String(weeks.length));
    const days = weeks.flat().map((date) => {
      const key = date ? toDateKey(date) : '';
      const count = counts[key] ?? 0;
      const cell = document.createElement(count > 0 ? 'a' : 'span');
      cell.className = `calendar-day level-${getColorLevel(count)}`;
      if (date) {
        cell.dataset.date = key;
        cell.dataset.count = String(count);
        cell.setAttribute('aria-label', `${key}：${count} 篇文章${count > 0 ? '，查看当天文章' : ''}`);
        if (cell instanceof HTMLAnchorElement) {
          cell.href = filterURL(calendarYear, key).href;
          if (filter.date === key) cell.setAttribute('aria-current', 'date');
        }
      } else {
        cell.setAttribute('aria-hidden', 'true');
      }
      return cell;
    });
    grid.replaceChildren(...days);
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

  function scrollToResults(smooth: boolean) {
    results.focus({ preventScroll: true });
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    results.scrollIntoView({ behavior: smooth && !reduceMotion ? 'smooth' : 'auto', block: 'start' });
  }

  function navigate(year: number | null, date: string | null = null) {
    const url = filterURL(year, date);
    if (url.href !== window.location.href) window.history.pushState(null, '', url);
    render();
    if (date) scrollToResults(true);
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
  clearDate.addEventListener('click', () => {
    navigate(parseYear(select.value));
    results.focus({ preventScroll: true });
  });
  allYears.addEventListener('click', (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    event.preventDefault();
    navigate(null);
    results.focus({ preventScroll: true });
  });
  grid.addEventListener('click', (event) => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[data-date]') : null;
    const date = parseDateKey(link?.dataset.date ?? null);
    if (!date) return;
    event.preventDefault();
    navigate(Number(date.slice(0, 4)), date);
  });
  for (const eventName of ['pointerover', 'focusin']) {
    grid.addEventListener(eventName, (event) => {
      const cell = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-date]') : null;
      if (cell) showTooltip(cell);
    });
  }
  grid.addEventListener('pointerout', hideTooltip);
  grid.addEventListener('focusout', hideTooltip);
  grid.addEventListener('keydown', (event) => { if (event.key === 'Escape') hideTooltip(); });
  calendar.querySelector('.calendar-scroll')!.addEventListener('scroll', hideTooltip, { passive: true });
  window.addEventListener('scroll', hideTooltip, { passive: true });
  window.addEventListener('resize', hideTooltip);
  window.addEventListener('popstate', render);
  render();
  archive.querySelector<HTMLElement>('#year-controls')!.hidden = false;
  // 直接打开带日期的分享链接时，等待筛选完成再定位结果。
  if (getArchiveFilter(new URL(window.location.href).searchParams).date && window.location.hash === '#post-results') {
    scrollToResults(false);
  }
}
