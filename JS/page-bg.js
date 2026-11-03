// 1. 🌟 这里配置每个页面的独立图片库 (区分 PC 和 Mobile) 🌟
const pageEffectsConfig = {
    // 首页：有背景，有波浪
    'page-home': {
        bg: {
            pc: [
                'https://music01-3bxv3bn.maozi.io/wallpaper/13.jpg',
                'https://music01-3bxv3bn.maozi.io/wallpaper/11.jpg',
                'https://music01-3bxv3bn.maozi.io/wallpaper/02.jpg',
                'https://music01-3bxv3bn.maozi.io/wallpaper/15.jpg',
                'https://music01-3bxv3bn.maozi.io/wallpaper/09.jpg'
            ],
            mobile: [
                'https://music01-3bxv3bn.maozi.io/wallpaper/14.jpg',
                'https://music01-3bxv3bn.maozi.io/wallpaper/08.jpg',
                'https://music01-3bxv3bn.maozi.io/wallpaper/03.jpg',
                'https://music01-3bxv3bn.maozi.io/wallpaper/05.jpg',
                'https://music01-3bxv3bn.maozi.io/wallpaper/12.jpg'
            ]
        },
        wave: true,
        waveColor: '#c1f1e3'
    },
    // 文章页：有背景，但【不要波浪】
    'page-wenzhang': {
        bg: {
            pc: [
                'https://music01-3bxv3bn.maozi.io/wallpaper/31.jpg',
                'https://music01-3bxv3bn.maozi.io/wallpaper/21.jpg',
                'https://music01-3bxv3bn.maozi.io/wallpaper/07.jpg',
                'https://music01-3bxv3bn.maozi.io/wallpaper/10.jpg',
                'https://music01-3bxv3bn.maozi.io/wallpaper/27.jpg'
            ],
            mobile: [
                'https://music01-3bxv3bn.maozi.io/wallpaper/28.jpg',
                'https://music01-3bxv3bn.maozi.io/wallpaper/23.jpg',
                'https://music01-3bxv3bn.maozi.io/wallpaper/22.jpg',
                'https://music01-3bxv3bn.maozi.io/wallpaper/24.jpg',
                'https://music01-3bxv3bn.maozi.io/wallpaper/25.jpg',
                'https://music01-3bxv3bn.maozi.io/wallpaper/34.jpg'
            ]
        },
        wave: true,
        waveColor: '#472823'
    },
    'page-xiaoshuo': {
        bg: {
            pc: [
                'https://music01-3bxv3bn.maozi.io/wallpaper/20.jpg',
                'https://music01-3bxv3bn.maozi.io/wallpaper/36.jpg',
                'https://music01-3bxv3bn.maozi.io/wallpaper/37.jpg',
                'https://music01-3bxv3bn.maozi.io/wallpaper/30.jpg',
                'https://music01-3bxv3bn.maozi.io/wallpaper/18.jpg'
            ],
            mobile: [
                'https://music01-3bxv3bn.maozi.io/wallpaper/32.jpg',
                'https://music01-3bxv3bn.maozi.io/wallpaper/29.jpg',
                'https://music01-3bxv3bn.maozi.io/wallpaper/33.jpg',
                'https://music01-3bxv3bn.maozi.io/wallpaper/35.jpg',
                'https://music01-3bxv3bn.maozi.io/wallpaper/23.jpg'
            ]
        },
        wave: true,
        waveColor: '#212652'
    },
    'page-comic': {
        bg: {
            pc: [
                'https://music01-3bxv3bn.maozi.io/wallpaper/06.jpg',
                'https://music01-3bxv3bn.maozi.io/wallpaper/19.jpg',
                'https://music01-3bxv3bn.maozi.io/wallpaper/17.jpg',
                'https://music01-3bxv3bn.maozi.io/wallpaper/01.jpg'
            ],
            mobile: [
                'https://music01-3bxv3bn.maozi.io/wallpaper/04.jpg',
                'https://music01-3bxv3bn.maozi.io/wallpaper/16.jpg',
                'https://music01-3bxv3bn.maozi.io/wallpaper/26.jpg',
                'https://music01-3bxv3bn.maozi.io/wallpaper/22.jpg',
                'https://music01-3bxv3bn.maozi.io/wallpaper/14.jpg'
            ]
        },
        wave: true,
        waveColor:'#1f5e40'
    },
    // 音乐页：只要背景
    'page-music': {
        wave: false
    }
};

