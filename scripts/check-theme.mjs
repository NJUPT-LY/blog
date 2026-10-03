// 使用内置断言运行实际首屏脚本，覆盖浏览器存储和主题事件的边界情况。
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

const source = readFileSync(new URL('../src/scripts/theme.js', import.meta.url), 'utf8');

function page({ saved = null, dark = false, blocked = false, writeBlocked = false } = {}) {
  const bus = () => {
    const listeners = new Map();
    return {
      addEventListener(type, listener) {
        if (!listeners.has(type)) listeners.set(type, []);
        listeners.get(type).push(listener);
      },
      emit(type, event = {}) { for (const listener of listeners.get(type) ?? []) listener(event); },
    };
  };
  class Element {
    attributes = {};
    hidden = true;
    setAttribute(key, value) { this.attributes[key] = value; }
    closest() { return this; }
  }
  const button = new Element();
  const meta = new Element();
  const media = { ...bus(), matches: dark };
  const storage = {
    getItem() { return saved; },
    setItem(key, value) {
      if (writeBlocked) throw new Error('存储配额不足');
      assert.equal(key, 'theme');
      saved = value;
    },
  };
  const document = {
    ...bus(), documentElement: { dataset: {} },
    querySelector: () => meta,
    // 模拟 head 阶段没有正文和按钮。
    querySelectorAll: () => [],
  };
  const window = { ...bus(), matchMedia: () => media,
    get localStorage() { if (blocked) throw new Error('存储被禁用'); return storage; },
  };
  runInNewContext(source, { document, window, Element });
  const initial = document.documentElement.dataset.theme;
  document.querySelectorAll = () => [button];
  document.emit('DOMContentLoaded');
  return {
    initial, button, meta,
    get theme() { return document.documentElement.dataset.theme; },
    get saved() { return saved; },
    click() { document.emit('click', { target: button }); },
    system(value) { media.matches = value; media.emit('change'); },
    storage(value, key = 'theme', storageArea = storage) {
      saved = value;
      window.emit('storage', { key, newValue: value, storageArea });
    },
    restore(value) { saved = value; window.emit('pageshow', { persisted: true }); },
  };
}

for (const dark of [true, false]) {
  const p = page({ dark });
  assert.equal(p.initial, dark ? 'dark' : 'light', '首屏应在正文出现前应用系统主题');
  assert.equal(p.button.hidden, false);
  p.system(!dark);
  assert.equal(p.theme, dark ? 'light' : 'dark', '未手动选择时应响应系统变化');
  p.click();
  assert.equal(p.theme, dark ? 'dark' : 'light');
  assert.equal(p.saved, p.theme);
  assert.equal(p.button.attributes['aria-label'], dark ? '切换至浅色主题' : '切换至深色主题');
  assert.equal(p.meta.attributes.content, dark ? '#0d1117' : '#ffffff');
  p.system(!dark);
  assert.equal(p.theme, dark ? 'dark' : 'light', '手动选择后不应被系统变化覆盖');
  assert.equal(page({ saved: p.saved, dark: !dark }).initial, p.saved, '新页面和刷新应恢复偏好');
  p.click();
  assert.equal(p.theme, dark ? 'light' : 'dark');
}

assert.equal(page({ saved: 'dark', dark: false }).initial, 'dark', '兼容旧版已保存偏好');
assert.equal(page({ saved: 'invalid', dark: true }).initial, 'dark', '无效偏好回退到系统');

for (const options of [{ blocked: true }, { writeBlocked: true }]) {
  const p = page({ dark: true, ...options });
  p.click();
  assert.equal(p.theme, 'light', '不能写入存储时仍可切换');
  p.system(true);
  assert.equal(p.theme, 'light', '当前页的选择仍应保留');
}

const synced = page({ saved: 'light', dark: true });
synced.storage('dark');
assert.equal(synced.theme, 'dark', '同步其他标签页的主题');
synced.storage('light', 'unrelated');
assert.equal(synced.theme, 'dark', '忽略其他存储键');
synced.storage('light', 'theme', {});
assert.equal(synced.theme, 'dark', '忽略其他存储区域');
synced.storage(null);
synced.system(false);
assert.equal(synced.theme, 'light', '清除偏好后重新跟随系统');
synced.storage('dark');
synced.storage(null, null);
assert.equal(synced.theme, 'light', '清空存储后重新跟随系统');
synced.restore('dark');
assert.equal(synced.theme, 'dark', '从往返缓存恢复时同步偏好');

console.log('主题检查通过：首屏初始化、系统偏好、手动切换、刷新恢复、存储异常、跨页同步和往返缓存。');
