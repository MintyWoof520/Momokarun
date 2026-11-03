(function() {
      const loader = document.getElementById('loader');
      const blogContent = document.getElementById('blogContent');
      const progressFill = document.getElementById('progressFill');
      const percentText = document.getElementById('percentText');

      // 配置
      const MIN_LOADING_TIME = 1800;   // 最短显示时间（毫秒）
      const MAX_LOADING_TIME = 5000;   // 最长显示时间（防止卡死）
      const START_TIME = Date.now();

      // 进度模拟变量
      let progress = 0;
      let progressInterval = null;
      let isCompleted = false;

      // 更新进度UI
      function updateProgressUI(value) {
        const rounded = Math.min(100, Math.floor(value));
        progressFill.style.width = rounded + '%';
        percentText.textContent = rounded + '%';
        if (rounded >= 100) {
          percentText.textContent = '100%';
        }
      }

      // 模拟进度增长
      function startSimulatedProgress() {
        if (progressInterval) clearInterval(progressInterval);

        progressInterval = setInterval(() => {
          if (isCompleted) return;

          let increment = 0;
          
          if (progress < 30) {
            increment = Math.random() * 4 + 2;
          } else if (progress < 60) {
            increment = Math.random() * 2.5 + 1.2;
          } else if (progress < 85) {
            increment = Math.random() * 1.2 + 0.4;
          } else if (progress < 98) {
            increment = Math.random() * 0.5 + 0.1;
          } else {
            increment = 0;
          }

          progress = Math.min(progress + increment, 99);
          updateProgressUI(progress);

          // 超时强制完成
          if (Date.now() - START_TIME > MAX_LOADING_TIME - 300 && !isCompleted) {
            forceComplete();
          }
        }, 120);
      }

      // 强制完成进度
      function forceComplete() {
        if (isCompleted) return;
        isCompleted = true;
        if (progressInterval) {
          clearInterval(progressInterval);
          progressInterval = null;
        }
        progress = 100;
        updateProgressUI(progress);
        
        setTimeout(() => {
          hideLoader();
        }, 350);
      }

      // 隐藏加载层
      function hideLoader() {
        if (loader.classList.contains('fade-out')) return;

        loader.classList.add('fade-out');
        blogContent.classList.add('visible');

        const onFadeOutEnd = function(e) {
          if (e.target === loader && (e.propertyName === 'opacity' || e.propertyName === 'visibility')) {
            loader.removeEventListener('transitionend', onFadeOutEnd);
            if (loader.parentNode) {
              loader.parentNode.removeChild(loader);
            }
          }
        };
        loader.addEventListener('transitionend', onFadeOutEnd);

        setTimeout(() => {
          if (loader.parentNode) {
            loader.parentNode.removeChild(loader);
          }
        }, 800);
      }

      // 启动
      startSimulatedProgress();

      // 页面加载完成
      window.addEventListener('load', function() {
        const elapsed = Date.now() - START_TIME;
        const remaining = Math.max(0, MIN_LOADING_TIME - elapsed);

        setTimeout(() => {
          if (!isCompleted) {
            forceComplete();
          }
        }, remaining);
      });

      // 如果页面已加载完成（缓存情况）
      if (document.readyState === 'complete') {
        setTimeout(() => {
          const elapsed = Date.now() - START_TIME;
          const remaining = Math.max(0, MIN_LOADING_TIME - elapsed);
          setTimeout(() => {
            if (!isCompleted) {
              forceComplete();
            }
          }, remaining);
        }, 10);
      }

      // 超时保护
      setTimeout(() => {
        if (!isCompleted) {
          forceComplete();
        }
      }, MAX_LOADING_TIME);

      // 额外兜底
      setTimeout(() => {
        if (!isCompleted && Date.now() - START_TIME > MIN_LOADING_TIME + 1500) {
          forceComplete();
        }
      }, MIN_LOADING_TIME + 2000);

    })();

    // ==========================================
    // ❄️ 全屏下雪特效引擎 ❄️
    // ==========================================
    function initSnow() {
        const canvas = document.getElementById('snowCanvas');
        const ctx = canvas.getContext('2d');
        let width, height;
        let snowflakes = [];

        // 初始化画布尺寸 (处理高分屏)
        function resize() {
            const dpr = window.devicePixelRatio || 1;
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width * dpr;
            canvas.height = height * dpr;
            ctx.scale(dpr, dpr);
        }
        window.addEventListener('resize', resize);
        resize();

        // 雪花类
        class Snowflake {
            constructor() {
                this.reset();
                // 初始化时随机分布在屏幕各个位置，避免刚开始全在顶部
                this.y = Math.random() * height; 
            }

            reset() {
                this.x = Math.random() * width;
                this.y = -10; // 从屏幕上方外面开始
                this.size = Math.random() * 2.5 + 1; // 雪花大小 1~3.5
                this.speedY = Math.random() * 1.5 + 0.5; // 下落速度
                this.speedX = Math.random() * 1 - 0.5; // 左右飘动速度
                this.opacity = Math.random() * 0.6 + 0.3; // 透明度
                this.swing = Math.random() * Math.PI * 2; // 飘动相位
                this.swingSpeed = Math.random() * 0.02 + 0.01; // 飘动速度
            }

            update() {
                this.y += this.speedY;
                // 左右摇摆（正弦波轨迹）
                this.swing += this.swingSpeed;
                this.x += Math.sin(this.swing) * 0.5 + this.speedX;

                // 如果掉出屏幕底部或左右两边，重置回顶部
                if (this.y > height + 10 || this.x < -10 || this.x > width + 10) {
                    this.reset();
                }
            }

            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                // 画白色的雪花，带一点透明度
                ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
                // 加一点点阴影，让白色雪花在浅色背景上也能看清
                ctx.shadowBlur = 2;
                ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
                ctx.fill();
            }
        }

        // 生成雪花数量 (根据屏幕宽度自适应，防止手机卡顿)
        const snowCount = window.innerWidth < 768 ? 50 : 120;
        for (let i = 0; i < snowCount; i++) {
            snowflakes.push(new Snowflake());
        }

        // 动画循环
        function animate() {
            ctx.clearRect(0, 0, width, height);

            snowflakes.forEach(flake => {
                flake.update();
                flake.draw();
            });

            requestAnimationFrame(animate);
        }

        animate();
    }

    // 页面加载完成后启动下雪
    window.addEventListener('load', initSnow);