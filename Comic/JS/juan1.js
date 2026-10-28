

/* ========================== */

const pad = n => String(n).padStart(CONFIG.pad, '0');
const urlOf = n => `${CONFIG.prefix}${pad(n)}${CONFIG.ext}`;

const $ = id => document.getElementById(id);

let mode = 'flip'; // 'flip' | 'scroll'
let current = 1;
let loadToken = 0;

// 翻页模式专属
const img = $('page');
const wrapper = $('imgWrapper');
const flipContainer = $('flipContainer');
let scale = 1, translateX = 0, translateY = 0, isZoomed = false;

// 滚动模式专属
const scrollContainer = $('scrollContainer');
let scrollBuilt = false;

if (CONFIG.rememberProgress) {
    const saved = Number(localStorage.getItem('comicPage'));
    if (saved >= 1 && saved <= CONFIG.total) current = saved;
}

function updateUI() {
    $('pageInfo').textContent = `${current} / ${CONFIG.total}`;
    $('btnPrev').disabled = $('btnFirst').disabled = current <= 1;
    $('btnNext').disabled = $('btnLast').disabled = current >= CONFIG.total;

    if (mode === 'scroll' && scrollBuilt) {
        const targetImg = scrollContainer.children[current - 1];
        if (targetImg) {
            // 计算滚动位置，减去工具栏高度
            const top = targetImg.offsetTop - 48;
            scrollContainer.scrollTo({ top: top, behavior: 'smooth' });
        }
    }
}

/* =========================================
   模式 1：翻页模式
   ========================================= */
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
    $('loading').textContent = '加载中…';
    $('loading').classList.add('show');

    const newImg = new Image();
    newImg.onload = () => {
        if (token !== loadToken) return;
        img.src = newImg.src;
        img.classList.add('loaded');
        $('loading').classList.remove('show');
    };
    newImg.onerror = () => {
        if (token !== loadToken) return;
        $('loading').textContent = `第 ${n} 页加载失败`;
        $('loading').classList.add('show');
    };
    newImg.src = urlOf(n);

    updateUI();
    if (CONFIG.rememberProgress) localStorage.setItem('comicPage', n);

    [n + 1, n - 1].forEach(p => {
        if (p >= 1 && p <= CONFIG.total) new Image().src = urlOf(p);
    });
}

/* =========================================
   模式 2：滚动模式
   ========================================= */
function buildScrollMode() {
    if (scrollBuilt) return;
    scrollContainer.innerHTML = '';
    for (let i = 1; i <= CONFIG.total; i++) {
        const simg = document.createElement('img');
        simg.src = urlOf(i);
        simg.loading = 'lazy';
        simg.dataset.page = i;
        scrollContainer.appendChild(simg);
    }
    scrollBuilt = true;

    let lastScrollTop = 0;
    scrollContainer.addEventListener('scroll', () => {
        if (mode !== 'scroll') return;

        // 1. 自动隐藏/显示顶部工具栏
        const st = scrollContainer.scrollTop;
        if (st > lastScrollTop && st > 50) {
            $('toolbar').classList.add('hidden');
        } else if (st < lastScrollTop) {
            $('toolbar').classList.remove('hidden');
        }
        lastScrollTop = st;

        // 2. 更新当前页码
        let closestPage = 1;
        let minDiff = Infinity;
        const containerCenter = st + scrollContainer.clientHeight / 2;

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
            $('btnPrev').disabled = $('btnFirst').disabled = current <= 1;
            $('btnNext').disabled = $('btnLast').disabled = current >= CONFIG.total;
            if (CONFIG.rememberProgress) localStorage.setItem('comicPage', current);
        }
    });
}

function showScrollPage(n) {
    buildScrollMode();
    current = n;
    updateUI();
    if (CONFIG.rememberProgress) localStorage.setItem('comicPage', n);
}

/* =========================================
   全局：切换与公共逻辑
   ========================================= */
function switchMode(newMode) {
    mode = newMode;
    $('toolbar').classList.remove('hidden'); // 切换时保证工具栏可见

    if (mode === 'flip') {
        flipContainer.style.display = 'flex';
        scrollContainer.style.display = 'none';
        $('modeBtn').textContent = '切换到滚动';
        showFlipPage(current);
    } else {
        flipContainer.style.display = 'none';
        scrollContainer.style.display = 'flex'; // 这里改成 flex
        $('modeBtn').textContent = '切换到翻页';
        showScrollPage(current);
    }
}

$('modeBtn').onclick = () => switchMode(mode === 'flip' ? 'scroll' : 'flip');

const next = () => { mode === 'flip' ? showFlipPage(current + 1) : showScrollPage(current + 1); };
const prev = () => { mode === 'flip' ? showFlipPage(current - 1) : showScrollPage(current - 1); };
const first = () => { mode === 'flip' ? showFlipPage(1) : showScrollPage(1); };
const last = () => { mode === 'flip' ? showFlipPage(CONFIG.total) : showScrollPage(CONFIG.total); };

$('btnNext').onclick = next;
$('btnPrev').onclick = prev;
$('btnFirst').onclick = first;
$('btnLast').onclick = last;
$('zoneNext').onclick = () => { if (mode === 'flip') next(); };
$('zonePrev').onclick = () => { if (mode === 'flip') prev(); };

/* ---- 翻页模式的手势 ---- */
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

/* ---- 启动 ---- */
updateUI();
showFlipPage(current);