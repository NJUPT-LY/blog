const backToTop = document.querySelector<HTMLButtonElement>('[data-back-to-top]');
if (backToTop) {
  let scheduled = false;
  const updateVisibility = () => {
    backToTop.hidden = window.scrollY < 240;
    scheduled = false;
  };
  window.addEventListener('scroll', () => {
    if (!scheduled) {
      scheduled = true;
      window.requestAnimationFrame(updateVisibility);
    }
  }, { passive: true });
  window.addEventListener('pageshow', updateVisibility);
  backToTop.addEventListener('click', () => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // 让键盘焦点也回到页首，避免按钮隐藏后继续跳到页尾链接。
    document.querySelector<HTMLAnchorElement>('header a')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });
  updateVisibility();
}
