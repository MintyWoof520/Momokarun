(function () {
  const loader = document.getElementById('loader');
  const blogContent = document.getElementById('blogContent');
  const progressFill = document.getElementById('progressFill');
  const percentText = document.getElementById('percentText');

  // 配置
  const MIN_LOADING_TIME = 1800;   // 最短显示时间（毫秒）
  const MAX_LOADING_TIME = 5000;   // 最长显示时间（防止卡死）
  const START_TIME = Date.now();

  // 进度模拟变量
  let progress = 0;
  let progressInterval = null;
  let isCompleted = false;

  // 更新进度UI
  function updateProgressUI(value) {
    const rounded = Math.min(100, Math.floor(value));
    progressFill.style.width = rounded + '%';
    percentText.textContent = rounded + '%';
    if (rounded >= 100) {
      percentText.textContent = '100%';
    }
  }

  // 模拟进度增长
  function startSimulatedProgress() {
    if (progressInterval) clearInterval(progressInterval);

    progressInterval = setInterval(() => {
      if (isCompleted) return;

      let increment = 0;

      if (progress < 30) {
        increment = Math.random() * 4 + 2;
      } else if (progress < 60) {
        increment = Math.random() * 2.5 + 1.2;
      } else if (progress < 85) {
        increment = Math.random() * 1.2 + 0.4;
      } else if (progress < 98) {
        increment = Math.random() * 0.5 + 0.1;
      } else {
        increment = 0;
      }

      progress = Math.min(progress + increment, 99);
      updateProgressUI(progress);

      // 超时强制完成
      if (Date.now() - START_TIME > MAX_LOADING_TIME - 300 && !isCompleted) {
        forceComplete();
      }
    }, 120);
  }

  // 强制完成进度
  function forceComplete() {
    if (isCompleted) return;
    isCompleted = true;
    if (progressInterval) {
      clearInterval(progressInterval);
      progressInterval = null;
    }
    progress = 100;
    updateProgressUI(progress);

    setTimeout(() => {
      hideLoader();
    }, 350);
  }

  // 隐藏加载层
  function hideLoader() {
    if (loader.classList.contains('fade-out')) return;

    loader.classList.add('fade-out');
    blogContent.classList.add('visible');

    const onFadeOutEnd = function (e) {
      if (e.target === loader && (e.propertyName === 'opacity' || e.propertyName === 'visibility')) {
        loader.removeEventListener('transitionend', onFadeOutEnd);
        if (loader.parentNode) {
          loader.parentNode.removeChild(loader);
        }
      }
    };
    loader.addEventListener('transitionend', onFadeOutEnd);

    setTimeout(() => {
      if (loader.parentNode) {
        loader.parentNode.removeChild(loader);
      }
    }, 800);
  }

  // 启动
  startSimulatedProgress();

  // 页面加载完成
  window.addEventListener('load', function () {
    const elapsed = Date.now() - START_TIME;
    const remaining = Math.max(0, MIN_LOADING_TIME - elapsed);

    setTimeout(() => {
      if (!isCompleted) {
        forceComplete();
      }
    }, remaining);
  });

  // 如果页面已加载完成（缓存情况）
  if (document.readyState === 'complete') {
    setTimeout(() => {
      const elapsed = Date.now() - START_TIME;
      const remaining = Math.max(0, MIN_LOADING_TIME - elapsed);
      setTimeout(() => {
        if (!isCompleted) {
          forceComplete();
        }
      }, remaining);
    }, 10);
  }

  // 超时保护
  setTimeout(() => {
    if (!isCompleted) {
      forceComplete();
    }
  }, MAX_LOADING_TIME);

  // 额外兜底
  setTimeout(() => {
    if (!isCompleted && Date.now() - START_TIME > MIN_LOADING_TIME + 1500) {
      forceComplete();
    }
  }, MIN_LOADING_TIME + 2000);

})();