// ====================================================
// 🌟 颜色转换工具 & 波浪类重构 🌟
// ====================================================

// 工具函数：把十六进制颜色转为带透明度的 rgba
function hexToRgba(hex, alpha) {
    if (hex.startsWith('rgba') || hex.startsWith('rgb')) {
        return hex; // 如果已经是 rgba，直接返回
    }
    let r = 0, g = 0, b = 0;
    if (hex.length === 4) {
        r = parseInt(hex[1] + hex[1], 16);
        g = parseInt(hex[2] + hex[2], 16);
        b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
        r = parseInt(hex.substring(1, 3), 16);
        g = parseInt(hex.substring(3, 5), 16);
        b = parseInt(hex.substring(5, 7), 16);
    }
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// 基础波浪形状配置（去掉颜色属性，颜色交给动态生成）
const baseWaveConfigs = [
    { y: 50, length: 0.003, amplitude: 15, speed: 0.008, phase: 0, alpha: 0.2 },
    { y: 60, length: 0.004, amplitude: 20, speed: -0.012, phase: 50, alpha: 0.4 },
    { y: 70, length: 0.006, amplitude: 25, speed: 0.018, phase: 150, alpha: 0.6 },
    { y: 85, length: 0.007, amplitude: 20, speed: -0.025, phase: 250, alpha: 0.8 },
    { y: 100, length: 0.009, amplitude: 15, speed: 0.035, phase: 100, alpha: 1.0 }
];

class WaveEffect {
    // 接收主色调
    constructor(canvas, mainColor = '#f6ebd8') {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.animationId = null;

        // 根据主色调，自动生成 5 层波浪的颜色
        this.waves = baseWaveConfigs.map(config => {
            return {
                ...config,
                color: hexToRgba(mainColor, config.alpha)
            };
        });

        this.resize();
    }
    // ... resize, start, pause 方法保持完全不变 ...
    resize() {
        if (this.canvas.parentElement.clientWidth === 0) return;
        const dpr = window.devicePixelRatio || 1;
        this.width = this.canvas.clientWidth;
        this.height = this.canvas.clientHeight;
        this.canvas.width = this.width * dpr;
        this.canvas.height = this.height * dpr;
        this.ctx.scale(dpr, dpr);
    }
    start() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        const loop = () => {
            this.ctx.clearRect(0, 0, this.width, this.height);
            this.waves.forEach(wave => {
                wave.phase += wave.speed;
                this.ctx.beginPath();
                this.ctx.moveTo(0, wave.y);
                for (let x = 0; x <= this.width; x++) {
                    let y = Math.sin(x * wave.length + wave.phase) * wave.amplitude + wave.y;
                    this.ctx.lineTo(x, y);
                }
                this.ctx.lineTo(this.width, this.height);
                this.ctx.lineTo(0, this.height);
                this.ctx.closePath();
                this.ctx.fillStyle = wave.color;
                this.ctx.fill();
            });
            this.animationId = requestAnimationFrame(loop);
        };
        loop();
    }
    pause() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
}

