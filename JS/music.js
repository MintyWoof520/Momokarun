(function () {
    /* ============ 曲目数据 ============ */
    const TRACK_DATA = [
        {
            title: '预制分手',
            artist: '门尼',
            audioUrl: 'https://openlist-railway-production-a089.up.railway.app/d/%E5%A4%A9%E7%BF%BC-%E4%B8%AA%E4%BA%BA/%E9%9F%B3%E4%B9%90/%E6%97%A0%E6%8D%9F/%E9%97%A8%E5%B0%BC/%E9%A2%84%E5%88%B6%E5%88%86%E6%89%8B.flac',
            lrcUrl: 'Music/预制分手.lrc',
            grad: ['#8b7cff', '#ff6ba8']
        },
        {
            title: '南三环东路',
            artist: 'DOUDOU',
            audioUrl: 'https://star-mint.cc.cd/DOUDOU/nansanhuandonglu.mp3',
            lrcUrl: 'Music/南三环东路.lrc',
            grad: ['#8b7cff', '#ff6ba8']
        },
        {
            title: '嗵嗵',
            artist: 'DOUDOU',
            audioUrl: 'https://star-mint.cc.cd/DOUDOU/tongtong.mp3',
            lrcUrl: 'Music/嗵嗵.lrc',
            grad: ['#8b7cff', '#ff6ba8']
        },
        {
            title: '失踪的朋友 (Demo)',
            artist: '柳爽',
            audioUrl: 'https://star-mint.cc.cd/LIUSHUANG/shizongdepengyou.m4a',
            lrcUrl: 'Music/失踪的朋友.lrc',
            grad: ['#8b7cff', '#ff6ba8']
        },
        {
            title: '危险派对',
            artist: 'TU_兔斯基（翻唱）',
            audioUrl: 'https://star-mint.cc.cd/QITA/weixianpaidui.mp3',
            lrcUrl: 'Music/危险派对.lrc',
            grad: ['#8b7cff', '#ff6ba8']
        },
        {
            title: '看门狗',
            artist: '门尼',
            audioUrl: 'https://star-mint.cc.cd/MONEY/kanmengou.mp3',
            lrcUrl: 'Music/看门狗.lrc',
            grad: ['#8b7cff', '#ff6ba8']
        }
    ];

    /* ============ DOM ============ */
    const el = {
        title: document.getElementById('title'),
        artist: document.getElementById('artist'),
        coverWrap: document.getElementById('coverWrap'),
        lyrics: document.getElementById('lyrics'),
        progress: document.getElementById('progress'),
        fill: document.getElementById('fill'),
        buffer: document.getElementById('buffer'),
        thumb: document.getElementById('thumb'),
        cur: document.getElementById('cur'),
        dur: document.getElementById('dur'),
        playBtn: document.getElementById('playBtn'),
        prevBtn: document.getElementById('prevBtn'),
        nextBtn: document.getElementById('nextBtn')
    };

    /* ============ 状态 ============ */
    const audio = new Audio();
    audio.preload = 'metadata';
    window.audio = audio; // 👈 暴露给全局，防止外面找不到

    let currentIndex = 0;
    let currentLines = [];
    let activeIdx = -1;
    let dragging = false, dragRatio = 0;
    let autoScrollPaused = false, scrollTimer = null;
    let rafId = null;

    /* ============ 工具 ============ */
    function fmtTime(sec) {
        if (!isFinite(sec) || sec < 0) sec = 0;
        sec = Math.floor(sec);
        return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
    }

    /* ============ 强力解析 LRC ============ */
    function parseLRC(text) {
        const out = [];
        text.replace(/\r/g, '').split('\n').forEach(raw => {
            const line = raw.trim(); if (!line) return;
            const tagRe = /[\[<](\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?[\]>]/g;
            const tags = [];
            let match;

            while ((match = tagRe.exec(line)) !== null) {
                tags.push({
                    time: (+match[1]) * 60 + (+match[2]) + (match[3] ? parseFloat('0.' + match[3]) : 0),
                    index: match.index,
                    length: match[0].length
                });
            }

            if (tags.length === 0) return;
            const lineTime = tags[0].time;
            const chars = [];
            let plainText = '';

            for (let i = 0; i < tags.length; i++) {
                const currentTag = tags[i];
                const nextTag = tags[i + 1];
                const textStart = currentTag.index + currentTag.length;
                const textEnd = nextTag ? nextTag.index : line.length;
                const segment = line.slice(textStart, textEnd);

                for (const ch of segment) {
                    if (ch.trim() !== '') {
                        chars.push({ t: currentTag.time, c: ch });
                        plainText += ch;
                    }
                }
            }

            if (!plainText.trim()) return;
            out.push({ time: lineTime, text: plainText, chars: chars });
        });
        out.sort((a, b) => a.time - b.time);
        return out;
    }

    /* ============ 歌词渲染 ============ */
    function renderLyrics(lines) {
        el.lyrics.innerHTML = '';
        if (!lines.length) {
            const empty = document.createElement('div');
            empty.className = 'mp-empty';
            empty.textContent = '暂无歌词';
            el.lyrics.appendChild(empty);
            return;
        }
        const frag = document.createDocumentFragment();
        lines.forEach((line, i) => {
            const div = document.createElement('div');
            div.className = 'mp-line';
            div.dataset.index = i;

            if (line.chars) {
                line.chars.forEach(ch => {
                    const s = document.createElement('span');
                    s.className = 'ch';
                    s.textContent = ch.c;
                    ch.node = s;
                    div.appendChild(s);
                });
            } else {
                div.textContent = line.text;
            }
            frag.appendChild(div);
        });
        el.lyrics.appendChild(frag);
        el.lyrics.scrollTop = 0;
    }

    function scrollToLine(node) {
        if (!node) return;
        const target = node.offsetTop - el.lyrics.clientHeight / 2 + node.offsetHeight / 2;
        el.lyrics.scrollTo({ top: Math.max(0, target), behavior: 'smooth' });
    }

    function updateLyric(t) {
        if (!currentLines.length) return;
        let idx = -1;
        for (let i = 0; i < currentLines.length; i++) {
            if (currentLines[i].time <= t + 0.08) idx = i; else break;
        }
        if (idx !== activeIdx) {
            const prev = el.lyrics.children[activeIdx];
            if (prev && prev.classList) prev.classList.remove('active');
            activeIdx = idx;
            const cur = el.lyrics.children[idx];
            if (cur && cur.classList) {
                cur.classList.add('active');
                if (!autoScrollPaused) scrollToLine(cur);
            }
        }
        const line = currentLines[activeIdx];
        if (line && line.chars) {
            line.chars.forEach(ch => {
                if (!ch.node) return;
                if (t >= ch.t) ch.node.classList.add('done');
                else ch.node.classList.remove('done');
            });
        }
    }

    function pauseAutoScroll() {
        autoScrollPaused = true;
        clearTimeout(scrollTimer);
        scrollTimer = setTimeout(() => { autoScrollPaused = false; }, 3000);
    }
    el.lyrics.addEventListener('wheel', pauseAutoScroll, { passive: true });
    el.lyrics.addEventListener('touchmove', pauseAutoScroll, { passive: true });
    el.lyrics.addEventListener('pointerdown', pauseAutoScroll);
    el.lyrics.addEventListener('click', e => {
        const node = e.target.closest('.mp-line');
        if (!node) return;
        const idx = +node.dataset.index;
        if (isNaN(idx) || !currentLines[idx]) return;
        audio.currentTime = currentLines[idx].time;
        autoScrollPaused = false;
        updateLyric(audio.currentTime);
    });

    /* ============ 进度条 ============ */
    function setProgressVisual(ratio) {
        const pct = (Math.min(1, Math.max(0, ratio)) * 100).toFixed(3) + '%';
        el.fill.style.width = pct;
        el.thumb.style.left = pct;
    }
    function ratioFromEvent(e) {
        const rect = el.progress.getBoundingClientRect();
        return Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    }
    el.progress.addEventListener('pointerdown', e => {
        if (!isFinite(audio.duration)) return;
        dragging = true;
        el.progress.classList.add('dragging');
        el.progress.setPointerCapture(e.pointerId);
        dragRatio = ratioFromEvent(e);
        setProgressVisual(dragRatio);
        el.cur.textContent = fmtTime(dragRatio * audio.duration);
    });
    el.progress.addEventListener('pointermove', e => {
        if (!dragging) return;
        dragRatio = ratioFromEvent(e);
        setProgressVisual(dragRatio);
        el.cur.textContent = fmtTime(dragRatio * audio.duration);
    });
    function endDrag(e) {
        if (!dragging) return;
        dragging = false;
        el.progress.classList.remove('dragging');
        try { el.progress.releasePointerCapture(e.pointerId); } catch (_) { }
        if (isFinite(audio.duration)) audio.currentTime = dragRatio * audio.duration;
        autoScrollPaused = false;
        updateLyric(audio.currentTime);
    }
    el.progress.addEventListener('pointerup', endDrag);
    el.progress.addEventListener('pointercancel', endDrag);

    /* ============ 主循环 ============ */
    function loop() {
        if (!dragging && isFinite(audio.duration) && audio.duration > 0) {
            const r = audio.currentTime / audio.duration;
            setProgressVisual(r);
            el.cur.textContent = fmtTime(audio.currentTime);
            try {
                if (audio.buffered.length) {
                    const b = audio.buffered.end(audio.buffered.length - 1) / audio.duration;
                    el.buffer.style.width = (Math.min(1, b) * 100).toFixed(2) + '%';
                }
            } catch (_) { }
        }
        updateLyric(audio.currentTime);
        rafId = requestAnimationFrame(loop);
    }
    function startLoop() { if (!rafId) rafId = requestAnimationFrame(loop); }
    function stopLoop() { if (rafId) { cancelAnimationFrame(rafId); rafId = null; } }

    /* ============ 播放控制 ============ */
    function updateDuration() {
        if (isFinite(audio.duration)) el.dur.textContent = fmtTime(audio.duration);
    }
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);
    
    audio.addEventListener('play', () => {
        el.playBtn.classList.add('playing');
        el.coverWrap.classList.add('spinning');
        startLoop();

        // 👇 联动迷你播放器 👇
        const currentPage = window.location.hash.replace('#', '') || 'home';
        if (currentPage !== 'music' && typeof setMiniMode === 'function') {
            setMiniMode(true);
        }
    });
    
    audio.addEventListener('pause', () => {
        el.playBtn.classList.remove('playing');
        el.coverWrap.classList.remove('spinning');
        stopLoop();

        // 👇 联动迷你播放器 👇
        if (typeof setMiniMode === 'function') {
            setMiniMode(false);
        }
    });

    /* ============ 播放模式控制 ============ */
    let playMode = 0;
    const modeBtn = document.getElementById('modeBtn');
    const modeIcon = document.getElementById('modeIcon');

    const icons = {
        'loop-all': '<path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/>',
        'loop-one': '<path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z"/><text x="12" y="15" font-size="8" text-anchor="middle" fill="#8b7cff" font-weight="bold">1</text>',
        'random': '<path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>'
    };

    modeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playMode = (playMode + 1) % 3;
        updateModeUI();
    });

    function updateModeUI() {
        if (playMode === 0) {
            modeIcon.innerHTML = icons['loop-all'];
            modeBtn.title = "列表循环";
            modeIcon.style.fill = "#8f8fa3";
        } else if (playMode === 1) {
            modeIcon.innerHTML = icons['loop-one'];
            modeBtn.title = "单曲循环";
            modeIcon.style.fill = "#8b7cff";
        } else if (playMode === 2) {
            modeIcon.innerHTML = icons['random'];
            modeBtn.title = "随机播放";
            modeIcon.style.fill = "#8b7cff";
        }
    }

    audio.addEventListener('ended', () => {
        if (playMode === 0) {
            loadTrack(currentIndex + 1, true);
        } else if (playMode === 1) {
            audio.currentTime = 0;
            audio.play();
        } else if (playMode === 2) {
            if (TRACK_DATA.length > 1) {
                let nextIdx = currentIndex;
                while (nextIdx === currentIndex) {
                    nextIdx = Math.floor(Math.random() * TRACK_DATA.length);
                }
                loadTrack(nextIdx, true);
            } else {
                audio.currentTime = 0;
                audio.play();
            }
        }
    });

    audio.addEventListener('error', () => {
        el.artist.textContent = '音频加载失败，请检查链接或 CORS';
    });
    
    audio.addEventListener('timeupdate', () => {
        if (!dragging && isFinite(audio.duration)) el.cur.textContent = fmtTime(audio.currentTime);
    });

    async function loadTrack(index, autoplay = false) {
        currentIndex = (index + TRACK_DATA.length) % TRACK_DATA.length;
        const t = TRACK_DATA[currentIndex];

        audio.src = t.audioUrl;
        audio.load();

        el.title.textContent = t.title;
        el.artist.textContent = t.artist;

        currentLines = [];
        activeIdx = -1;
        renderLyrics([]);

        if (t.lrcUrl) {
            try {
                const res = await fetch(encodeURI(t.lrcUrl));
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const text = await res.text();
                currentLines = parseLRC(text);
                renderLyrics(currentLines);
            } catch (err) {
                console.warn('歌词加载失败:', t.lrcUrl, err);
                renderLyrics([]);
            }
        }

        setProgressVisual(0);
        el.buffer.style.width = '0%';
        el.cur.textContent = '0:00';
        el.dur.textContent = '0:00';

        if (autoplay) audio.play().catch(() => { });
    }

    el.playBtn.addEventListener('click', () => {
        if (audio.paused) audio.play().catch(err => console.warn(err));
        else audio.pause();
    });

    el.prevBtn.addEventListener('click', () => {
        if (playMode === 2 && TRACK_DATA.length > 1) {
            let prevIdx = currentIndex;
            while (prevIdx === currentIndex) prevIdx = Math.floor(Math.random() * TRACK_DATA.length);
            loadTrack(prevIdx, !audio.paused);
        } else {
            loadTrack(currentIndex - 1, !audio.paused);
        }
    });

    el.nextBtn.addEventListener('click', () => {
        if (playMode === 2 && TRACK_DATA.length > 1) {
            let nextIdx = currentIndex;
            while (nextIdx === currentIndex) nextIdx = Math.floor(Math.random() * TRACK_DATA.length);
            loadTrack(nextIdx, !audio.paused);
        } else {
            loadTrack(currentIndex + 1, !audio.paused);
        }
    });

    document.addEventListener('keydown', e => {
        if (e.target.tagName === 'INPUT') return;
        if (e.code === 'Space') { e.preventDefault(); audio.paused ? audio.play().catch(() => { }) : audio.pause(); }
        else if (e.code === 'ArrowRight' && isFinite(audio.duration)) audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
        else if (e.code === 'ArrowLeft' && isFinite(audio.duration)) audio.currentTime = Math.max(0, audio.currentTime - 5);
    });

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) stopLoop();
        else if (!audio.paused) startLoop();
    });

    /* ============ 初始化 ============ */
    loadTrack(0, false).then(() => { el.playBtn.disabled = false; });
    audio.addEventListener('canplay', () => { el.playBtn.disabled = false; });

})(); // 👈 大函数结束


/* ============ 迷你播放器外层逻辑 ============ */
const mpRoot = document.getElementById('mpRoot');
const musicPage = document.getElementById('page-music');
let isMiniMode = false;

function setMiniMode(mini) {
    if (isMiniMode === mini) return;
    isMiniMode = mini;

    if (mini) {
        document.body.appendChild(mpRoot); // 揪出来
        mpRoot.classList.add('mini-mode');
    } else {
        musicPage.appendChild(mpRoot); // 塞回去
        mpRoot.classList.remove('mini-mode');
    }
}

window.toggleMiniMode = function (currentPageName) {
    const myAudio = window.audio; // 全局找 audio
    if (currentPageName === 'music' || !myAudio || myAudio.paused) {
        setMiniMode(false);
    } else {
        setMiniMode(true);
    }
};

mpRoot.addEventListener('click', (e) => {
    if (isMiniMode) {
        if (e.target.closest('.mp-btn-play') ||
            e.target.closest('#prevBtn') ||
            e.target.closest('#nextBtn')) {
            return;
        }
        window.location.hash = 'music';
    }
});