(function () {
    'use strict';

    var SECRET_HASH = 894718129;

    function hashSecret(s) {
        var h = 0;
        for (var i = 0; i < s.length; i++) {
            h = (h * 31 + s.charCodeAt(i)) >>> 0;
        }
        return h;
    }
    window.mintHashSecret_k8v3n = hashSecret;

    // 【注意】如果你的封面图不显示，请检查 cover 路径是否正确！
    // 为了演示，我把第一本书的 cover 改成了在线测试图片，你可以自己换回来
    var books = [
        {
            id: 'tclp',
            title: '噩梦时代',
            author: '仄黎',
            tags: ['悬疑推理', '悬疑探险', '末日', '已完结'],
            status: '已完结',
            color: '#a265be',
            cover: 'https://nightmare-ez3.pages.dev/Images/0.webp',
            height: 208,
            intro: '结局无固定cp，非无cp文<br>3120年，世界各地忽然爆发大量生物变异与灵异事件',
            recommend: '^^',
            link: 'https://nightmare-ez3.pages.dev'
        },
        {
            id: 'dmm',
            title: '变成动物后和大猫猫恋爱啦',
            author: '一勺蓝',
            tags: ['晋江', '百合', '兽穿', '已完结'],
            status: '已完结',
            color: '#e8d6b8',
            cover: 'https://images.unsplash.com/photo-1792953139637-f3720b050016?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
            height: 190,
            intro: '<p>随喜上一秒还在看幼狮打滚卖萌，下一秒就穿成了其中一员。</p><p>新妈妈正和别的狮子舔毛，随喜呆呆坐着看视线里的一群黄色毛绒绒，背后突然来了袭击，不知道哪个姐妹兄弟扑过来对着她嗷嗷咬。</p><p>随喜：给我整哪儿来了？</p><p>自此她过上了每天追着野牛斑马屁股啃，和平头哥比胆气，和狒狒比嗓门的日子。</p><p>不过好在随喜运气不错，有一个好闺蜜，嘿嘿。</p><p>闺蜜不仅长得好，还很能打，天上飞的水里游的它都能抓到，还动不动就给随喜舔毛。</p><p>随喜：幸福！</p> <p>可到了繁衍期，闺蜜却不喜欢隔壁流浪雄狮，偏偏对她翘起尾巴。</p><p>随喜：……不是，怎么办啊？她虽然喜欢女的，但狮子也太超过了吧……</p><p>眼看着好闺蜜从意气风发变得蔫头蔫脑，连最爱的斑马都不吃了，随喜焦躁地转了三百个圈，成功磨平一圈草后，咬咬牙，决定献祭自己的节操。</p><p>一次，就一次，她就被缠上了。</p><p>随喜：这合理吗？你不要过来啊！</p>',
            recommend: '主角一直是动物不会变人，快穿 1v1。内含0% 专业知识，纯瞎编甜甜恋爱。',
            link: 'xiaoshuo/bcdwh/bcdwhhdmmtlal.html'
        }
    ];

    var hiddenBooks = [
        {
            id: 'whale',
            title: '潮汐渔网',
            author: '🐳 胖鲸鱼',
            tags: ['隐藏', '彩蛋'],
            status: '神秘',
            color: '#bde8f2',
            cover: 'https://images.unsplash.com/photo-1793119236496-3f0857072271?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
            height: 214,
            intro: '一本没有上架的书。据说只有对着薄荷说出正确暗号的人，才能在书架最右边抽到它。',
            recommend: '“数据是海洋，算力是潮汐，而好奇心是唯一的渔网。”——胖鲸鱼把这句话夹在了书里。',
            link: '#'
        },
        {
            id: 'secret2',
            title: '薄荷的话',
            author: 'MintyWoof',
            tags: ['隐藏', '彩蛋'],
            status: '绝密',
            color: '#c4e0b2',
            cover: 'https://images.unsplash.com/photo-1792849619596-ca344e14189d?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
            height: 180,
            intro: '诶呀，被你找到了呢！',
            recommend: '“不要轻易翻开它，否则你会掉进名为前端的深渊。”',
            link: '#'
        },
        {
            id: 'secret3',
            title: '穿书女配不想死',
            author: '酸奶蛋糕',
            tags: ['晋江', '言情', '已完结'],
            status: '彩蛋',
            color: '#c4e0b2',
            cover: 'https://images.unsplash.com/photo-1793249970806-38f57f588ebc?q=80&w=753&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=NHwxMjA3fDA%3D',
            height: 180,
            intro: '<p>苏余熬夜看完了一本百万字的霸总类小说，然后猝死了，再然后穿成了里头假冒女主的恶毒继妹。</p><p>苏余掰着手指头算了下女主还有几天会携带龙凤胎霸气回国，立马开启疯狂甩男主模式。</p><p>结果，原本对她不上心的男主脑残般的死活不同意分手，眼见着女主已经到了机场。</p><p>苏余求生欲旺盛，一个电话打到男主家，吼道：“我是霍启女朋友，你们必须给我个名分，不然……不然……”</p><p>“不然怎样？”电话里，一个低沉冷冽的声音响起。</p><p>苏余：“？？？”</p><p>你哪位？</p><p>“一个亿，离开我弟。”</p><p>苏余：“好咧！！！！”</p><p>霍秦：“……”</p><p>十分钟后，苏余战战兢兢的看着手机银行短信，含泪再次打电话，她哭了：“哥，你弟给我转了两个亿，不让我跟他分手。”</p><p>“哥，救命！”</p><p>霍秦：“……”</p><p>“哥，你说话啊，哥！”</p><p>“哥！”</p><p>良久良久，霍秦才吐出几个字：“我不是你哥……”</p><p>霍秦这辈子最大的困惑就是，苏余到底是怎么成他媳妇的。</p>',
            recommend: '“不要轻易翻开它，否则你会掉进名为前端的深渊。”',
            link: 'xiaoshuo/csnpbxs/csnpbxs.html'
        },
        {
            id: 'secret2',
            title: '占位模板',
            author: 'MintyWoof',
            tags: ['隐藏', '彩蛋'],
            status: '绝密',
            color: '#c4e0b2',
            cover: '',
            height: 180,
            intro: '诶呀，被你找到了呢！',
            recommend: '“不要轻易翻开它，否则你会掉进名为前端的深渊。”',
            link: '#'
        }
    ];

    var state = { tag: '全部', activeId: null, unlocked: false };
    var eggClickCount = 0;
    var eggClickTimer = null;

    var shelf = document.getElementById('mint-shelf-k8v3n');
    var detail = document.getElementById('mint-detail-k8v3n');
    var filters = document.getElementById('mint-filters-k8v3n');

    var elTitle = document.getElementById('mint-book-title-k8v3n');
    var elStatus = document.getElementById('mint-book-status-k8v3n');
    var elAuthor = document.getElementById('mint-book-author-k8v3n');
    var elTags = document.getElementById('mint-book-tags-k8v3n');
    var elIntro = document.getElementById('mint-book-intro-k8v3n');
    var elRec = document.getElementById('mint-book-rec-k8v3n');
    var elLink = document.getElementById('mint-book-link-k8v3n');
    var elClose = document.getElementById('mint-book-close-k8v3n');

    var eggTrigger = document.getElementById('mint-egg-trigger-k8v3n');
    var modal = document.getElementById('mint-modal-k8v3n');
    var eggInput = document.getElementById('mint-egg-input-k8v3n');
    var eggBtn = document.getElementById('mint-egg-btn-k8v3n');
    var btnCancel = document.getElementById('mint-btn-cancel-k8v3n');
    var eggMsg = document.getElementById('mint-egg-msg-k8v3n');

    var TILT = [-0.8, 0.6, -0.3, 1.0, -0.7, 0.2, -1.0, 0.75];

    function isLightColor(hex) {
        var c = String(hex || '').replace('#', '');
        if (c.length === 3) {
            c = c.charAt(0) + c.charAt(0) + c.charAt(1) + c.charAt(1) + c.charAt(2) + c.charAt(2);
        }
        if (c.length !== 6) return false;
        var r = parseInt(c.substr(0, 2), 16);
        var g = parseInt(c.substr(2, 2), 16);
        var b = parseInt(c.substr(4, 2), 16);
        return (0.299 * r + 0.587 * g + 0.114 * b) > 150;
    }

    function allBooks() {
        return state.unlocked ? books.concat(hiddenBooks) : books.slice();
    }

    function findBook(id) {
        var list = allBooks();
        for (var i = 0; i < list.length; i++) {
            if (list[i].id === id) return list[i];
        }
        return null;
    }

    function makeSpine(book, isEgg, index) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'mint-spine-k8v3n' + (isEgg ? ' is-egg-k8v3n' : '');
        btn.setAttribute('data-book-id', book.id);
        btn.style.setProperty('--spine-color', book.color || '#dcedc1');
        btn.style.setProperty('--spine-h', (book.height || 200) + 'px');
        btn.style.setProperty('--rz', TILT[index % TILT.length] + 'deg');
        btn.style.setProperty('--ink', isLightColor(book.color) ? '#1a1a1a' : '#ffffff');

        // 修复封面图加载逻辑
        if (book.cover) {
            btn.classList.add('has-cover-k8v3n');
            // 确保路径被正确地包裹在 url() 中
            btn.style.setProperty('--cover', 'url("' + book.cover + '")');
        }

        btn.setAttribute('aria-label', '抽出《' + book.title + '》');

        var t = document.createElement('span');
        t.className = 'mint-spine-title-k8v3n';
        t.textContent = book.title;

        var a = document.createElement('span');
        a.className = 'mint-spine-author-k8v3n';
        a.textContent = book.author;

        btn.appendChild(t);
        btn.appendChild(a);
        btn.addEventListener('click', function () { toggleBook(book.id); });
        return btn;
    }

    function renderShelf() {
        var list = books.filter(function (b) {
            return state.tag === '全部' || b.tags.indexOf(state.tag) !== -1;
        });

        shelf.innerHTML = '';

        var idx = 0;
        list.forEach(function (b) {
            shelf.appendChild(makeSpine(b, false, idx++));
        });

        if (state.unlocked) {
            hiddenBooks.forEach(function (hb) {
                shelf.appendChild(makeSpine(hb, true, idx++));
            });
        }

        if (state.activeId) {
            var current = findBook(state.activeId);
            if (current) {
                var activeEl = shelf.querySelector('[data-book-id="' + state.activeId + '"]');
                if (activeEl) activeEl.classList.add('is-active-k8v3n');
            } else {
                closeDetail();
            }
        }
    }

    function toggleBook(id) {
        if (state.activeId === id) {
            closeDetail();
        } else {
            openDetail(id);
        }
    }

    function openDetail(id) {
        var book = findBook(id);
        if (!book) return;

        state.activeId = id;
        var spines = shelf.querySelectorAll('.mint-spine-k8v3n');
        for (var i = 0; i < spines.length; i++) spines[i].classList.remove('is-active-k8v3n');

        var activeEl = shelf.querySelector('[data-book-id="' + id + '"]');
        if (activeEl) activeEl.classList.add('is-active-k8v3n');

        elTitle.textContent = book.title;
        elStatus.textContent = book.status || '';
        elAuthor.textContent = '作者：' + book.author;
        elIntro.innerHTML = book.intro;
        elRec.textContent = book.recommend;
        elLink.href = book.link || '#';

        elTags.innerHTML = '';
        (book.tags || []).forEach(function (tag) {
            var s = document.createElement('span');
            s.textContent = tag;
            elTags.appendChild(s);
        });

        detail.classList.add('is-open-k8v3n');
    }

    function closeDetail() {
        state.activeId = null;
        detail.classList.remove('is-open-k8v3n');
        var spines = shelf.querySelectorAll('.mint-spine-k8v3n');
        for (var i = 0; i < spines.length; i++) spines[i].classList.remove('is-active-k8v3n');
    }

    elClose.addEventListener('click', closeDetail);

    filters.addEventListener('click', function (e) {
        var chip = e.target.closest('.mint-chip-k8v3n');
        if (!chip) return;
        var tag = chip.getAttribute('data-tag');
        if (!tag || tag === state.tag) return;

        state.tag = tag;
        var chips = filters.querySelectorAll('.mint-chip-k8v3n');
        for (var i = 0; i < chips.length; i++) {
            chips[i].classList.toggle('is-on-k8v3n', chips[i] === chip);
        }
        renderShelf();
    });

    // ================= 彩蛋逻辑 =================
    eggTrigger.addEventListener('click', function () {
        eggClickCount++;

        if (eggClickTimer) clearTimeout(eggClickTimer);

        eggClickTimer = setTimeout(function () {
            eggClickCount = 0;
        }, 2000);

        if (eggClickCount >= 5) {
            eggClickCount = 0;
            clearTimeout(eggClickTimer);
            openModal();
        }
    });

    function openModal() {
        if (state.unlocked) {
            alert('你已经抽出了隐藏的书～去书架最右边看看吧！');
            return;
        }
        modal.classList.add('is-open-k8v3n');
        eggInput.value = '';
        eggMsg.textContent = '';
        eggMsg.className = 'mint-egg-msg-k8v3n';
        setTimeout(function () { eggInput.focus(); }, 100);
    }

    function closeModal() {
        modal.classList.remove('is-open-k8v3n');
    }

    btnCancel.addEventListener('click', closeModal);

    modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
    });

    function tryEgg() {
        var val = eggInput.value.trim();
        if (!val) {
            eggMsg.className = 'mint-egg-msg-k8v3n';
            eggMsg.textContent = '暗号不能为空哦。';
            return;
        }
        if (hashSecret(val) === SECRET_HASH) {
            eggMsg.className = 'mint-egg-msg-k8v3n is-good-k8v3n';
            eggMsg.textContent = '验证成功！胖鲸鱼吐出了隐藏的书……';

            // 👇 新增：触发撒花特效
            triggerConfetti();

            setTimeout(function () {
                closeModal();
                state.unlocked = true;
                state.tag = '全部';
                var chips = filters.querySelectorAll('.mint-chip-k8v3n');
                for (var i = 0; i < chips.length; i++) {
                    chips[i].classList.toggle('is-on-k8v3n', chips[i].getAttribute('data-tag') === '全部');
                }
                renderShelf();
                setTimeout(function () {
                    if (hiddenBooks.length > 0) {
                        openDetail(hiddenBooks[0].id);
                        shelf.scrollLeft = shelf.scrollWidth;
                    }
                }, 300);
            }, 1000);

        } else {
            eggMsg.className = 'mint-egg-msg-k8v3n';
            eggMsg.textContent = '暗号不对，胖鲸鱼又潜入深海了。';
        }
    }

    eggBtn.addEventListener('click', tryEgg);
    eggInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            tryEgg();
        }
    });

    shelf.addEventListener('wheel', function (e) {
        if (this.scrollWidth <= this.clientWidth) return;

        if (e.deltaY !== 0) {
            e.preventDefault();
            this.scrollLeft += e.deltaY;
        }
    }, { passive: false });

    renderShelf();
})();