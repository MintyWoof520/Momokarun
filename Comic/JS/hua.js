(function () {
    'use strict';

    if (typeof CONFIG === 'undefined' || !CONFIG.chapters || !CONFIG.chapters.length) {
        console.error('CONFIG.chapters 未配置或为空');
        return;
    }

    /* ========== 多 CDN 配置 ========== */
    const CDN_HOSTS = [
        'https://gcore.jsdelivr.net',
        'https://cdn.jsdelivr.net',
        'https://fastly.jsdelivr.net',
    ];
    const LOAD_TIMEOUT = 8000;

    /* ========== 滚动模式分批参数 ========== */
    const BATCH_SIZE = 8;        // 每批创建几张
    const LOAD_AHEAD = 1200;     // 距离底部多少 px 加载下一批

    /* ========== 基础工具 ========== */
    const $ = id => document.getElementById(id);

    /* ========== 状态 ========== */
    let mode = 'scroll';
    let currentChapter = 0;
    let current = 1;
    let loadToken = 0;

    const chapter = () => CONFIG.chapters[currentChapter];
    const totalOf = () => chapter().total;
    const pad = n => String(n).padStart(chapter().pad, '0');

    // 从当前章节 prefix 剥掉域名，只留路径
    const getPath = () => chapter().prefix.replace(/^https?:\/\/[^/]+/, '');
    const urlOf = (n, hostIndex = 0) => {
        const host = CDN_HOSTS[hostIndex] || CDN_HOSTS[0];
        return `${host}${getPath()}${pad(n)}${chapter().ext}`;
    };

    /* ========== DOM ========== */
    const toolbar = $('toolbar');
    const img = $('page');
    const wrapper = $('imgWrapper');
    const flipContainer = $('flipContainer');
    const scrollContainer = $('scrollContainer');
    const loadingEl = $('loading');

    const catalogPanel = $('catalogPanel');
    const catalogGrid = $('catalogGrid');
    const catalogBtn = $('catalogBtn');
    const catalogClose = $('catalogClose');
    const catalogTitle = $('catalogTitle');

    /* ========== 缩放状态 ========== */
    let scale = 1, translateX = 0, translateY = 0, isZoomed = false;

    /* ========== 滚动状态 ========== */
    let scrollBuilt = false;
    let lastScrollTop = 0;
    let loadedCount = 0;             // 当前章节已创建多少张
    const imgTimers = new WeakMap(); // 每张图的超时计时器

    /* ========== 进度记忆 ========== */
    function saveProgress() {
        if (!CONFIG.rememberProgress) return;
        try {
            localStorage.setItem('comicProgress', JSON.stringify({
                chapter: currentChapter,
                page: current
            }));
        } catch (e) { /* ignore */ }
    }

    function loadProgress() {
        if (!CONFIG.rememberProgress) return;
        try {
            const raw = localStorage.getItem('comicProgress');
            if (!raw) return;
            const saved = JSON.parse(raw);
            if (saved && typeof saved.chapter === 'number'
                && saved.chapter >= 0 && saved.chapter < CONFIG.chapters.length) {
                currentChapter = saved.chapter;
                const c = chapter();
                if (typeof saved.page === 'number') {
                    current = Math.min(Math.max(saved.page, 1), c.total);
                }
            }
        } catch (e) { /* ignore */ }
    }

    /* ========== UI ========== */
    function updateUI() {
        $('pageInfo').textContent = chapter().title;
        $('btnPrev').disabled = currentChapter <= 0;
        $('btnNext').disabled = currentChapter >= CONFIG.chapters.length - 1;
        updateCatalogActive();
    }

    /* ============================================================
       章节切换
       ============================================================ */
    function gotoChapter(idx) {
        if (idx < 0 || idx >= CONFIG.chapters.length) return;
        if (idx === currentChapter) return;
        currentChapter = idx;
        current = 1;
        rebuildScrollForNewChapter();
        if (mode === 'flip') showFlipPage(1);
        else showScrollPage(1);
    }

    const prevChapter = () => gotoChapter(currentChapter - 1);
    const nextChapter = () => gotoChapter(currentChapter + 1);

    /* ============================================================
       翻页模式（带 CDN fallback + 超时）
       ============================================================ */
    function applyTransform(withAnimation = true) {
        wrapper.style.transition = (withAnimation && !isZoomed) ? 'transform 0.2s ease-out' : 'none';
        wrapper.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }

    function resetZoom() {
        scale = 1; translateX = 0; translateY = 0; isZoomed = false;
        applyTransform(true);
    }

    function showFlipPage(n) {
        if (n < 1) {
            if (currentChapter > 0) {
                currentChapter--;
                n = chapter().total;
                rebuildScrollForNewChapter();
            } else {
                n = 1;
            }
        } else if (n > totalOf()) {
            if (currentChapter < CONFIG.chapters.length - 1) {
                currentChapter++;
                n = 1;
                rebuildScrollForNewChapter();
            } else {
                n = totalOf();
            }
        }

        n = Math.min(Math.max(n, 1), totalOf());
        if (n === current && img.src && mode === 'flip') return;
        current = n;

        resetZoom();
        const token = ++loadToken;
        img.classList.remove('loaded');
        loadingEl.classList.add('show');

        (function tryLoad(hostIndex) {
            if (hostIndex >= CDN_HOSTS.length) {
                if (token === loadToken) loadingEl.classList.remove('show');
                return;
            }
            const newImg = new Image();
            let timeoutId = null;
            const cleanup = () => {
                if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
                newImg.onload = null;
                newImg.onerror = null;
            };
            newImg.onload = () => {
                cleanup();
                if (token !== loadToken) return;
                img.src = newImg.src;
                img.classList.add('loaded');
                loadingEl.classList.remove('show');
            };
            newImg.onerror = () => {
                cleanup();
                if (token !== loadToken) return;
                tryLoad(hostIndex + 1);
            };
            timeoutId = setTimeout(() => {
                cleanup();
                if (token !== loadToken) return;
                newImg.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
                tryLoad(hostIndex + 1);
            }, LOAD_TIMEOUT);
            newImg.src = urlOf(n, hostIndex);
        })(0);

        updateUI();
        saveProgress();
        [n + 1, n - 1].forEach(p => {
            if (p >= 1 && p <= totalOf()) new Image().src = urlOf(p);
        });
    }

    /* ============================================================
       滚动模式（分批 + CDN fallback + 超时）
       ============================================================ */
    function startScrollImgTimeout(simg) {
        const old = imgTimers.get(simg);
        if (old) clearTimeout(old);

        const t = setTimeout(() => {
            imgTimers.delete(simg);
            if (simg.complete && simg.naturalWidth > 0) return;
            const nextIndex = parseInt(simg.dataset.cdnIndex, 10) + 1;
            if (nextIndex < CDN_HOSTS.length) {
                simg.dataset.cdnIndex = nextIndex;
                simg.src = urlOf(parseInt(simg.dataset.page, 10), nextIndex);
                startScrollImgTimeout(simg);
            }
        }, LOAD_TIMEOUT);

        imgTimers.set(simg, t);
    }

    function onScrollImgError(e) {
        const simg = e.target;
        const t = imgTimers.get(simg);
        if (t) { clearTimeout(t); imgTimers.delete(simg); }

        const nextIndex = parseInt(simg.dataset.cdnIndex, 10) + 1;
        if (nextIndex < CDN_HOSTS.length) {
            simg.dataset.cdnIndex = nextIndex;
            simg.src = urlOf(parseInt(simg.dataset.page, 10), nextIndex);
            startScrollImgTimeout(simg);
        }
    }

    function createScrollImg(i) {
        const simg = document.createElement('img');
        simg.alt = `${chapter().title} 第${i}页`;
        simg.dataset.page = i;
        simg.dataset.cdnIndex = 0;
        simg.src = urlOf(i, 0);

        simg.onload = () => {
            const t = imgTimers.get(simg);
            if (t) { clearTimeout(t); imgTimers.delete(simg); }
        };
        simg.onerror = onScrollImgError;
        startScrollImgTimeout(simg);
        scrollContainer.appendChild(simg);
    }

    function appendBatch() {
        if (loadedCount >= totalOf()) return;
        const end = Math.min(loadedCount + BATCH_SIZE, totalOf());
        for (let i = loadedCount + 1; i <= end; i++) {
            createScrollImg(i);
        }
        loadedCount = end;
    }

    function ensureLoadedUpTo(page) {
        while (loadedCount < page && loadedCount < totalOf()) {
            appendBatch();
        }
    }

    function maybeLoadMore() {
        if (loadedCount >= totalOf()) return;

        let nearBottom = false;
        if (scrollContainer.scrollHeight > scrollContainer.clientHeight + 10) {
            const remain = scrollContainer.scrollHeight - scrollContainer.scrollTop - scrollContainer.clientHeight;
            if (remain < LOAD_AHEAD) nearBottom = true;
        }
        if (!nearBottom) {
            const doc = document.documentElement;
            const st = window.scrollY || doc.scrollTop;
            const ch = window.innerHeight;
            const sh = Math.max(doc.scrollHeight, document.body.scrollHeight);
            if (sh - st - ch < LOAD_AHEAD) nearBottom = true;
        }

        if (nearBottom) appendBatch();
    }

    function onScroll() {
        if (mode !== 'scroll') return;

        const scrollTop = scrollContainer.scrollTop;

        if (scrollTop > lastScrollTop && scrollTop > 50) {
            toolbar.classList.add('hide-toolbar');
        } else if (scrollTop < lastScrollTop || scrollTop <= 50) {
            toolbar.classList.remove('hide-toolbar');
        }
        lastScrollTop = scrollTop;

        let closestPage = 1;
        let minDiff = Infinity;
        const containerCenter = scrollTop + scrollContainer.clientHeight / 2;
        const children = scrollContainer.children;
        for (let i = 0; i < children.length; i++) {
            const child = children[i];
            const childCenter = child.offsetTop + child.clientHeight / 2;
            const diff = Math.abs(childCenter - containerCenter);
            if (diff < minDiff) {
                minDiff = diff;
                closestPage = i + 1;
            }
        }

        if (closestPage !== current) {
            current = closestPage;
            updateUI();
            saveProgress();
        }

        maybeLoadMore();
    }

    function buildScrollMode() {
        if (scrollBuilt) return;
        scrollContainer.innerHTML = '';
        loadedCount = 0;
        appendBatch();
        scrollBuilt = true;
        lastScrollTop = 0;
        scrollContainer.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('scroll', onScroll, { passive: true });
    }

    function showScrollPage(n) {
        if (n < 1) {
            if (currentChapter > 0) {
                currentChapter--;
                rebuildScrollForNewChapter();
                n = chapter().total;
            } else {
                n = 1;
            }
        } else if (n > totalOf()) {
            if (currentChapter < CONFIG.chapters.length - 1) {
                currentChapter++;
                rebuildScrollForNewChapter();
                n = 1;
            } else {
                n = totalOf();
            }
        }

        buildScrollMode();
        ensureLoadedUpTo(n);
        current = Math.min(Math.max(n, 1), totalOf());
        updateUI();
        saveProgress();

        const targetImg = scrollContainer.children[current - 1];
        if (targetImg) {
            requestAnimationFrame(() => {
                targetImg.scrollIntoView({ block: 'center' });
            });
        }
    }

    function rebuildScrollForNewChapter() {
        scrollContainer.removeEventListener('scroll', onScroll);
        window.removeEventListener('scroll', onScroll);
        scrollBuilt = false;
        loadedCount = 0;
        scrollContainer.innerHTML = '';
        lastScrollTop = 0;
        // 清理旧计时器
        for (const simg of scrollContainer.children) {
            const t = imgTimers.get(simg);
            if (t) clearTimeout(t);
        }
    }

    /* ===== 切换模式 ===== */
    function switchMode(newMode) {
        mode = newMode;
        if (mode === 'flip') {
            flipContainer.style.display = 'flex';
            scrollContainer.style.display = 'none';
            $('modeBtn').innerHTML = '<i class="iconfont icon0 icon-dingdan"></i> <span class="text-hide-mobile">切换滚动</span>';
            showFlipPage(current);
        } else {
            flipContainer.style.display = 'none';
            scrollContainer.style.display = 'flex';
            $('modeBtn').innerHTML = '<i class="iconfont icon0 icon-yuedu"></i> <span class="text-hide-mobile">切换翻页</span>';
            showScrollPage(current);
        }
    }

    $('modeBtn').onclick = () => switchMode(mode === 'flip' ? 'scroll' : 'flip');

    const next = () => { mode === 'flip' ? showFlipPage(current + 1) : showScrollPage(current + 1); };
    const prev = () => { mode === 'flip' ? showFlipPage(current - 1) : showScrollPage(current - 1); };

    $('btnNext').onclick = nextChapter;
    $('btnPrev').onclick = prevChapter;

    $('zoneNext').onclick = () => { if (mode === 'flip') next(); };
    $('zonePrev').onclick = () => { if (mode === 'flip') prev(); };

    /* ===== 手势 ===== */
    let startX = 0, startY = 0, initialDistance = 0, initialScale = 1;
    let isSwiping = false, isDraggingImg = false;
    const getDistance = t => Math.hypot(t[0].clientX - t[1].clientX, t[0].clientY - t[1].clientY);

    flipContainer.addEventListener('touchstart', e => {
        if (mode !== 'flip') return;
        if (e.touches.length === 2) {
            initialDistance = getDistance(e.touches);
            initialScale = scale;
            isSwiping = false; isDraggingImg = false;
        } else if (e.touches.length === 1) {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isSwiping = !isZoomed;
            isDraggingImg = isZoomed;
        }
    }, { passive: false });

    flipContainer.addEventListener('touchmove', e => {
        if (mode !== 'flip') return;
        if (e.touches.length === 2) {
            e.preventDefault();
            const newScale = initialScale * (getDistance(e.touches) / initialDistance);
            scale = Math.min(Math.max(newScale, 1), 5);
            isZoomed = scale > 1.05;
            applyTransform(false);
        } else if (e.touches.length === 1 && isDraggingImg && isZoomed) {
            e.preventDefault();
            translateX += e.touches[0].clientX - startX;
            translateY += e.touches[0].clientY - startY;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            applyTransform(false);
        }
    }, { passive: false });

    flipContainer.addEventListener('touchend', e => {
        if (mode !== 'flip') return;
        if (e.touches.length === 0) {
            if (isSwiping && e.changedTouches.length === 1) {
                const dx = e.changedTouches[0].clientX - startX;
                const dy = e.changedTouches[0].clientY - startY;
                if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
                    if (dx < 0) next(); else prev();
                }
            } else if (isDraggingImg && scale < 1.1) {
                resetZoom();
            }
            isSwiping = false;
            isDraggingImg = false;
        }
    });

    let lastTap = 0;
    flipContainer.addEventListener('click', e => {
        if (mode !== 'flip') return;
        const now = Date.now();
        if (now - lastTap < 300) {
            if (isZoomed) {
                resetZoom();
            } else {
                scale = 2.5;
                const rect = flipContainer.getBoundingClientRect();
                translateX = (rect.width / 2 - e.clientX) * (scale - 1);
                translateY = (rect.height / 2 - e.clientY) * (scale - 1);
                isZoomed = true;
                applyTransform(true);
            }
        }
        lastTap = now;
    });

    document.addEventListener('keydown', e => {
        if (mode !== 'flip') return;
        if (e.key === 'ArrowRight' || e.key === ' ') { e.preventDefault(); next(); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); prev(); }
    });

    let wheelLock = 0;
    window.addEventListener('wheel', e => {
        if (mode !== 'flip' || isZoomed) return;
        const now = Date.now();
        if (now - wheelLock < 300 || Math.abs(e.deltaY) < 10) return;
        wheelLock = now;
        e.deltaY > 0 ? next() : prev();
    }, { passive: true });

    /* ===== 目录 ===== */
    function buildCatalog() {
        if (!catalogGrid) return;
        catalogGrid.innerHTML = '';
        if (catalogTitle) {
            catalogTitle.innerHTML = `
                <svg class="icon" aria-hidden="true" style="vertical-align: middle; margin-right: 6px;">
                    <use xlink:href="#icon-file"></use>
                </svg>章节目录
            `;
        }

        CONFIG.chapters.forEach((ch, idx) => {
            const item = document.createElement('div');
            item.className = 'catalog-item';
            item.textContent = ch.title;
            if (idx === currentChapter) item.classList.add('active');

            item.addEventListener('click', () => {
                currentChapter = idx;
                current = 1;
                rebuildScrollForNewChapter();
                if (mode === 'flip') showFlipPage(1);
                else showScrollPage(1);
                hideCatalog();
            });
            catalogGrid.appendChild(item);
        });
    }

    function updateCatalogActive() {
        if (!catalogGrid) return;
        const items = catalogGrid.children;
        for (let i = 0; i < items.length; i++) {
            items[i].classList.toggle('active', i === currentChapter);
        }
    }

    function showCatalog() {
        buildCatalog();
        catalogPanel.classList.add('show');
    }

    function hideCatalog() {
        catalogPanel.classList.remove('show');
    }

    catalogBtn.addEventListener('click', showCatalog);
    catalogClose.addEventListener('click', hideCatalog);
    catalogPanel.addEventListener('click', e => {
        if (e.target === catalogPanel) hideCatalog();
    });

    /* ===== 启动 ===== */
    function init() {
        loadProgress();
        switchMode('scroll');
        updateUI();
        saveProgress();
    }

    init();
})();