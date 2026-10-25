/* 欸呦喂，这都让你找到了，那你就好好看一看我和胖鲸鱼一起写的屎山代码吧口瓜！ */

(function () {
  'use strict';

  // ---------- 全局变量 ----------
  const pages = {};        // { home: HTMLElement, about: HTMLElement, ... }
  const buttons = {};      // { home: HTMLButtonElement, ... }
  let currentPage = null;  // 当前显示的页面名称

  // ---------- 1. 自动收集所有导航按钮和对应的页面容器 ----------
  function collectPagesAndButtons() {
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => {
      const pageName = btn.dataset.page;
      if (!pageName) {
        console.warn('发现一个 .nav-btn 缺少 data-page 属性，已忽略。', btn);
        return;
      }

      // 查找对应的页面容器：id 格式为 "page-{pageName}"
      const pageEl = document.getElementById('page-' + pageName);
      if (!pageEl) {
        console.warn(`按钮 data-page="${pageName}" 找不到对应的页面容器 "page-${pageName}"，已忽略。`);
        return;
      }

      // 避免重复（如果同一个页面名有多个按钮，这里只保留第一个按钮引用，但所有按钮都会绑定事件）
      if (!pages[pageName]) {
        pages[pageName] = pageEl;
        buttons[pageName] = btn;
      } else {
        // 如果已经存在同名页面，可以继续为这个额外按钮绑定事件（但不覆盖 buttons 中的引用）
        // 这里我们允许同名按钮存在，但页面切换时只同步第一个按钮的 active 状态。
        // 为简化，不对额外按钮做 active 同步（不推荐重复命名，保持唯一最佳）。
      }

      // 为每个按钮绑定点击事件
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        // 如果按钮对应的页面存在，则切换
        if (pages[pageName]) {
          switchPage(pageName);
        }
      });
    });

    // 检查是否有页面没有对应的按钮（可选警告，不影响功能）
    // 遍历所有 .page 容器，看看是否有孤立的页面
    document.querySelectorAll('.page').forEach(pageEl => {
      const id = pageEl.id; // "page-xxx"
      if (id.startsWith('page-')) {
        const name = id.slice(5);
        if (!pages[name]) {
          console.warn(`页面容器 "${id}" 没有对应的导航按钮 (data-page="${name}")，它无法通过按钮切换，但可以通过 URL hash 直接访问。`);
          // 仍然将它加入 pages 对象，以便通过 hash 访问
          pages[name] = pageEl;
          // 没有按钮，buttons 中不添加
        }
      }
    });
  }

  // ---------- 2. 判断是否是有效页面名 ----------
  function isValidPage(name) {
    return Object.prototype.hasOwnProperty.call(pages, name);
  }

  // ---------- 3. 切换到指定页面 ----------
  function switchPage(pageName, updateHash = true) {
    // 如果页面不存在，或已经是当前页面且不需要更新 hash，则忽略
    if (!isValidPage(pageName)) {
      console.warn(`尝试切换到不存在的页面: ${pageName}`);
      return;
    }

    // 如果已经是当前页面，且不强制更新 hash，则直接返回（避免重复动画）
    if (pageName === currentPage && !updateHash) {
      return;
    }

    // 隐藏所有页面，显示目标页面
    Object.keys(pages).forEach(key => {
      pages[key].classList.toggle('active', key === pageName);
    });

    // 更新所有按钮的 active 状态（只更新存在于 buttons 中的）
    Object.keys(buttons).forEach(key => {
      buttons[key].classList.toggle('active', key === pageName);
    });

    // 更新当前页面记录
    currentPage = pageName;
    // 👇 通知播放器，现在切到哪个页面了
    if (window.toggleMiniMode) {
      window.toggleMiniMode(pageName);
    }

    // 如果需要更新 URL hash
    if (updateHash) {
      // 使用 replaceState 还是直接赋值？
      // 为了让浏览器前进后退正常工作，我们直接修改 hash（会产生历史记录）
      // 但如果当前 hash 已经是目标 hash，则不用重复设置
      const targetHash = '#' + pageName;
      if (window.location.hash !== targetHash) {
        window.location.hash = pageName;  // 自动带上 #
      }
    }
  }

  // ---------- 4. 根据 URL 的 hash 初始化页面 ----------
  function initFromHash() {
    const rawHash = window.location.hash.slice(1); // 去掉 '#'
    // 如果 hash 存在且是有效页面，则切换到该页面
    if (rawHash && isValidPage(rawHash)) {
      switchPage(rawHash, false); // 不更新 hash（已经在了）
    } else {
      // 无效或空 hash：检查是否有首页
      if (isValidPage('home')) {
        // 如果 hash 为空，用 replaceState 设置为 #home，避免产生多余历史记录
        if (window.location.hash === '') {
          history.replaceState(null, '', '#home');
        }
        switchPage('home', false);
      } else {
        // 如果没有 home 页面，则默认显示第一个有效页面
        const firstPage = Object.keys(pages)[0];
        if (firstPage) {
          if (window.location.hash === '') {
            history.replaceState(null, '', '#' + firstPage);
          }
          switchPage(firstPage, false);
        } else {
          console.error('没有任何有效页面可显示。');
        }
      }
    }
  }

  // ---------- 5. 监听 hash 变化（浏览器前进/后退、手动修改 hash） ----------
  function handleHashChange() {
    const rawHash = window.location.hash.slice(1);
    if (rawHash && isValidPage(rawHash)) {
      // 只有当前页面与目标不同时才切换（避免重复触发）
      if (rawHash !== currentPage) {
        switchPage(rawHash, false);
      }
    } else {
      // 无效 hash，跳转到首页（或第一个有效页面）
      if (isValidPage('home')) {
        switchPage('home', true); // 更新 hash 为 #home
      } else {
        const firstPage = Object.keys(pages)[0];
        if (firstPage) switchPage(firstPage, true);
      }
    }
  }

  // ---------- 6. 初始化整个应用 ----------
  function init() {
    // 收集按钮和页面
    collectPagesAndButtons();

    // 如果没有任何页面，报错并停止
    if (Object.keys(pages).length === 0) {
      console.error('未找到任何页面容器，请检查 .page 元素和 id 格式。');
      return;
    }

    // 根据当前 hash 初始化显示
    initFromHash();

    // 监听 hash 变化
    window.addEventListener('hashchange', handleHashChange);

    // 可选：监听浏览器前进/后退时，hashchange 已经覆盖，无需额外处理
  }

  // 页面加载完成后启动
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();



