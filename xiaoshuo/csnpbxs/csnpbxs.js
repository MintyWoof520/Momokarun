(function () {
  const $ = id => document.getElementById(id);

  // ===== 关键修复：自动寻找章节数据 =====
  // 如果 volume1.js 里写的是 window.novelChapters，这里就能直接拿到
  const chapters = window.novelChapters || [];

  // 安全检查：如果没找到数据，给个提示，防止页面直接白屏
  if (chapters.length === 0) {
    console.error("⚠️ 没有找到章节数据！请检查 volume1.js 里是不是没有定义 window.novelChapters。");
    document.getElementById('toc').innerHTML = '<li style="color:red; padding:20px;">加载失败：没有找到章节数据，请按 F12 查看控制台报错。</li>';
    return;
  }

  let current = 0;
  let shouldRestoreScroll = false; 
  let isRestoring = false;

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
    if (li && li.dataset.i !== undefined) {
      const i = +li.dataset.i;
      const readData = getReadData();
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

    const content = $('content');
    // 直接读取内容（支持 chapters.js 里的 HTML）
    content.innerHTML = chapters[i].content;

    $('chapterTitle').textContent = chapters[i].title;
    $('prev').disabled = current === 0;
    $('next').disabled = current === chapters.length - 1;

    $('toc').classList.add('hidden');
    $('reader').classList.remove('hidden');
    $('topBack').classList.add('show');

    content.style.animation = 'none';
    void content.offsetWidth;
    content.style.animation = '';

    localStorage.setItem('novel_last_chapter', current);
    
    if (shouldRestoreScroll) {
      const readData = getReadData();
      const targetScroll = readData[current]?.scroll || 0;
      isRestoring = true;
      
      setTimeout(() => {
        window.scrollTo(0, targetScroll);
        updateProgress();
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
    
    let percent = scrollHeight <= 0 ? 100 : (scrollTop / scrollHeight) * 100;
    percent = Math.min(100, Math.max(0, percent));
    $('progress-bar').style.width = percent + '%';

    const readData = getReadData();
    const oldRecord = readData[current] || { percent: 0, scroll: 0 };
    
    if (scrollTop > oldRecord.scroll || percent > 98) {
      readData[current] = { percent: percent, scroll: scrollTop };
      saveReadData(readData);
    }
  }

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
  $('prev').addEventListener('click', () => { shouldRestoreScroll = false; showChapter(current - 1); });
  $('next').addEventListener('click', () => { shouldRestoreScroll = false; showChapter(current + 1); });
  $('back').addEventListener('click', showToc);
  $('topBack').addEventListener('click', showToc);

  document.addEventListener('keydown', e => {
    if ($('reader').classList.contains('hidden')) return;
    if (e.key === 'ArrowLeft') { shouldRestoreScroll = false; showChapter(current - 1); }
    if (e.key === 'ArrowRight') { shouldRestoreScroll = false; showChapter(current + 1); }
    if (e.key === 'Escape') showToc();
  });

  window.addEventListener('popstate', () => {
    if (!$('reader').classList.contains('hidden')) showToc();
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
    if (!$('reader').classList.contains('hidden')) setTimeout(updateProgress, 100);
  }
  $('btnFontUp').addEventListener('click', () => { fontSize = Math.min(28, fontSize + 2); applyFontSize(); });
  $('btnFontDown').addEventListener('click', () => { fontSize = Math.max(14, fontSize - 2); applyFontSize(); });

  // ===== 夜间模式 =====
  function applyNight(on) {
    document.body.classList.toggle('night', on);
    localStorage.setItem('novel_night', on ? '1' : '0');
  }
  $('btnNight').addEventListener('click', () => applyNight(!document.body.classList.contains('night')));

  // ===== 初始化 =====
  renderToc();
  if (localStorage.getItem('novel_night') === '1') applyNight(true);
  const savedFont = localStorage.getItem('novel_fontSize');
  if (savedFont) { fontSize = +savedFont; applyFontSize(); }
})();