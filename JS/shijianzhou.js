(function () {
  'use strict';

  /* ============================================================
   * 1. 数据源
   * ============================================================ */
  const DATA = [
    {
      id: 1,
      date: '2026.11.4',
      title: '第一篇文章',
      desc: '从随便说说到真正实践',
      cover: 'https://picsum.photos/seed/timeline-a/1200/800',
      content: `
        <p>九月份的时候我突然想看《噩梦时代》了，这是2019年开始连载的一本互动式对话小说</p>
        <p>因其原发布地址“快点阅读”现今广告巨多，小说质量堪忧所以不想给它氪vip（当然还因为我充了vip也可能会看一半懒得看了，这事已经发生过一次了）</p>
        <p>于是我去找了它的txt资源，虽然b站有录屏但是我觉得看起来不够方便，看着看着我发现错别字太多，分段不合理，毫无沉浸感</p>
        <p>然后我想到了之前看的《我是蜘蛛又怎样》，格式是epub的有插图有表格，俺寻思没准也能做个对话框呢</p>
        <p>问了大肥鱼它说“当然可以！”，然后我们一起鼓捣了差不多半个月，我总是想着再还原一点就好了</p>
        <p>于是越做越多从分左右位套对话框，到给名字单独做效果，再到给每个人物都加个头像吧！（然后去找了一个捏头像的网站，手动捏了一百多个头像了）</p>
        <p>最后到想要实现互动阅读的效果，放弃了epub转而去做了静态网页，高强度做了半个多月网页还原了一百章，也在b站和贴吧分享了自己的网页，朋友也帮我发了个抖音（虽然很少人看就是了，噩梦时代已经是冷门中的冷门了）</p>
        <p>因为又迷上了做个赛博小窝，所以很久没更新噩梦时代了~~但我还是会继续更新的，虽然不一定有人看吧</p>
        <p>就这样！这个页面不再是空空的了哦！</p>`
    }
  ];

  /* ============================================================
   * 2. 渲染时间轴
   * ============================================================ */
  const timelineEl = document.getElementById('timeline-t5w1');

  timelineEl.innerHTML = DATA.map(function (item) {
    return `
      <div class="timeline-item-m7c1">
        <span class="timeline-dot-e2q6"></span>
        <a class="card-p3y7" href="#detail-${item.id}" data-id="${item.id}">
          <div class="card-cover-g6j2" style="background-image:url('${item.cover}')"></div>
          <div class="card-body-s1n9">
            <span class="card-date-a4d5">${item.date}</span>
            <h3 class="card-title-k8v3">${item.title}</h3>
            <p class="card-desc-x2m7">${item.desc}</p>
            <span class="card-more-c5r1">
              查看详情
              <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
                <path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor"
                      stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </span>
          </div>
        </a>
      </div>`;
  }).join('');

  const items = Array.prototype.slice.call(
    timelineEl.querySelectorAll('.timeline-item-m7c1')
  );

  /* ============================================================
   * 3. 背景图层切换（双缓冲交叉淡入淡出）
   * ============================================================ */
  const bgLayers = [
    document.getElementById('bgA-r2x7'),
    document.getElementById('bgB-m9k3')
  ];
  let activeLayer = 0;      // 当前显示的是哪一层
  let currentCover = '';    // 当前背景图 URL，避免重复设置

  function setCover(url) {
    if (!url || url === currentCover) return;
    currentCover = url;

    const next = 1 - activeLayer;
    bgLayers[next].style.backgroundImage = 'url("' + url + '")';

    // 强制一次重排，保证 transition 正常触发
    void bgLayers[next].offsetWidth;

    bgLayers[next].classList.add('active-w7p3');
    bgLayers[activeLayer].classList.remove('active-w7p3');
    activeLayer = next;
  }

  /* 图片预加载，避免切换时白屏 */
  function preloadImages() {
    DATA.forEach(function (item) {
      const img = new Image();
      img.src = item.cover;
    });
  }
  if ('requestIdleCallback' in window) {
    requestIdleCallback(preloadImages, { timeout: 2500 });
  } else {
    setTimeout(preloadImages, 900);
  }

  /* ============================================================
   * 4. 滚动检测：找出最靠近视口中线的那张卡片
   * ============================================================ */
  let currentIndex = -1;
  let ticking = false;

  function pickActiveIndex() {
    const vh = window.innerHeight;
    const center = vh / 2;
    let bestIndex = -1;
    let bestDist = Infinity;

    for (let i = 0; i < items.length; i++) {
      const rect = items[i].getBoundingClientRect();

      // 完全不在视口内则跳过
      if (rect.bottom <= 0 || rect.top >= vh) continue;

      // 取"可见部分"的中心，与视口中心比较
      const visibleTop = Math.max(rect.top, 0);
      const visibleBottom = Math.min(rect.bottom, vh);
      const visibleCenter = (visibleTop + visibleBottom) / 2;

      const dist = Math.abs(visibleCenter - center);
      if (dist < bestDist) {
        bestDist = dist;
        bestIndex = i;
      }
    }
    return bestIndex;
  }

  function update() {
    ticking = false;

    const idx = pickActiveIndex();
    if (idx === -1 || idx === currentIndex) return;  // 首屏/尾部区域保持当前背景

    currentIndex = idx;
    setCover(DATA[idx].cover);

    for (let i = 0; i < items.length; i++) {
      items[i].classList.toggle('is-active-f9h4', i === idx);
    }
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  window.addEventListener('orientationchange', onScroll);

  /* ============================================================
   * 5. 卡片入场动画
   * ============================================================ */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-u5a8');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -80px 0px', threshold: 0 });

    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add('in-u5a8'); });
  }

  /* ============================================================
   * 6. 详情页（hash 路由 + 覆盖层）
   * ============================================================ */
  const detailEl = document.getElementById('detail-z8n4');
  const dCover   = document.getElementById('dCover-p7j2');
  const dDate    = document.getElementById('dDate-h1v9');
  const dTitle   = document.getElementById('dTitle-s4b8');
  const dBody    = document.getElementById('dBody-g6f3');

  function openDetail(id) {
    const item = DATA.find(function (d) { return d.id === Number(id); });
    if (!item) return;

    dCover.style.backgroundImage = 'url("' + item.cover + '")';
    dDate.textContent  = item.date;
    dTitle.textContent = item.title;
    dBody.innerHTML    = item.content;

    detailEl.classList.add('show-b4q8');
    detailEl.setAttribute('aria-hidden', 'false');
    detailEl.scrollTop = 0;
    document.body.classList.add('no-scroll-d3z9');

    history.pushState({ detail: item.id }, '', '#detail-' + item.id);
  }

  function hideDetail() {
    detailEl.classList.remove('show-b4q8');
    detailEl.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('no-scroll-d3z9');
  }

  function closeDetail() {
    if (history.state && history.state.detail) {
      history.back();            // 触发 popstate -> hideDetail
    } else {
      hideDetail();
      if (location.hash.indexOf('#detail-') === 0) {
        history.replaceState(null, '', location.pathname + location.search);
      }
    }
  }

  /* 点击卡片 */
  timelineEl.addEventListener('click', function (e) {
    const card = e.target.closest ? e.target.closest('.card-p3y7') : null;
    if (!card) return;
    e.preventDefault();
    openDetail(card.dataset.id);
  });

  /* 关闭 */
  document.getElementById('dBack-k2q5').addEventListener('click', function (e) {
    e.preventDefault();
    closeDetail();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && detailEl.classList.contains('show-b4q8')) closeDetail();
  });

  window.addEventListener('popstate', function () {
    if (location.hash.indexOf('#detail-') !== 0) hideDetail();
  });

  /* 直接访问带 #detail-x 的链接 */
  if (location.hash.indexOf('#detail-') === 0) {
    openDetail(location.hash.replace('#detail-', ''));
    history.replaceState({ detail: Number(location.hash.replace('#detail-', '')) }, '', location.hash);
  }

    /* ============================================================
   * 7. 初始化
   * ============================================================ */
  
  // 强制先把第一张图的封面设为背景，并给第一项加上激活状态
  if (items.length > 0) {
    setCover(DATA[0].cover);
    currentIndex = 0;
    items[0].classList.add('is-active-f9h4');
  }

  update();

})();