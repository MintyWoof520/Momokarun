class Typewriter {
    constructor(elementId, paragraphs, customConfig = {}) {
        this.container = document.querySelector(`#${elementId} .text-content`);
        if (!this.container) return;

        this.paragraphs = paragraphs;

        this.config = Object.assign({
            minSpeed: 40,
            maxSpeed: 120,
            punctuationPause: 400,
            lineBreakPause: 800,
            mistakeChance: 0.05,
            deleteSpeed: 80,
            mistakePause: 300,
            startDelay: 500,

            loop: false,
            loopDelay: 2000,     // 打完后停留多久开始删除（2秒）
            removeSpeed: 15      // 整段删除的速度（极速退格）
        }, customConfig);

        this.pIndex = 0;
        this.charIndex = 0;
        this.isDeleting = false;
        this.currentTextStr = ""; // 用字符串维护当前纯文本，避免 DOM 读取产生的 bug

        setTimeout(() => this.type(), this.config.startDelay);
    }

    type() {
        // 如果段落打完了，且不循环，就停止
        if (this.pIndex >= this.paragraphs.length) return;

        const currentParagraph = this.paragraphs[this.pIndex];

        // ================== 删除逻辑 ==================
        if (this.isDeleting) {
            // 每次删除一个字符
            this.currentTextStr = this.currentTextStr.slice(0, -1);

            // 如果当前段落被删空了，进入上一段（或者全部删空）
            if (this.currentTextStr.length === 0) {
                if (this.pIndex > 0) {
                    // 退回到上一段
                    this.pIndex--;
                    this.currentTextStr = this.paragraphs[this.pIndex];
                    this.charIndex = this.currentTextStr.length;
                    // 因为是从末尾删，所以这里直接进入删除状态
                    setTimeout(() => this.type(), this.config.removeSpeed);
                } else {
                    // 第一段也删空了，说明全部删完，准备重新开始
                    this.isDeleting = false;
                    this.pIndex = 0;
                    this.charIndex = 0;
                    this.container.innerHTML = ""; // 清空 DOM

                    // 停顿一会重新开始打字
                    setTimeout(() => this.type(), 500);
                }
                return;
            }

            // 更新 DOM
            this.renderDOM();

            // 继续删除
            setTimeout(() => this.type(), this.config.removeSpeed);
            return;
        }

        // ================== 打字逻辑 ==================
        if (this.charIndex < currentParagraph.length) {
            const char = currentParagraph[this.charIndex];

            // 随机触发打错字
            if (Math.random() < this.config.mistakeChance && /[a-zA-Z\u4e00-\u9fa5]/.test(char)) {
                this.simulateMistake(char);
                return;
            }

            // 正常打出一个字符
            this.currentTextStr += char;
            this.charIndex++;
            this.renderDOM();

            // 计算延迟
            let delay = Math.random() * (this.config.maxSpeed - this.config.minSpeed) + this.config.minSpeed;
            if (/[，,。.！!？?]/.test(char)) delay += this.config.punctuationPause;
            if (char === ' ') delay += 100;
            if (char === '\n') delay += this.config.lineBreakPause;

            setTimeout(() => this.type(), delay);

        } else {
            // 当前段落打完了
            this.pIndex++;
            this.charIndex = 0;

            if (this.pIndex < this.paragraphs.length) {
                // 还有下一段，加个换行
                this.currentTextStr += '\n';
                this.renderDOM();
                setTimeout(() => this.type(), this.config.lineBreakPause + 500);
            } else {
                // ========= 全部打完了 =========
                if (this.config.loop) {
                    // 等待 2 秒后，进入删除状态
                    setTimeout(() => {
                        this.isDeleting = true;
                        // 把索引调整到最后一段
                        this.pIndex = this.paragraphs.length - 1;
                        this.currentTextStr = this.paragraphs[this.pIndex];
                        this.charIndex = this.currentTextStr.length;
                        // 开始删除
                        this.type();
                    }, this.config.loopDelay);
                }
            }
        }
    }

    // 统一负责把当前的字符串渲染到页面上（支持换行）
    renderDOM() {
        // 把 \n 替换为 <br>
        this.container.innerHTML = this.currentTextStr.replace(/\n/g, '<br>');
    }

    // 模拟手滑打错字
    simulateMistake(correctChar) {
        const wrongChars = "qwertyuiopasdfghjklzxcvbnm";
        const wrongChar = wrongChars[Math.floor(Math.random() * wrongChars.length)];

        // 临时打上错字
        this.container.innerHTML = (this.currentTextStr + wrongChar).replace(/\n/g, '<br>');

        setTimeout(() => {
            // 删除错字（DOM 复原）
            this.renderDOM();

            setTimeout(() => {
                // 重新打正确的字
                this.currentTextStr += correctChar;
                this.charIndex++;
                this.renderDOM();

                let delay = Math.random() * (this.config.maxSpeed - this.config.minSpeed) + this.config.minSpeed;
                setTimeout(() => this.type(), delay);
            }, this.config.deleteSpeed);
        }, this.config.mistakePause);
    }
}

// --- 实例化 ---
document.addEventListener('DOMContentLoaded', () => {
    new Typewriter('type1', [
        "今天你微笑了吗？"
    ], {
        loop: true,
        loopDelay: 1500,
        removeSpeed: 90,
        mistakeChance: 0.2,
        mistakePause: 400,
        minSpeed: 50,
        maxSpeed: 90
    });
    new Typewriter('type2', [
        "随便看看吧，大家都在做什么呢？"
    ], {
        loop: true,
        startDelay: 1500,
        removeSpeed: 80,
        mistakeChance: 0.1,
        mistakePause: 400,
        punctuationPause: 800
    });
    new Typewriter('type3', [
        "随便写一写好了"
    ], {
        loop: true,
        startDelay: 1500,
        mistakeChance: 0,
        removeSpeed: 40,
        minSpeed: 40,
        maxSpeed: 70
    });
    new Typewriter('type4', [
        "强者都是孤独的"
    ], {
        loop: true,
        startDelay: 1500,
        mistakeChance: 0.1,
        mistakePause: 400,
        removeSpeed: 100,
        minSpeed: 70,
        maxSpeed: 90
    });
});