// 导航栏按钮
(function () {
  const toggle = document.getElementById('navToggle');
  const nav = document.getElementById('navContainer');  // ← 你的 id

  function setOpen(open) {
    nav.classList.toggle('open', open);
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
    // toggle.textContent = open ? '✕' : '☰';
  }

  toggle.addEventListener('click', () => {
    setOpen(!nav.classList.contains('open'));
  });

  // 点导航项后自动收起
  nav.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => setOpen(false));
  });

  // 点外部收起
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('open')
      && !nav.contains(e.target)
      && !toggle.contains(e.target)) {
      setOpen(false);
    }
  });

  // Esc 收起
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false);
  });
})();


// 暗号
const TARGET = "bc98714a";

function hash(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h + str.charCodeAt(i)) >>> 0;
  return h.toString(16);
}

// ---- 点击 5 次触发 ----
let clicks = 0, timer;
const whale = document.getElementById('whale');
const dialog = document.getElementById('dialog');
const input = document.getElementById('code');
const err = document.getElementById('err');

whale.addEventListener('click', () => {
  clicks++;
  clearTimeout(timer);
  timer = setTimeout(() => clicks = 0, 1500); // 1.5 秒内算连续点击
  if (clicks >= 5) {
    clicks = 0;
    dialog.classList.add('open');
    err.textContent = '';
    input.value = '';
    setTimeout(() => input.focus(), 50);
  }
});

function closeDialog() { dialog.classList.remove('open'); }
document.getElementById('cancel').onclick = closeDialog;
document.getElementById('ok').onclick = check;
input.addEventListener('keydown', e => {
  if (e.key === 'Enter') check();
  if (e.key === 'Escape') closeDialog();
});

function check() {
  if (hash(input.value.trim()) === TARGET) {
    closeDialog();
    document.getElementById('egg').classList.add('show');
    confetti();
  } else {
    err.textContent = '暗号不对，再想想～';
  }
}

// ---- 撒花 ----
function confetti() {
  const emojis = ['🐳', '🐋', '🐟', '🐠', '🐡', '🦈', '🐙', '🦑', '🦀', '🦐', '🐚', '🪸', '🌊', '💧', '🫧', '🎉', '🎊', '✨', '🌟', '💙', '🩵', '🫧', '🐳'];

  // 把 30 个增加到 50 个，让覆盖面更大
  for (let i = 0; i < 80; i++) {
    const s = document.createElement('span');
    s.className = 'confetti';
    s.textContent = emojis[Math.floor(Math.random() * emojis.length)];

    // 1. 水平位置：允许稍微超出屏幕一点(-5vw到105vw)，边缘就不会那么空
    s.style.left = (Math.random() * 110 - 5) + 'vw';

    // 2. 下落速度：差距拉大（2秒到5秒之间随机），有的掉得快，有的飘得慢
    const duration = 2 + Math.random() * 3;
    s.style.animationDuration = duration + 's';

    // 3. 出发时间：0到2秒之间随机延迟，让它们不要同时出现
    s.style.animationDelay = (Math.random() * 2) + 's';

    // 4. 初始大小：随机大小（12px 到 28px），显得有远近层次感
    s.style.fontSize = (12 + Math.random() * 16) + 'px';

    document.body.appendChild(s);

    // 延长清理时间，防止还没掉完就被删掉了
    setTimeout(() => s.remove(), (duration + 2) * 1000);
  }
}