// ====================================================
// 3. 初始化页面（传入配置的颜色）
// ====================================================
function initAllPagesEffects() {
    document.querySelectorAll('.page').forEach(page => {
        const config = pageEffectsConfig[page.id] || {};

        const hasBg = config.bg && ((config.bg.pc && config.bg.pc.length > 0) || (config.bg.mobile && config.bg.mobile.length > 0));
        const needWave = config.wave === true;

        if (!hasBg && !needWave) return;

        let hero = page.querySelector('.hero');
        if (!hero) {
            hero = document.createElement('div');
            hero.className = 'dynamic-hero';
            if (!hasBg) {
                hero.style.background = 'transparent';
                hero.style.height = '120px';
            }
            page.prepend(hero);
        }

        // 注入背景
        if (hasBg) {
            const bgLayer1 = document.createElement('div');
            const bgLayer2 = document.createElement('div');
            bgLayer1.className = 'hero-bg-layer';
            bgLayer2.className = 'hero-bg-layer';
            hero.prepend(bgLayer2);
            hero.prepend(bgLayer1);

            page._bgState = {
                layers: [bgLayer1, bgLayer2],
                active: 0,
                index: 0,
                isMobileMode: null
            };
            updatePageBackground(page, true);
        }

        // 注入波浪（传入 waveColor 参数）
        if (needWave) {
            const canvas = document.createElement('canvas');
            canvas.className = 'wave-canvas';
            hero.appendChild(canvas);

            // 👇 这里读取该页面的专属颜色，如果没写就用默认米黄色
            const customColor = config.waveColor || '#f6ebd8';
            waveInstances[page.id] = new WaveEffect(canvas, customColor);
        }
    });
}

const waveInstances = {};



// 4. 更新背景
function updatePageBackground(page, isInit = false) {
    const config = pageEffectsConfig[page.id];
    if (!config || !config.bg) return;

    const isMobile = window.innerWidth <= 768;
    // 智能回退：如果手机端空，用 PC 图
    const imgs = isMobile ? (config.bg.mobile && config.bg.mobile.length > 0 ? config.bg.mobile : config.bg.pc) : config.bg.pc;

    if (!imgs || imgs.length === 0) return;

    const state = page._bgState;
    if (!state) return;

    if (isInit || state.isMobileMode !== isMobile) {
        state.index = 0;
        state.layers[0].style.backgroundImage = `url('${imgs[0]}')`;
        state.layers[0].classList.add('active');
        state.layers[1].classList.remove('active');
        state.active = 0;
        state.isMobileMode = isMobile;
        return;
    }

    state.index = (state.index + 1) % imgs.length;
    const currentLayer = state.layers[state.active];
    const nextLayer = state.layers[1 - state.active];

    nextLayer.style.backgroundImage = `url('${imgs[state.index]}')`;
    nextLayer.classList.add('active');
    currentLayer.classList.remove('active');

    state.active = 1 - state.active;
}

initAllPagesEffects();

// 5. 全局背景轮播定时器
setInterval(() => {
    const activePage = document.querySelector('.page.active');
    if (activePage && activePage._bgState) {
        updatePageBackground(activePage);
    }
}, 6000);

// 6. 窗口缩放监听
let resizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        const activePage = document.querySelector('.page.active');
        if (activePage && activePage._bgState) {
            updatePageBackground(activePage, true);
        }
        Object.values(waveInstances).forEach(wave => wave.resize());
    }, 300);
});

// 7. 导航栏切换监听（精准控制波浪启停）
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetPageId = 'page-' + btn.getAttribute('data-page');

        // 切页面时暂停所有波浪省电
        Object.values(waveInstances).forEach(wave => wave.pause());

        setTimeout(() => {
            const newActivePage = document.getElementById(targetPageId);
            if (newActivePage) {
                if (newActivePage._bgState) {
                    updatePageBackground(newActivePage, true);
                }

                // 如果目标页面配置了波浪，才启动
                if (waveInstances[targetPageId]) {
                    waveInstances[targetPageId].resize();
                    waveInstances[targetPageId].start();
                }
            }
        }, 50);
    });
});

// 8. 页面加载启动首页
window.addEventListener('load', () => {
    const homeWave = waveInstances['page-home'];
    if (homeWave) {
        homeWave.resize();
        homeWave.start();
    }
});