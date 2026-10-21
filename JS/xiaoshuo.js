(function () {
  const $ = id => document.getElementById(id);

  // 收集所有章节模板
  const templates = Array.from(document.querySelectorAll('template[id^="ch"]'))
    .sort((a, b) => +a.id.slice(2) - +b.id.slice(2));

  const chapters = templates.map((tpl, i) => {
    const h2 = tpl.content.querySelector('h2');
    const title = h2 ? h2.textContent.trim() : `第 ${i + 1} 章`;
    return { title, templateId: tpl.id };
  });

  let current = 0;
  let shouldRestoreScroll = false;
  let isRestoring = false; // 防止恢复滚动时触发保存覆盖

  // ===== 本地存储管理 =====
  function getReadData() {
    return JSON.parse(localStorage.getItem('novel_read_data') || '{}');
  }
  function saveReadData(data) {
    localStorage.setItem('novel_read_data', JSON.stringify(data));
  }

  // ===== 渲染目录 =====
  function renderToc() {
    const readData = getReadData();
    $('toc').innerHTML = chapters.map((c, i) => {
      let progressHtml = '';
      const record = readData[i];
      if (record) {
        const percent = Math.floor(record.percent || 0);
        if (percent >= 98) {
          progressHtml = `<span class="toc-progress done">已读完</span>`;
        } else if (percent > 0) {
          progressHtml = `<span class="toc-progress">已读 ${percent}%</span>`;
        }
      }
      return `<li data-i="${i}">
        <span>${escapeHtml(c.title)}</span>
        ${progressHtml}
      </li>`;
    }).join('');
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }

  // 目录点击
  $('toc').addEventListener('click', e => {
    const li = e.target.closest('li');
    if (li) {
      const i = +li.dataset.i;
      const readData = getReadData();
      // 如果已有记录，并且不是读完的，准备恢复位置
      if (readData[i] && readData[i].scroll > 0 && readData[i].percent < 98) {
        shouldRestoreScroll = true;
      } else {
        shouldRestoreScroll = false;
      }
      showChapter(i);
    }
  });

  // ===== 显示章节 =====
  function showChapter(i) {
    if (i < 0 || i >= chapters.length) return;
    current = i;

    const tpl = document.getElementById(chapters[i].templateId);
    const content = $('content');

    // 1. 渲染 DOM
    content.innerHTML = '';
    content.appendChild(tpl.content.cloneNode(true));

    $('chapterTitle').textContent = chapters[i].title;
    $('prev').disabled = current === 0;
    $('next').disabled = current === chapters.length - 1;

    $('toc').classList.add('hidden');
    $('reader').classList.remove('hidden');
    $('topBack').classList.add('show');

    // 重播动画
    content.style.animation = 'none';
    void content.offsetWidth;
    content.style.animation = '';

    localStorage.setItem('novel_last_chapter', current);

    // 2. 滚动处理
    if (shouldRestoreScroll) {
      const readData = getReadData();
      const targetScroll = readData[current]?.scroll || 0;
      isRestoring = true;

      // 延迟稍微久一点(50ms)，确保字体和排版已经渲染完毕，计算高度才准确
      setTimeout(() => {
        window.scrollTo(0, targetScroll);
        updateProgress(); // 更新顶部的线
        isRestoring = false;
      }, 50);
    } else {
      window.scrollTo(0, 0);
      setTimeout(updateProgress, 50);
    }

    shouldRestoreScroll = false;
  }

  // ===== 返回目录 =====
  function showToc() {
    if ($('reader').classList.contains('hidden')) return;

    $('reader').classList.add('hidden');
    $('toc').classList.remove('hidden');
    $('topBack').classList.remove('show');
    window.scrollTo(0, 0);
    $('progress-bar').style.width = '0%';

    renderToc();
  }

  // ===== 核心：更新并保存阅读进度 =====
  function updateProgress() {
    if ($('reader').classList.contains('hidden') || isRestoring) return;

    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;

    let percent = 0;

    // 修复 Bug：如果内容不够长，scrollHeight 会是负数或 0
    if (scrollHeight <= 0) {
      // 如果屏幕还没显示完一章，默认算作 100% 已读完
      percent = 100;
    } else {
      percent = (scrollTop / scrollHeight) * 100;
    }

    // 防止越界
    percent = Math.min(100, Math.max(0, percent));

    // 更新顶部进度线
    $('progress-bar').style.width = percent + '%';

    // 保存进度
    const readData = getReadData();
    const oldRecord = readData[current] || { percent: 0, scroll: 0 };

    // 如果比原来读得多，或者快到底了，就保存
    if (scrollTop > oldRecord.scroll || percent > 98) {
      readData[current] = {
        percent: percent,
        scroll: scrollTop
      };
      saveReadData(readData);
    }
  }

  // 监听滚动
  window.addEventListener('scroll', () => {
    window.requestAnimationFrame(updateProgress);
  });

  // ===== 清空记录 =====
  $('btnClear').addEventListener('click', () => {
    if (confirm('确定要清空所有阅读进度吗？清空后不可恢复。')) {
      localStorage.removeItem('novel_read_data');
      localStorage.removeItem('novel_last_chapter');
      renderToc();
      $('progress-bar').style.width = '0%';
    }
  });

  // ===== 按键 / 点击绑定 =====
  // 如果是通过翻页按钮进入，强制从顶部开始看
  $('prev').addEventListener('click', () => { shouldRestoreScroll = false; showChapter(current - 1); });
  $('next').addEventListener('click', () => { shouldRestoreScroll = false; showChapter(current + 1); });
  $('back').addEventListener('click', showToc);
  $('topBack').addEventListener('click', showToc);

  // 键盘翻页
  document.addEventListener('keydown', e => {
    if ($('reader').classList.contains('hidden')) return;
    if (e.key === 'ArrowLeft') { shouldRestoreScroll = false; showChapter(current - 1); }
    if (e.key === 'ArrowRight') { shouldRestoreScroll = false; showChapter(current + 1); }
    if (e.key === 'Escape') showToc();
  });

  // ===== 解决手机/浏览器返回键问题 =====
  window.addEventListener('popstate', (e) => {
    if (!$('reader').classList.contains('hidden')) {
      showToc();
    }
  });

  const originalShowChapter = showChapter;
  showChapter = function (i) {
    if (i < 0 || i >= chapters.length) return;
    if ($('reader').classList.contains('hidden')) {
      history.pushState({ page: 'reader' }, '', '#chapter-' + i);
    } else {
      history.replaceState({ page: 'reader' }, '', '#chapter-' + i);
    }
    originalShowChapter(i);
  };

  // ===== 字号调节 =====
  let fontSize = 18;
  function applyFontSize() {
    document.body.style.fontSize = fontSize + 'px';
    localStorage.setItem('novel_fontSize', fontSize);
    if (!$('reader').classList.contains('hidden')) {
      setTimeout(updateProgress, 100);
    }
  }
  $('btnFontUp').addEventListener('click', () => {
    fontSize = Math.min(28, fontSize + 2); applyFontSize();
  });
  $('btnFontDown').addEventListener('click', () => {
    fontSize = Math.max(14, fontSize - 2); applyFontSize();
  });

  // ===== 夜间模式 =====
  function applyNight(on) {
    document.body.classList.toggle('night', on);
    localStorage.setItem('novel_night', on ? '1' : '0');
  }
  $('btnNight').addEventListener('click', () => {
    applyNight(!document.body.classList.contains('night'));
  });

  // ===== 初始化 =====
  renderToc();

  if (localStorage.getItem('novel_night') === '1') applyNight(true);
  const savedFont = localStorage.getItem('novel_fontSize');
  if (savedFont) { fontSize = +savedFont; applyFontSize(); }

  // 自动续读
  // const savedChapter = localStorage.getItem('novel_last_chapter');
  // if (savedChapter !== null && +savedChapter < chapters.length) {
  //   shouldRestoreScroll = true; 
  //   showChapter(+savedChapter);
  // }
})();