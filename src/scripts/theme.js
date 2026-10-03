// 在 head 内同步运行，让首屏直接使用正确主题，并兼容旧版的 theme 存储键。
(() => {
  const root = document.documentElement;
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)');
  const validTheme = (value) => value === 'light' || value === 'dark' ? value : null;
  const readPreference = () => {
    try { return validTheme(window.localStorage.getItem('theme')); }
    catch { return null; }
  };
  let preference = readPreference();

  function applyTheme() {
    const theme = preference ?? (systemTheme.matches ? 'dark' : 'light');
    root.dataset.theme = theme;
    const action = theme === 'dark' ? '切换至浅色主题' : '切换至深色主题';
    document.querySelectorAll('[data-theme-toggle]').forEach((button) => {
      button.setAttribute('aria-label', action);
      button.setAttribute('title', action);
      button.hidden = false;
    });
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content',
      theme === 'dark' ? '#0d1117' : '#ffffff');
  }

  applyTheme();
  document.addEventListener('DOMContentLoaded', applyTheme, { once: true });
  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element) || !event.target.closest('[data-theme-toggle]')) return;
    preference = root.dataset.theme === 'dark' ? 'light' : 'dark';
    // 禁用存储或配额不足时，当前页面仍然能够切换。
    try { window.localStorage.setItem('theme', preference); } catch {}
    applyTheme();
  });
  systemTheme.addEventListener('change', () => {
    if (preference === null) applyTheme();
  });
  window.addEventListener('storage', (event) => {
    if (event.key !== 'theme' && event.key !== null) return;
    try { if (event.storageArea !== window.localStorage) return; } catch { return; }
    preference = validTheme(event.newValue);
    applyTheme();
  });
  // 从浏览器往返缓存恢复时，重新读取其他页面可能修改过的偏好。
  window.addEventListener('pageshow', (event) => {
    if (!event.persisted) return;
    preference = readPreference();
    applyTheme();
  });
})();
