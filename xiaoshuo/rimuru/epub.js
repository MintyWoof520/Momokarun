(function () {
    const $ = id => document.getElementById(id);

    const book = window.novelBook;
    if (!book || !book.volumes || !book.volumes.length) {
        console.error('⚠️ 没有找到 book.js / window.novelBook');
        $('toc').innerHTML =
            '<li style="color:red;padding:20px;">加载失败：没有找到目录数据。</li>';
        return;
    }

    // 扁平索引：每一项 = { vi, ci, volumeTitle }
    const flatMeta = [];
    book.volumes.forEach((v, vi) => {
        (v.chapters || []).forEach((c, ci) => {
            flatMeta.push({ vi, ci, volumeTitle: v.volumeTitle || ('第' + (vi + 1) + '卷') });
        });
    });

    const READ_KEY = 'novel_read_data_v3';
    const LAST_KEY = 'novel_last_chapter_v3';

    let current = 0;
    let shouldRestoreScroll = false;
    let isRestoring = false;
    const collapsedVols = new Set();
    // 初始化时，把所有卷的索引（0, 1, 2...）都放进折叠集合里
    if (book && book.volumes) {
        book.volumes.forEach((_, vi) => collapsedVols.add(vi));
    }
    const volumeDataCache = {}; // file -> chapters[]

    // ===== 懒加载某一卷 =====
    function loadVolume(vi) {
        const vol = book.volumes[vi];
        const file = vol.file;
        if (volumeDataCache[file]) return Promise.resolve(volumeDataCache[file]);

        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = file;
            s.onload = () => {
                const data = (window.novelVolumeData && window.novelVolumeData[file]) || [];
                volumeDataCache[file] = data;
                resolve(data);
            };
            s.onerror = () => reject(new Error('加载失败：' + file));
            document.head.appendChild(s);
        });
    }

    // ===== 存储 =====
    function getReadData() {
        try { return JSON.parse(localStorage.getItem(READ_KEY) || '{}'); }
        catch (e) { return {}; }
    }
    function saveReadData(data) {
        localStorage.setItem(READ_KEY, JSON.stringify(data));
    }

    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, m => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[m]));
    }

    // ===== 渲染目录（不需要加载正文）=====
    function renderToc() {
        const readData = getReadData();
        let html = '';
        let flatIndex = 0;

        book.volumes.forEach((vol, vi) => {
            const collapsed = collapsedVols.has(vi);
            const volTitle = vol.volumeTitle || ('第 ' + (vi + 1) + ' 卷');
            const count = (vol.chapters || []).length;

            const coverHtml = (!collapsed && vol.cover) 
  ? `<img src="${vol.cover}" class="vol-cover" alt="封面" onerror="this.style.display='none'">` 
  : (!collapsed ? `<div class="vol-cover default-cover">📖</div>` : '');

            html += `<li class="vol-heading" data-vol="${vi}">
        ${coverHtml}
        <div class="vol-info">
          <span class="vol-toggle">${collapsed ? '▸' : '▾'} ${escapeHtml(volTitle)}</span>
          <span class="vol-count">${count} 章</span>
        </div>
      </li>`;

            (vol.chapters || []).forEach(ch => {
                const i = flatIndex++;
                let prog = '';
                const rec = readData[i];
                if (rec) {
                    const p = Math.floor(rec.percent || 0);
                    if (p >= 98) prog = `<span class="toc-progress done">已读完</span>`;
                    else if (p > 0) prog = `<span class="toc-progress">已读 ${p}%</span>`;
                }
                const hidden = collapsed ? ' style="display:none"' : '';
                html += `<li data-i="${i}" class="chapter-item"${hidden}>
          <span>${escapeHtml(ch.title)}</span>${prog}
        </li>`;
            });
        });

        $('toc').innerHTML = html;
    }

    $('toc').addEventListener('click', e => {
        const volLi = e.target.closest('.vol-heading');
        if (volLi) {
            const vi = +volLi.dataset.vol;
            if (collapsedVols.has(vi)) collapsedVols.delete(vi);
            else collapsedVols.add(vi);
            renderToc();
            return;
        }
        const li = e.target.closest('li');
        if (li && li.dataset.i !== undefined) {
            const i = +li.dataset.i;
            const readData = getReadData();
            shouldRestoreScroll = !!(readData[i] && readData[i].scroll > 0 && readData[i].percent < 98);
            showChapter(i);
        }
    });

    // ===== 显示章节（异步）=====
    async function showChapter(i) {
        if (i < 0 || i >= flatMeta.length) return;
        const meta = flatMeta[i];
        const vol = book.volumes[meta.vi];
        const chTitle = (vol.chapters[meta.ci] || {}).title || '';

        // 先切页面，避免用户以为没反应
        $('toc').classList.add('hidden');
        $('reader').classList.remove('hidden');
        $('topBack').classList.add('show');
        document.querySelector('.book-header').classList.add('hidden');
        $('chapterTitle').textContent = chTitle;
        if ($('volumeLabel')) $('volumeLabel').textContent = meta.volumeTitle;
        $('content').innerHTML = '<p style="color:#888;text-align:center;">加载中…</p>';

        let data;
        try {
            data = await loadVolume(meta.vi);
        } catch (err) {
            $('content').innerHTML = `<p style="color:#c0392b;">${escapeHtml(err.message)}</p>`;
            return;
        }

        const chapter = data[meta.ci];
        if (!chapter) {
            $('content').innerHTML = '<p style="color:#c0392b;">章节数据缺失</p>';
            return;
        }

        current = i;
        $('content').innerHTML = chapter.content || '';
        $('prev').disabled = current === 0;
        $('next').disabled = current === flatMeta.length - 1;

        $('content').style.animation = 'none';
        void $('content').offsetWidth;
        $('content').style.animation = '';

        localStorage.setItem(LAST_KEY, current);

        if (shouldRestoreScroll) {
            const readData = getReadData();
            const target = (readData[current] && readData[current].scroll) || 0;
            isRestoring = true;
            setTimeout(() => {
                window.scrollTo(0, target);
                updateProgress();
                isRestoring = false;
            }, 50);
        } else {
            window.scrollTo(0, 0);
            setTimeout(updateProgress, 50);
        }
        shouldRestoreScroll = false;
    }

    function showToc() {
        if ($('reader').classList.contains('hidden')) return;
        $('reader').classList.add('hidden');
        $('toc').classList.remove('hidden');
        $('topBack').classList.remove('show');
        document.querySelector('.book-header').classList.remove('hidden');
        window.scrollTo(0, 0);
        $('progress-bar').style.width = '0%';
        renderToc();
    }

    function updateProgress() {
        if ($('reader').classList.contains('hidden') || isRestoring) return;
        const st = window.scrollY || document.documentElement.scrollTop;
        const sh = document.documentElement.scrollHeight - window.innerHeight;
        let p = sh <= 0 ? 100 : (st / sh) * 100;
        p = Math.min(100, Math.max(0, p));
        $('progress-bar').style.width = p + '%';

        const data = getReadData();
        const old = data[current] || { percent: 0, scroll: 0 };
        if (st > old.scroll || p > 98) {
            data[current] = { percent: p, scroll: st };
            saveReadData(data);
        }
    }
    window.addEventListener('scroll', () => window.requestAnimationFrame(updateProgress));

    $('btnClear').addEventListener('click', () => {
        if (confirm('确定要清空所有阅读进度吗？')) {
            localStorage.removeItem(READ_KEY);
            localStorage.removeItem(LAST_KEY);
            renderToc();
            $('progress-bar').style.width = '0%';
        }
    });

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
        if (i < 0 || i >= flatMeta.length) return;
        if ($('reader').classList.contains('hidden')) {
            history.pushState({ page: 'reader' }, '', '#chapter-' + i);
        } else {
            history.replaceState({ page: 'reader' }, '', '#chapter-' + i);
        }
        originalShowChapter(i);
    };

    let fontSize = 18;
    function applyFontSize() {
        document.body.style.fontSize = fontSize + 'px';
        localStorage.setItem('novel_fontSize', fontSize);
        if (!$('reader').classList.contains('hidden')) setTimeout(updateProgress, 100);
    }
    $('btnFontUp').addEventListener('click', () => { fontSize = Math.min(28, fontSize + 2); applyFontSize(); });
    $('btnFontDown').addEventListener('click', () => { fontSize = Math.max(14, fontSize - 2); applyFontSize(); });

    function applyNight(on) {
        document.body.classList.toggle('night', on);
        localStorage.setItem('novel_night', on ? '1' : '0');
    }
    $('btnNight').addEventListener('click', () => applyNight(!document.body.classList.contains('night')));

    renderToc();
    if (localStorage.getItem('novel_night') === '1') applyNight(true);
    const savedFont = localStorage.getItem('novel_fontSize');
    if (savedFont) { fontSize = +savedFont; applyFontSize(); }
})();