(function () {
    'use strict';

    if (typeof CONFIG === 'undefined' || !CONFIG.chapters || !CONFIG.chapters.length) {
        console.error('CONFIG.chapters 未配置或为空');
        return;
    }

    /* ========== 基础工具 ========== */
    const $ = id => document.getElementById(id);

    /* ========== 状态 ========== */
    let mode = 'scroll';            // 默认滚动模式
    let currentChapter = 0;         // 章节索引（0-based）
    let current = 1;                // 当前章节内的页码（1-based）
    let loadToken = 0;

    // 当前章节对象与动态取值
    const chapter = () => CONFIG.chapters[currentChapter];
    const totalOf = () => chapter().total;
    const pad = n => String(n).padStart(chapter().pad, '0');
    const urlOf = n => `${chapter().prefix}${pad(n)}${chapter().ext}`;

    /* ========== DOM ========== */
    const toolbar = $('toolbar');
    const img = $('page');
    const wrapper = $('imgWrapper');
    const flipContainer = $('flipContainer');
    const scrollContainer = $('scrollContainer');
    const loadingEl = $('loading');

    // 目录
    const catalogPanel = $('catalogPanel');
    const catalogGrid = $('catalogGrid'); // 改为单级目录容器
    const catalogBtn = $('catalogBtn');
    const catalogClose = $('catalogClose');
    const catalogTitle = $('catalogTitle');

    /* ========== 缩放状态（翻页模式） ========== */
    let scale = 1, translateX = 0, translateY = 0, isZoomed = false;

    let scrollBuilt = false;        // 滚动内容是否已构建（当前章节）
    let lastScrollTop = 0;

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

    /* ========== UI 更新 ========== */
    function updateUI() {
        const total = totalOf();
        $('pageInfo').textContent = `${chapter().title} ${current} / ${total}`;
        $('btnPrev').disabled = $('btnFirst').disabled = current <= 1 && currentChapter === 0;
        $('btnNext').disabled = $('btnLast').disabled =
            current >= total && currentChapter === CONFIG.chapters.length - 1;

        updateCatalogActive();
    }

    /* ============================================================
       翻页模式
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
        // 跨章节边界处理
        if (n < 1) {
            if (currentChapter > 0) {
                currentChapter--;
                n = chapter().total;
                scrollBuilt = false;
            } else {
                n = 1;
            }
        } else if (n > totalOf()) {
            if (currentChapter < CONFIG.chapters.length - 1) {
                currentChapter++;
                n = 1;
                scrollBuilt = false;
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

        const newImg = new Image();
        newImg.onload = () => {
            if (token !== loadToken) return;
            img.src = newImg.src;
            img.classList.add('loaded');
            loadingEl.classList.remove('show');
        };
        newImg.onerror = () => {
            if (token !== loadToken) return;
            loadingEl.classList.remove('show');
        };
        newImg.src = urlOf(n);

        updateUI();
        saveProgress();

        [n + 1, n - 1].forEach(p => {
            if (p >= 1 && p <= totalOf()) new Image().src = urlOf(p);
        });
    }

    /* ============================================================
       滚动模式
       ============================================================ */
    function buildScrollMode() {
        if (scrollBuilt) return;
        scrollContainer.innerHTML = '';
        const total = totalOf();
        for (let i = 1; i <= total; i++) {
            const simg = document.createElement('img');
            simg.src = urlOf(i);
            simg.loading = 'lazy';
            simg.alt = `${chapter().title} 第${i}页`;
            scrollContainer.appendChild(simg);
        }
        scrollBuilt = true;

        lastScrollTop = 0;
        scrollContainer.addEventListener('scroll', onScroll, { passive: true });
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
    }

    function showScrollPage(n) {
        // 跨章节边界处理
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
        scrollBuilt = false;
        scrollContainer.innerHTML = '';
    }

    /* ===== 切换与按钮 ===== */
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
    const first = () => {
        if (mode === 'flip') showFlipPage(1);
        else showScrollPage(1);
    };
    const last = () => {
        if (mode === 'flip') showFlipPage(totalOf());
        else showScrollPage(totalOf());
    };

    $('btnNext').onclick = next;
    $('btnPrev').onclick = prev;
    $('btnFirst').onclick = first;
    $('btnLast').onclick = last;
    $('zoneNext').onclick = () => { if (mode === 'flip') next(); };
    $('zonePrev').onclick = () => { if (mode === 'flip') prev(); };

    /* ============================================================
       手势处理（翻页模式）
       ============================================================ */
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

    /* ============================================================
目录（单级：只展示第几话）
============================================================ */
    function buildCatalog() {
        if (!catalogGrid) return;
        catalogGrid.innerHTML = '';
        catalogTitle.innerHTML = `
    <svg class="icon" aria-hidden="true" style="vertical-align: middle; margin-right: 6px;">
        <use xlink:href="#icon-file"></use>
    </svg>章节目录
`;

        CONFIG.chapters.forEach((ch, idx) => {
            const item = document.createElement('div');
            item.className = 'catalog-item';
            item.textContent = ch.title;

            // 当前阅读的章节高亮
            if (idx === currentChapter) {
                item.classList.add('active');
            }

            item.addEventListener('click', () => {
                // 切换章节
                currentChapter = idx;
                current = 1; // 进入新章节默认从第 1 页开始

                // 强制重建滚动容器
                rebuildScrollForNewChapter();

                // 根据当前模式跳转
                if (mode === 'flip') {
                    showFlipPage(1);
                } else {
                    showScrollPage(1);
                }

                hideCatalog();
            });
            catalogGrid.appendChild(item);
        });
    }

    // 更新高亮
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

    /* ============================================================
       启动
       ============================================================ */
    function init() {
        loadProgress();
        switchMode('scroll');   // 默认滚动；内部会构建滚动内容并定位到当前页
        updateUI();
        saveProgress();
    }

    init();
})();