// ==========================================
// ❄️ 全屏下雪特效引擎 ❄️
// ==========================================
function initSnow() {
  const canvas = document.getElementById('snowCanvas');
  if (!canvas) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const ctx = canvas.getContext('2d');
  const TAU = Math.PI * 2;
  let width = 0, height = 0, flakes = [], rafId = 0;

  const COUNT = window.innerWidth < 768 ? 50 : 110;

  // ⭐ 预渲染雪花 sprite（一次生成，永久复用）
  // 中心纯白 → 边缘透明，柔边效果≈原版 shadowBlur
  const SPRITE_SIZE = 48;
  const sprite = (() => {
    const c = document.createElement('canvas');
    c.width = c.height = SPRITE_SIZE;
    const g = c.getContext('2d');
    const r = SPRITE_SIZE / 2;

    // 外圈淡淡的深色柔光（模拟原版阴影，让浅色背景也看得见）
    const shadowGrad = g.createRadialGradient(r + 1, r + 1, 0, r + 1, r + 1, r);
    shadowGrad.addColorStop(0, 'rgba(0,0,0,0.18)');
    shadowGrad.addColorStop(0.6, 'rgba(0,0,0,0.06)');
    shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = shadowGrad;
    g.beginPath();
    g.arc(r + 1, r + 1, r, 0, TAU);
    g.fill();

    // 内圈白色主体，边缘渐隐
    const whiteGrad = g.createRadialGradient(r, r, 0, r, r, r * 0.85);
    whiteGrad.addColorStop(0, 'rgba(255,255,255,1)');
    whiteGrad.addColorStop(0.55, 'rgba(255,255,255,0.9)');
    whiteGrad.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = whiteGrad;
    g.beginPath();
    g.arc(r, r, r * 0.85, 0, TAU);
    g.fill();

    return c;
  })();

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const makeFlake = (init) => ({
    x: Math.random() * width,
    y: init ? Math.random() * height : -10,
    // 雪花大小：1.5 ~ 5px（你要更大就调这两数）
    r: Math.random() * 3.5 + 1.5,
    vy: Math.random() * 1.5 + 0.5,        // 恢复原版速度感
    vx: Math.random() * 1 - 0.5,          // 恢复原版左右漂移
    a: Math.random() * 0.6 + 0.3,         // ⭐ 每片独立透明度，连续随机
    swing: Math.random() * TAU,
    swingSpeed: Math.random() * 0.02 + 0.01,
  });

  function frame() {
    ctx.clearRect(0, 0, width, height);

    for (const f of flakes) {
      f.y += f.vy;
      f.swing += f.swingSpeed;
      f.x += Math.sin(f.swing) * 0.5 + f.vx;

      // 完整飘出屏幕才回收（按半径判断，大雪不会半路消失）
      if (f.y > height + f.r * 2 || f.x < -f.r || f.x > width + f.r) {
        Object.assign(f, makeFlake(false));
        continue;
      }

      ctx.globalAlpha = f.a;               // 每片独立透明度
      const d = f.r * 2;
      ctx.drawImage(sprite, f.x - f.r, f.y - f.r, d, d);  // 贴图，极快
    }
    ctx.globalAlpha = 1;

    rafId = requestAnimationFrame(frame);
  }

  const start = () => { if (!rafId) rafId = requestAnimationFrame(frame); };
  const stop = () => { if (rafId) { cancelAnimationFrame(rafId); rafId = 0; } };

  document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());

  let rz;
  window.addEventListener('resize', () => {
    clearTimeout(rz);
    rz = setTimeout(() => {
      resize();
      flakes = Array.from({ length: COUNT }, () => makeFlake(true));
    }, 200);
  });

  resize();
  flakes = Array.from({ length: COUNT }, () => makeFlake(true));
  start();
}

// ⭐ 关键：不等 load，DOM 一就绪就开
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initSnow);
} else {
  initSnow();
}



// 互动卡片
const AVATAR_SRC = 'Images/mint.png';

/* ==========================================================
   ①  元素
   ========================================================== */

const card = document.getElementById('card');
const avatar = document.getElementById('avatar');
const avatarImg = document.getElementById('avatarImg');
const bubble = document.getElementById('bubble');

/* ==========================================================
   ②  句子池（带权重）+ 洗牌袋
   ----------------------------------------------------------
   权重越高出现越频繁。长句/主句给 2~3，短彩蛋句给 1。
   洗牌袋保证：一轮内每句必出一次，且不会连续两次相同。
   ========================================================== */

const LINES = [
  ['今天也要元气满满哦！', 1],
  ['你已经很棒了，真的', 2],
  ['记得喝水呀 💧', 2],
  ['摸摸头，辛苦啦～', 2],
  ['事已至此，先睡觉吧！', 2],
  ['偷偷告诉你，有人在想你', 2],
  ['一切都会好起来的', 2],
  ['此刻的你，值得被温柔对待', 2],
  ['汪！', 3],
  ['你今天的努力，未来会记得', 1],
  ['偶尔摆烂，也是人生必修课', 1],
  ['你比你自己想象中更厉害', 2],
  ['在做什么？', 2],
  ['嘤QWQ', 1],
  ['喂……你刚刚是不是敲了我的头', 3],
  ['我叫薄荷！薄荷味汪汪', 1],
  ['今天天气怎么样啊=w=', 1],
  ['吃饭了没', 2],
  ['困困困困困', 1],
  ['我还爱你，一如往昔', 1],
  ['老天爷对我睁一只眼闭一只眼只是在对着我架狙', 3],
  ['我是那亡命而生又痴人说梦的飞鸟', 1],
  ['薄荷也不知道哦', 1],
  ['你知道吗，有的人会叫我破格', 2],
  ['你看得到我吗', 1],
  ['多陪我说说话吧', 1],
];

/* Fisher-Yates 洗牌 */
function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* 按权重展开成池子，再洗牌 */
function buildBag() {
  const pool = [];
  for (const [text, weight] of LINES) {
    for (let k = 0; k < weight; k++) pool.push(text);
  }
  return shuffle(pool);
}

let bag = buildBag();
let lastLine = null;

