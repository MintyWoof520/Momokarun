(function () {
    'use strict';

    /* =============== 数据区 =============== */
    /* 
     * 【如何设置多个链接】
     * 使用 links 数组，配置 name 和 url：
     * links: [
     *   { name: 'B站阅读', url: 'https://bilibili.com' },
     *   { name: '知乎讨论', url: 'https://zhihu.com' }
     * ]
     * 
     * 如果只有一个链接，用 links 数组写一个对象也可以。
     */
    const DATA = [
        {
            title: '超自然武装当哒当',
            author: '龍幸伸',
            hue: 210,
            cover: 'Images/mokarun.jpg',
            desc: '你们两个就不能好好的搞纯爱吗！！！！',
            tags: ['热血', '奇幻', '搞笑', '校园'],
            links: [
                { name: '第一卷', url: 'Comic/DANDADAN/juan1.html' },
                { name: '第二卷', url: 'https://github.com/MintyWoof520' },
                { name: '第三卷', url: 'https://github.com/MintyWoof520' },
                { name: '第四卷', url: 'https://github.com/MintyWoof520' }
            ]
        },
        {
            title: '风起苍岚',
            author: '作画：松鼠200/编剧：古轩',
            hue: 210,
            cover: 'Images/02.jpg',
            desc: '2013年八月开始连载，至今仍未完结，恐怖如斯',
            tags: ['修真', '网游', '穿越'],
            links: [
                { name: '第1-101话', url: 'Comic/FengQiCangLan/1-101.html' },
                { name: '占位', url: 'https://github.com/MintyWoof520' },
                { name: '占位', url: 'https://github.com/MintyWoof520' },
                { name: '占位', url: 'https://github.com/MintyWoof520' }
            ]
        },
        {
            title: '死亡笔记',
            author: '作画：小畑健/编剧：大场鸫',
            hue: 260,
            cover: 'https://music01-3bxv3bn.maozi.io/wallpaper/dn.jpg',
            desc: 'L到底叫啥',
            tags: ['？', '？'],
            links: [
                { name: '第一卷', url: 'Comic/DeathNote/juan1.html' },
                { name: '占位', url: 'https://github.com/MintyWoof520' },
                { name: '占位', url: 'https://github.com/MintyWoof520' },
                { name: '占位', url: 'https://github.com/MintyWoof520' }
            ]
        }
    ];

    /* =============== 配置区 =============== */
    const N = DATA.length;
    const STEP_DEG = 360 / N;
    const DRAG_PX = 180;
    const DRAG_PX_MOBILE = 150;
    let RADIUS = 520;
    let isVertical = false;

    /* =============== 生成占位封面 =============== */
    function makeCover(hue) {
        const svg =
            '<svg xmlns="http://www.w3.org/2000/svg" width="340" height="450" viewBox="0 0 340 450">' +
            '<defs>' +
            '<linearGradient id="g" x1="0" y1="0" x2="0.65" y2="1">' +
            '<stop offset="0%" stop-color="hsl(' + hue + ',72%,64%)"/>' +
            '<stop offset="100%" stop-color="hsl(' + ((hue + 45) % 360) + ',68%,34%)"/>' +
            '</linearGradient>' +
            '<radialGradient id="s" cx="0.5" cy="0.32" r="0.75">' +
            '<stop offset="0%" stop-color="#fff" stop-opacity="0.30"/>' +
            '<stop offset="100%" stop-color="#fff" stop-opacity="0"/>' +
            '</radialGradient>' +
            '</defs>' +
            '<rect width="340" height="450" fill="url(#g)"/>' +
            '<circle cx="258" cy="104" r="96" fill="#ffffff" opacity="0.12"/>' +
            '<circle cx="72"  cy="372" r="128" fill="#000000" opacity="0.14"/>' +
            '<rect width="340" height="450" fill="url(#s)"/>' +
            '</svg>';
        return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    }

    /* =============== 建 DOM =============== */
    const wrapper = document.getElementById('c3dWrapper-z7k2p');
    const stage = document.getElementById('c3dStage-z7k2p');
    const scene = stage.querySelector('.c3d-scene-z7k2p');

    const cardEls = DATA.map(function (item) {
        const src = item.cover || makeCover(item.hue || 200);
        const el = document.createElement('div');
        el.className = 'c3d-card-z7k2p';
        el.innerHTML =
            '<div class="c3d-inner-z7k2p">' +
            '<div class="c3d-cover-z7k2p">' +
            '<img src="' + src + '" alt="' + item.title + '" draggable="false">' +
            '</div>' +
            '<div class="c3d-info-z7k2p">' +
            '<div>' +
            '<div class="c3d-title-z7k2p">' + item.title + '</div>' +
            '<div class="c3d-author-z7k2p">' + item.author + '</div>' +
            '</div>' +
            '<div class="c3d-detail-btn-z7k2p">查看详情</div>' +
            '</div>' +
            '</div>';
        scene.appendChild(el);
        return el;
    });

    /* =============== 状态 =============== */
    let offset = 0;
    let target = 0;
    let rafId = null;

    function computeRadius() {
        isVertical = window.innerWidth < 768;
        if (isVertical) {
            RADIUS = Math.max(150, Math.min(stage.clientHeight * 0.38, 300));
        } else {
            RADIUS = Math.max(280, stage.clientWidth * 0.48);
        }
    }

    /* =============== 核心排布 =============== */
    function layout() {
        for (let i = 0; i < N; i++) {
            const el = cardEls[i];
            let deg = (i - offset) * STEP_DEG;

            deg = deg % 360;
            if (deg > 180) deg -= 360;
            if (deg < -180) deg += 360;

            const rad = deg * Math.PI / 180;

            let x, y, z, rx, ry;

            if (isVertical) {
                x = 0;
                y = RADIUS * Math.sin(rad);
                z = RADIUS * Math.cos(rad) - RADIUS;
                rx = deg;
                ry = 0;
            } else {
                x = RADIUS * Math.sin(rad);
                y = 0;
                z = RADIUS * Math.cos(rad) - RADIUS;
                rx = 0;
                ry = -deg;
            }

            const depth = (z + 2 * RADIUS) / (2 * RADIUS);
            const op = 0.15 + 0.85 * depth;

            el.style.visibility = 'visible';
            el.style.opacity = op.toFixed(3);
            el.style.zIndex = Math.round(depth * 1000);

            el.style.transform =
                'translate3d(' + x.toFixed(2) + 'px, ' + y.toFixed(2) + 'px, ' + z.toFixed(2) + 'px) ' +
                'rotateX(' + rx.toFixed(2) + 'deg) ' +
                'rotateY(' + ry.toFixed(2) + 'deg)';

            const innerEl = el.querySelector('.c3d-inner-z7k2p');
            if (Math.abs(deg) < (STEP_DEG / 2)) {
                innerEl.classList.add('is-center-z7k2p');
            } else {
                innerEl.classList.remove('is-center-z7k2p');
            }
        }
    }

    /* =============== 平滑动画 =============== */
    function tick() {
        const diff = target - offset;
        if (Math.abs(diff) < 0.0005) {
            offset = target;
            layout();
            rafId = null;
            return;
        }
        offset += diff * 0.14;
        layout();
        rafId = requestAnimationFrame(tick);
    }

    function requestUpdate() {
        if (rafId === null) rafId = requestAnimationFrame(tick);
    }

    /* =============== 拖拽与点击判定 =============== */
    let dragging = false;
    let startX = 0, startY = 0, startTarget = 0;
    let downX = 0, downY = 0, downTime = 0, hasMoved = false;
    let clickedCard = null;

    wrapper.addEventListener('pointerdown', function (e) {
        dragging = true;
        startX = e.clientX;
        startY = e.clientY;
        downX = e.clientX;
        downY = e.clientY;
        startTarget = target;
        downTime = Date.now();
        hasMoved = false;

        let el = e.target;
        if (el.nodeType === 3) el = el.parentNode;
        clickedCard = el.closest ? el.closest('.c3d-card-z7k2p') : null;

        try { wrapper.setPointerCapture(e.pointerId); } catch (err) { }
    });

    wrapper.addEventListener('pointermove', function (e) {
        if (!dragging) return;

        if (Math.abs(e.clientX - downX) > 5 || Math.abs(e.clientY - downY) > 5) {
            hasMoved = true;
        }

        if (isVertical) {
            const dy = e.clientY - startY;
            target = startTarget - dy / DRAG_PX_MOBILE;
        } else {
            const dx = e.clientX - startX;
            target = startTarget - dx / DRAG_PX;
        }
        requestUpdate();
    });

    wrapper.addEventListener('pointerup', function (e) {
        if (!dragging) return;
        dragging = false;
        try { wrapper.releasePointerCapture(e.pointerId); } catch (err) { }

        const time = Date.now() - downTime;

        if (!hasMoved && time < 300 && clickedCard) {
            const index = cardEls.indexOf(clickedCard);
            if (index !== -1) openModal(index);
        }
        clickedCard = null;
    });

    wrapper.addEventListener('pointercancel', function () {
        dragging = false;
        clickedCard = null;
    });

    /* =============== 滚轮 =============== */
    wrapper.addEventListener('wheel', function (e) {
        e.preventDefault();
        const d = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
        target += d / 600;
        requestUpdate();
    }, { passive: false });

    /* =============== 弹窗逻辑 =============== */
    const modal = document.getElementById('c3dModal-z7k2p');
    const modalImg = document.getElementById('c3dModalImg-z7k2p');
    const modalTitle = document.getElementById('c3dModalTitle-z7k2p');
    const modalAuthor = document.getElementById('c3dModalAuthor-z7k2p');
    const modalDesc = document.getElementById('c3dModalDesc-z7k2p');
    const modalTags = document.getElementById('c3dModalTags-z7k2p');
    const modalLinksContainer = document.getElementById('c3dModalLinks-z7k2p'); // 新的多链接容器
    const modalClose = document.getElementById('c3dModalClose-z7k2p');

    function openModal(index) {
        const item = DATA[index];
        modalImg.src = item.cover || makeCover(item.hue || 200);
        modalTitle.textContent = item.title;
        modalAuthor.textContent = '作者：' + item.author;
        modalDesc.textContent = item.desc || '暂无简介';

        if (item.tags) {
            modalTags.innerHTML = item.tags.map(t => `<span class="c3d-tag-z7k2p">${t}</span>`).join('');
        } else {
            modalTags.innerHTML = '';
        }

        // 【多链接渲染逻辑】
        // 兼容单数 link 和复数 links
        let linkArray = [];
        if (item.links && Array.isArray(item.links)) {
            linkArray = item.links;
        } else if (item.link) {
            // 如果写的是单数 link，自动包装成默认名称的数组
            linkArray = [{ name: '前往阅读 / 查看更多', url: item.link }];
        }

        if (linkArray.length > 0) {
            modalLinksContainer.innerHTML = linkArray.map(l =>
                `<a href="${l.url}" class="c3d-modal-link-z7k2p" target="_blank" rel="noopener noreferrer">${l.name}</a>`
            ).join('');
            modalLinksContainer.style.display = 'flex';
        } else {
            modalLinksContainer.innerHTML = '';
            modalLinksContainer.style.display = 'none';
        }

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    modalClose.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) closeModal();
    });

    /* =============== 初始化 =============== */
    function init() {
        requestAnimationFrame(() => {
            computeRadius();
            offset = target = 0;
            layout();

            if (window.ResizeObserver) {
                const ro = new ResizeObserver(() => {
                    computeRadius();
                    layout();
                });
                ro.observe(stage);
            } else {
                window.addEventListener('resize', () => {
                    computeRadius();
                    layout();
                });
            }
        });
    }

    init();
})();