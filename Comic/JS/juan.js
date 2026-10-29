(function () {
    // 确保 CONFIG 存在
    if (typeof CONFIG === 'undefined') {
        console.error('CONFIG 未定义，请检查上方配置');
        return;
    }

    const pad = n => String(n).padStart(CONFIG.pad, '0');
    const urlOf = n => `${CONFIG.prefix}${pad(n)}${CONFIG.ext}`;

    const $ = id => document.getElementById(id);
    const toolbar = $('toolbar');

    // ---------- 状态 ----------
    let mode = 'scroll';            // 默认模式为滚动
    let current = 1;
    let loadToken = 0;

    // 修复核心：增加一个“锁定滚动”的变量，防止跳转时被监听事件覆盖
    let isAutoScrolling = false;
    let scrollTimeout = null;

    const img = $('page');
    const wrapper = $('imgWrapper');
    const flipContainer = $('flipContainer');
    let scale = 1, translateX = 0, translateY = 0, isZoomed = false;

    const scrollContainer = $('scrollContainer');
    let scrollBuilt = false;

    // 目录相关 DOM
    const catalogPanel = $('catalogPanel');
    const catalogGrid = $('catalogGrid');
    const catalogBtn = $('catalogBtn');
    const catalogClose = $('catalogClose');

    // 记住进度
    if (CONFIG.rememberProgress) {
        const saved = Number(localStorage.getItem('comicPage'));
        if (saved >= 1 && saved <= CONFIG.total) current = saved;
    }

    // ---------- 通用UI更新 ----------
    function updateUI() {
        $('pageInfo').textContent = `${current} / ${CONFIG.total}`;

        // 兼容你删除了第一页/最后一页按钮的情况
        const btnFirst = $('btnFirst');
        const btnLast = $('btnLast');
        if (btnFirst) btnFirst.disabled = (current <= 1);
        if (btnLast) btnLast.disabled = (current >= CONFIG.total);

        const btnPrev = $('btnPrev');
        const btnNext = $('btnNext');
        if (btnPrev) btnPrev.disabled = (current <= 1);
        if (btnNext) btnNext.disabled = (current >= CONFIG.total);

        // 更新目录高亮
        updateCatalogActive(current);
    }

    /* ===== 翻页模式 ===== */
    function applyTransform(withAnimation = true) {
        wrapper.style.transition = (withAnimation && !isZoomed) ? 'transform 0.2s ease-out' : 'none';
        wrapper.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
    }
    function resetZoom() {
        scale = 1; translateX = 0; translateY = 0; isZoomed = false;
        applyTransform(true);
    }

    function showFlipPage(n) {
        n = Math.min(Math.max(n, 1), CONFIG.total);
        if (n === current && img.src && mode === 'flip') return;
        current = n;

        resetZoom();
        const token = ++loadToken;
        img.classList.remove('loaded');
        $('loading').classList.add('show');

        const newImg = new Image();
        newImg.onload = () => {
            if (token !== loadToken) return;
            img.src = newImg.src;
            img.classList.add('loaded');
            $('loading').classList.remove('show');
        };
        newImg.src = urlOf(n);

        updateUI();
        if (CONFIG.rememberProgress) localStorage.setItem('comicPage', n);
        [n + 1, n - 1].forEach(p => {
            if (p >= 1 && p <= CONFIG.total) new Image().src = urlOf(p);
        });
    }

    /* ===== 滚动模式 ===== */
    function buildScrollMode() {
        if (scrollBuilt) return;
        scrollContainer.innerHTML = '';
        for (let i = 1; i <= CONFIG.total; i++) {
            const simg = document.createElement('img');
            simg.src = urlOf(i);
            simg.loading = 'lazy';
            simg.alt = `第${i}页`;
            scrollContainer.appendChild(simg);
        }
        scrollBuilt = true;

        let lastScrollTop = 0;

        scrollContainer.addEventListener('scroll', () => {
            if (mode !== 'scroll') return;

            // 【核心修复】如果正在自动跳转，忽略滚动监听的计算，防止页码被错误覆盖
            if (isAutoScrolling) return;

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

            for (let i = 0; i < scrollContainer.children.length; i++) {
                const child = scrollContainer.children[i];
                const childCenter = child.offsetTop + child.clientHeight / 2;
                const diff = Math.abs(childCenter - containerCenter);
                if (diff < minDiff) {
                    minDiff = diff;
                    closestPage = i + 1;
                }
            }

            if (closestPage !== current) {
                current = closestPage;
                $('pageInfo').textContent = `${current} / ${CONFIG.total}`;
                updateCatalogActive(current);
                if (CONFIG.rememberProgress) localStorage.setItem('comicPage', current);
            }
        }, { passive: true });
    }

    function showScrollPage(n) {
        buildScrollMode();
        current = n;
        updateUI();
        if (CONFIG.rememberProgress) localStorage.setItem('comicPage', n);

        if (scrollBuilt && scrollContainer.children[current - 1]) {
            // 【核心修复】开启锁定，平滑滚动，并在滚动结束后解除锁定
            isAutoScrolling = true;
            scrollContainer.children[current - 1].scrollIntoView({ block: 'center', behavior: 'smooth' });

            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(() => {
                isAutoScrolling = false;
            }, 600); // 600ms 后解除锁定，足够平滑滚动完成
        }
    }

    /* ===== 切换与按钮 ===== */
    function switchMode(newMode) {
        mode = newMode;
        if (mode === 'flip') {
            flipContainer.style.display = 'flex';
            scrollContainer.style.display = 'none';
            $('modeBtn').innerHTML = '<i class="iconfont icon0 icon-dingdan"></i> <span class="text-hide-mobile">切换滚动</span>';
            showFlipPage(current);
            toolbar.classList.remove('hide-toolbar');
        } else {
            flipContainer.style.display = 'none';
            scrollContainer.style.display = 'flex';
            $('modeBtn').innerHTML = '<i class="iconfont icon0 icon-yuedu"></i> <span class="text-hide-mobile">切换翻页</span>';
            showScrollPage(current);
            toolbar.classList.remove('hide-toolbar');
        }
        updateCatalogActive(current);
    }

    $('modeBtn').onclick = () => switchMode(mode === 'flip' ? 'scroll' : 'flip');

    const next = () => { mode === 'flip' ? showFlipPage(current + 1) : showScrollPage(current + 1); };
    const prev = () => { mode === 'flip' ? showFlipPage(current - 1) : showScrollPage(current - 1); };

    $('btnNext').onclick = next;
    $('btnPrev').onclick = prev;
    $('zoneNext').onclick = () => { if (mode === 'flip') next(); };
    $('zonePrev').onclick = () => { if (mode === 'flip') prev(); };

    /* ===== 手势处理（翻页模式） ===== */
    let startX = 0, startY = 0, initialDistance = 0, initialScale = 1, isSwiping = false, isDraggingImg = false;
    const getDistance = (touches) => Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);

    flipContainer.addEventListener('touchstart', e => {
        if (mode !== 'flip') return;
        if (e.touches.length === 2) {
            initialDistance = getDistance(e.touches);
            initialScale = scale;
            isSwiping = false; isDraggingImg = false;
        } else if (e.touches.length === 1) {
            startX = e.touches[0].clientX; startY = e.touches[0].clientY;
            isSwiping = !isZoomed; isDraggingImg = isZoomed;
        }
    }, { passive: false });

    flipContainer.addEventListener('touchmove', e => {
        if (mode !== 'flip') return;
        if (e.touches.length === 2) {
            e.preventDefault();
            let newScale = initialScale * (getDistance(e.touches) / initialDistance);
            scale = Math.min(Math.max(newScale, 1), 5);
            isZoomed = scale > 1.05;
            applyTransform(false);
        } else if (e.touches.length === 1 && isDraggingImg && isZoomed) {
            e.preventDefault();
            translateX += e.touches[0].clientX - startX;
            translateY += e.touches[0].clientY - startY;
            startX = e.touches[0].clientX; startY = e.touches[0].clientY;
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
            isSwiping = false; isDraggingImg = false;
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

    /* ===== 目录功能 ===== */
    function buildCatalog() {
        if (!catalogGrid) return;
        catalogGrid.innerHTML = '';
        for (let i = 1; i <= CONFIG.total; i++) {
            const item = document.createElement('div');
            item.className = 'catalog-item';
            item.textContent = i;
            item.dataset.page = i;
            item.addEventListener('click', () => {
                const targetPage = i;
                // 目录点击直接跳转
                if (mode === 'flip') {
                    showFlipPage(targetPage);
                } else {
                    showScrollPage(targetPage);
                }
                catalogPanel.classList.remove('show');
            });
            catalogGrid.appendChild(item);
        }
    }

    function updateCatalogActive(page) {
        if (!catalogGrid) return;
        const items = catalogGrid.children;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            if (Number(item.dataset.page) === page) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        }
        const activeItem = catalogGrid.querySelector('.catalog-item.active');
        if (activeItem) {
            activeItem.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }

    function showCatalog() {
        if (!catalogPanel) return;
        if (catalogGrid.children.length === 0) {
            buildCatalog();
        }
        updateCatalogActive(current);
        catalogPanel.classList.add('show');
    }

    function hideCatalog() {
        catalogPanel.classList.remove('show');
    }

    if (catalogBtn) {
        catalogBtn.addEventListener('click', showCatalog);
    }
    if (catalogClose) {
        catalogClose.addEventListener('click', hideCatalog);
    }
    catalogPanel.addEventListener('click', (e) => {
        if (e.target === catalogPanel) {
            hideCatalog();
        }
    });

    /* ===== 启动 ===== */
    buildCatalog();

    flipContainer.style.display = 'none';
    scrollContainer.style.display = 'flex';
    buildScrollMode();

    updateUI();

    setTimeout(() => {
        if (scrollContainer.children[current - 1]) {
            isAutoScrolling = true;
            scrollContainer.children[current - 1].scrollIntoView({ block: 'center' });
            scrollTimeout = setTimeout(() => {
                isAutoScrolling = false;
            }, 600);
        }
    }, 100);

})();