function nextLine() {
  if (bag.length === 0) {
    bag = buildBag();
    // 新一轮首句 == 上一轮末句时，与末尾随机换位，避免跨轮撞车
    if (bag.length > 1 && bag[0] === lastLine) {
      const j = 1 + Math.floor(Math.random() * (bag.length - 1));
      [bag[0], bag[j]] = [bag[j], bag[0]];
    }
  }
  lastLine = bag.pop();
  return lastLine;
}

/* ==========================================================
   ③  头像图片：加载失败就移除，露出下面的 emoji 兜底
   ========================================================== */

avatarImg.addEventListener('error', () => avatarImg.remove(), { once: true });
avatarImg.src = AVATAR_SRC;

/* ==========================================================
   ④  头像「变扁 + 晃动」果冻特效
   ========================================================== */

const SQUASH = [
  { transform: 'scale(1, 1)        rotate(0deg)', offset: 0 },
  { transform: 'scale(1.22, 0.74)  rotate(-6deg)', offset: 0.14 },  // 压扁
  { transform: 'scale(0.86, 1.18)  rotate(7deg)', offset: 0.34 },  // 弹高
  { transform: 'scale(1.12, 0.90)  rotate(-5deg)', offset: 0.52 },  // 晃一晃
  { transform: 'scale(0.95, 1.06)  rotate(3deg)', offset: 0.70 },
  { transform: 'scale(1.03, 0.98)  rotate(-1.5deg)', offset: 0.86 },
  { transform: 'scale(1, 1)        rotate(0deg)', offset: 1 },
];

function playSquash() {
  avatar.getAnimations().forEach(a => a.cancel());   // 连点也能立刻重播
  avatar.animate(SQUASH, { duration: 700, easing: 'ease-out' });
}

/* ==========================================================
   ⑤  粒子：emoji + 光点混合，多维随机
   ----------------------------------------------------------
   随机维度：类型 / 形状 / 大小 / 颜色 / 数量 / 距离 / 旋转 /
             时长 / 延迟 / 起始缩放 / 小概率大爆发
   ========================================================== */

const EMOJIS = [
  '✨', '💫', '⭐️', '💗', '🌸', '💖', '🎉',
  '🍃', '🫧', '☘️', '💚', '🩵', '🌟', '🎀', '🫶',
];

function spawnParticles(multiplier = 1) {
  const rect = avatar.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  // 12% 概率触发大爆发
  const burst = Math.random() < 0.12 ? 2.2 : 1;
  const count = Math.round((4 + Math.random() * 4) * burst * multiplier);
  const spread = (burst > 1 ? 1.6 : 1) * multiplier;

  for (let i = 0; i < count; i++) {
    const p = document.createElement('span');
    p.className = 'particle-r5t8y';              // 复用现有定位样式
    p.style.pointerEvents = 'none';

    const isEmoji = Math.random() < 0.8;         // 80% emoji / 20% 光点

    if (isEmoji) {
      p.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      p.style.fontSize = (12 + Math.random() * 12) + 'px';   // 12~24px
    } else {
      const d = 4 + Math.random() * 6;                        // 4~10px
      p.style.width = d + 'px';
      p.style.height = d + 'px';
      p.style.background = `hsl(${Math.random() * 360} 85% 70%)`;
      p.style.borderRadius = '50%';
      p.style.filter = 'blur(.4px)';
    }

    p.style.left = cx + 'px';
    p.style.top = cy + 'px';
    document.body.appendChild(p);

    const angle = Math.random() * Math.PI * 2;
    const dist = (40 + Math.random() * 80) * spread;
    const dx = Math.cos(angle) * dist;
    const dy = Math.sin(angle) * dist - 35;               // 整体上飘一点
    const spin = (Math.random() * 240 - 120).toFixed(0);
    const scale0 = 0.2 + Math.random() * 0.3;                 // 起始大小随机
    const dur = 550 + Math.random() * 500;
    const delay = Math.random() * 100;                       // 错峰飞出

    p.animate([
      { transform: `translate(-50%, -50%) scale(${scale0}) rotate(0deg)`, opacity: 1 },
      {
        transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(1) rotate(${spin}deg)`,
        opacity: 0,
      },
    ], {
      duration: dur,
      delay,
      easing: 'cubic-bezier(.15, .7, .3, 1)',
      fill: 'forwards',
    }).onfinish = () => p.remove();
  }
}

/* ==========================================================
   ⑥  特殊句反应：句子 → 粒子倍率 / 额外效果
   ========================================================== */

const SPECIAL = {
  '汪！': { particle: 1.8 },
  '嘤QWQ': { particle: 0.6 },
  '喂……你刚刚是不是敲了我的头': { particle: 1.4 },
  '多陪我说说话吧': { particle: 0.5 },
};

/* ==========================================================
   ⑦  主交互
   ========================================================== */

function react() {
  playSquash();

  const text = nextLine();
  const effect = SPECIAL[text] || {};
  spawnParticles(effect.particle ?? 1);

  bubble.textContent = text;
  bubble.classList.remove('anim-r5t8y');
  void bubble.offsetWidth;              // 强制重排，让动画可以重复播放
  bubble.classList.add('anim-r5t8y');

  if (navigator.vibrate) navigator.vibrate(12);
}

card.addEventListener('click', react);

card.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    react();
  }
});