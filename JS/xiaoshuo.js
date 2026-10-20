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

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }

  function renderToc() {
    $('toc').innerHTML = chapters
      .map((c, i) => `<li data-i="${i}">${escapeHtml(c.title)}</li>`)
      .join('');
  }

  $('toc').addEventListener('click', e => {
    const li = e.target.closest('li');
    if (li) showChapter(+li.dataset.i);
  });

  function showChapter(i) {
    if (i < 0 || i >= chapters.length) return;
    current = i;

    const tpl = document.getElementById(chapters[i].templateId);
    const content = $('content');

    content.innerHTML = '';
    content.appendChild(tpl.content.cloneNode(true));

    const innerH2 = content.querySelector('h2');
    if (innerH2) innerH2.remove();

    $('chapterTitle').textContent = chapters[i].title;
    $('prev').disabled = current === 0;
    $('next').disabled = current === chapters.length - 1;

    $('toc').classList.add('hidden');
    $('reader').classList.remove('hidden');

    // 重播淡入动画
    content.style.animation = 'none';
    void content.offsetWidth;
    content.style.animation = '';

    localStorage.setItem('novel_chapter', current);
    window.scrollTo(0, 0);
  }

  function showToc() {
    $('reader').classList.add('hidden');
    $('toc').classList.remove('hidden');
    window.scrollTo(0, 0);
  }

  $('prev').addEventListener('click', () => showChapter(current - 1));
  $('next').addEventListener('click', () => showChapter(current + 1));
  $('back').addEventListener('click', showToc);
  $('backTop').addEventListener('click', showToc);

  document.addEventListener('keydown', e => {
    if ($('reader').classList.contains('hidden')) return;
    if (e.key === 'ArrowLeft')  showChapter(current - 1);
    if (e.key === 'ArrowRight') showChapter(current + 1);
    if (e.key === 'Escape')     showToc();
  });

  // 字号调节
  let fontSize = 18;
  function applyFontSize() {
    document.body.style.fontSize = fontSize + 'px';
    localStorage.setItem('novel_fontSize', fontSize);
  }
  $('btnFontUp').addEventListener('click', () => {
    fontSize = Math.min(28, fontSize + 2); applyFontSize();
  });
  $('btnFontDown').addEventListener('click', () => {
    fontSize = Math.max(14, fontSize - 2); applyFontSize();
  });

  // 夜间模式
  function applyNight(on) {
    document.body.classList.toggle('night', on);
    localStorage.setItem('novel_night', on ? '1' : '0');
  }
  $('btnNight').addEventListener('click', () => {
    applyNight(!document.body.classList.contains('night'));
  });

  // 初始化
  renderToc();

  if (localStorage.getItem('novel_night') === '1') applyNight(true);
  const savedFont = localStorage.getItem('novel_fontSize');
  if (savedFont) { fontSize = +savedFont; applyFontSize(); }

  // 想自动续读上次章节，取消下面注释
  // const savedChapter = localStorage.getItem('novel_chapter');
  // if (savedChapter !== null) showChapter(+savedChapter);
})();