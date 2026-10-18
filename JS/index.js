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