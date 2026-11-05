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




// ================= 撒花特效逻辑 =================
function triggerConfetti() {
  // 主题色库：薄荷绿、粉色、淡黄、白色、紫色
  var colors = ['#a8e6cf', '#f6c9d8', '#ffd3b6', '#ffffff', '#a265be', '#6aa0b1'];
  var particleCount = 80; // 纸片数量

  // 获取屏幕中央位置
  var startX = window.innerWidth / 2;
  var startY = window.innerHeight / 2;

  for (var i = 0; i < particleCount; i++) {
    var particle = document.createElement('div');
    particle.className = 'mint-confetti-k8v3n';

    // 随机颜色
    particle.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];

    // 随机起始位置（在屏幕中心小范围随机，形成爆炸感）
    var offsetX = (Math.random() - 0.5) * 200;
    var offsetY = (Math.random() - 0.5) * 200;
    particle.style.left = (startX + offsetX) + 'px';
    particle.style.top = (startY + offsetY) + 'px';

    // 随机动画参数：飞散的水平距离、下落的垂直距离、旋转角度
    var tx = (Math.random() - 0.5) * window.innerWidth * 1.5; // 左右飞散范围
    var ty = window.innerHeight * (0.5 + Math.random() * 0.5); // 向下飘落距离
    var rot = Math.random() * 1080 - 540; // 旋转圈数

    particle.style.setProperty('--tx', tx + 'px');
    particle.style.setProperty('--ty', ty + 'px');
    particle.style.setProperty('--rot', rot + 'deg');

    // 随机持续时间（2.5s - 4s）
    particle.style.setProperty('--fall-duration', (2.5 + Math.random() * 1.5) + 's');

    document.body.appendChild(particle);

    // 动画结束后自动移除 DOM，防止页面卡顿
    setTimeout(function () {
      if (particle.parentNode) {
        particle.parentNode.removeChild(particle);
      }
    }, 4000); // 4秒后清理
  }
}