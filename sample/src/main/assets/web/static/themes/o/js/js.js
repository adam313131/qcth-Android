// 使用 $(document).ready() 来整合所有需要在DOM加载后执行的脚本
$(document).ready(function() {

    // 1. 给每个菜单项li添加唯一ID
    $('.summary li').each(function(i) {
        $(this).attr('id', "wzlist" + i);
    });

    // 2. 菜单折叠功能的初始化：展开当前页面所在的菜单路径
    // **这是关键：必须在恢复滚动位置之前执行**
    var $currentMenuItem = $('.summary li.current-menu-item');
    if ($currentMenuItem.length > 0) {
        $currentMenuItem.parents('ul').show();
        $currentMenuItem.parents('li:has(ul)').addClass('open');
    }

    // 3. 恢复【左侧菜单】的滚动位置
    // 现在菜单已经展开，高度是正确的
    var $sidebar = $('.book-summary');
    var sidebarStorageKey = 'sidebarScrollPos';
    var savedSidebarPos = localStorage.getItem(sidebarStorageKey);
    if (savedSidebarPos) {
        // 使用一个微小的延时确保浏览器完成渲染
        setTimeout(function() {
            $sidebar.scrollTop(parseInt(savedSidebarPos, 10));
        }, 0);
    }
    
    // 4. 恢复【正文】的滚动位置 (这部分逻辑不变)
    var $scrollableElement = $('.book-body');
    var storageKey = 'scrollPos-' + window.location.pathname;
    // 使用 'load' 事件，因为它需要等待图片等资源加载完以获得准确高度
    $(window).on('load', function() {
        var savedPos = localStorage.getItem(storageKey);
        if (savedPos) {
            $scrollableElement.scrollTop(parseInt(savedPos, 10));
        }
    });


    // --- 以下是事件监听器和逻辑，它们的顺序不那么重要 ---

    // 监听【左侧菜单】滚动并保存位置
    var sidebarScrollTimeout;
    $sidebar.on('scroll', function() {
        clearTimeout(sidebarScrollTimeout);
        sidebarScrollTimeout = setTimeout(function() {
            localStorage.setItem(sidebarStorageKey, $sidebar.scrollTop());
        }, 100);
    });

    // 监听【正文】滚动并保存位置
    var scrollTimeout;
    $scrollableElement.on('scroll', function() {
        clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(function() {
            localStorage.setItem(storageKey, $scrollableElement.scrollTop());
        }, 100);
    });

    // 为菜单项添加点击折叠/展开的事件
    $('.summary li:has(ul) > a').on('click', function(e) {
        var $parentLi = $(this).parent('li');
        if (!$parentLi.hasClass('open') || $(this).attr('href') === '#') {
             e.preventDefault();
        }
        $parentLi.toggleClass('open');
        $parentLi.children('ul').slideToggle();
    });

    // 上一页/下一页按钮逻辑
    if ($currentMenuItem.length > 0) {
        var numbStr = $currentMenuItem.last().attr('id');
        if (numbStr) {
            var numb = parseInt(numbStr.replace("wzlist", ""));
            // 寻找下一页
            var nextLink;
            for (var nextNumb = numb + 1; $('#wzlist' + nextNumb).length > 0; nextNumb++) {
                var potentialLink = $('#wzlist' + nextNumb).children('a').attr('href');
                if (potentialLink && potentialLink !== '#') {
                    nextLink = potentialLink;
                    break;
                }
            }
            if (nextLink) { $("#xiayige").attr("href", nextLink); } 
            else { $("#xiayige").attr("href", "#"); }

            // 寻找上一页
            var prevLink;
            for (var prevNumb = numb - 1; prevNumb >= 0; prevNumb--) {
                var potentialLink = $('#wzlist' + prevNumb).children('a').attr('href');
                if (potentialLink && potentialLink !== '#') {
                    prevLink = potentialLink;
                    break;
                }
            }
            if (prevLink) { $("#shangyige").attr("href", prevLink); }
            else { $("#shangyige").attr("href", "#"); }
        }
    }
});


// --- 其他脚本保持不变 ---

//默认配置
var gitbook = gitbook || [];
gitbook.push(function() {
    gitbook.page.hasChanged({
        "page": {}, "config": { "pluginsConfig": { "fontsettings":{"theme":"white","family":"sans","size":2}, "sharing": { "all": [] }, }, },
        "file": {}, "gitbook": {}, "basePath": ".", "book": {}
    });
});

window.addEventListener('DOMContentLoaded', (event) => {
    // 检测特定浏览器并隐藏
    const userAgent = navigator.userAgent.toLowerCase();
    if (userAgent.includes('ozhuyesu')) {
        const app = document.getElementById('app');
        if (app) { app.style.display = 'none'; }
    }
	// 新增功能：微信或其他浏览器中修改指定链接
	if (userAgent.indexOf('micromessenger') !== -1 || 
        userAgent.indexOf('iphone') !== -1 || 
        userAgent.indexOf('360se') !== -1 || 
        userAgent.indexOf('360ee') !== -1 || 
        userAgent.indexOf('qihoobrowser') !== -1 || 
        userAgent.indexOf('qhbrowser') !== -1) {
        $('.gitbook-link').attr('href', 'https://ozhuyesu.com');
    }
    // 初始化 Pagefind UI
    new PagefindUI({ element: "#search", showSubResults: true });

    // 搜索遮罩层脚本
    const triggerInput = document.getElementById('trigger-search');
    const searchOverlay = document.getElementById('search-overlay');
    const closeBtn = document.getElementById('close-search-btn');
    function openSearch() {
        searchOverlay.classList.add('visible');
        document.querySelector("#search .pagefind-ui__search-input").focus();
    }
    function closeSearch() { searchOverlay.classList.remove('visible'); }
    triggerInput.addEventListener('click', openSearch);
    closeBtn.addEventListener('click', closeSearch);
    searchOverlay.addEventListener('click', function(e) { if (e.target === searchOverlay) { closeSearch(); } });
    document.addEventListener('keydown', function(e) { if (e.key === "Escape" && searchOverlay.classList.contains('visible')) { closeSearch(); } });
});

// 按键翻页脚本
$(document).on('keydown', function(e) {
    if ($(e.target).is('input, textarea')) { return; }
    if (e.key === "ArrowRight") {
        e.preventDefault();
        var nextPageHref = $("#xiayige").attr("href");
        if (nextPageHref && $("#xiayige").is(":visible")) { window.open(nextPageHref, '_self'); }
    } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        var prevPageHref = $("#shangyige").attr("href");
        if (prevPageHref) { window.open(prevPageHref, '_self'); }
    }
	
});

// =========================================================
// 1. 语音播报功能集成 (修复 iOS 和 Firefox 兼容性)
// =========================================================
gitbook.push(function() {
    // 全局变量
    var audio = null;
    var isLoading = false;
    var isPlaying = false;
    var $btnIcon = null;

    // 预热用的静音片段 (WAV格式，兼容性最好)
    var SILENT_WAV = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEAQB8AAEAfAAABAAgAAABmYWN0BAAAAAAAAABkYXRhAAAAAA==';

    // 接口列表
    var API_ENDPOINTS = [
        'https://tts.wangwangit.com/v1/audio/speech', // 主接口
        'https://tts.aliyuns.dpdns.org/v1/audio/speech'  // 备用接口
    ];

    var API_CONFIG = {
        token: '313131',
        payload: {
            "model": "tts-1",
            "voice": "zh-CN-YunjianNeural",
            "style": "narration-relaxed",
            "role": "YoungAdultFemale",
            "styleDegree": 1.5,
            "speed": 1,
            "pitch": 0.95,
            "cleaning_options": {
                "remove_markdown": true,
                "remove_emoji": true,
                "remove_urls": true,
                "remove_line_breaks": false
            }
        }
    };

// 1. 获取正文 (已修改：不读 details 标签内容和 emoji)
    function getPageContent() {
        var content = document.querySelector('.markdown-section');
        if (!content) return document.body.innerText;
        
        var clone = content.cloneNode(true);
        
        // --- 新增：移除不需要播报的元素 ---
        
        // 移除时间戳
        var timeSpans = clone.querySelectorAll('.sa-last-update-time');
        for (var i = 0; i < timeSpans.length; i++) {
            timeSpans[i].remove(); 
        }

        // 移除所有的 details 标签（折叠内容，如经文）
        var detailsElements = clone.querySelectorAll('details');
        for (var j = 0; j < detailsElements.length; j++) {
            detailsElements[j].remove();
        }

        // 提取纯文本
        var text = clone.innerText;

        // --- 新增：移除 Emoji 符号 ---
        // 这个正则表达式涵盖了绝大多数常见的 Emoji 范围
        text = text.replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E6}-\u{1F1FF}\u{1F191}-\u{1F251}\u{1F004}\u{1F0CF}\u{1F170}-\u{1F171}\u{1F17E}-\u{1F17F}\u{1F18E}\u{3030}\u{2B50}\u{2B55}\u{2934}-\u{2935}\u{2B05}-\u{2B07}\u{2B1B}-\u{2B1C}\u{3297}\u{3299}\u{303D}\u{00A9}\u{00AE}\u{2122}\u{23F3}\u{24C2}\u{23E9}-\u{23EF}\u{25B6}\u{23F8}-\u{23FA}]/gu, '');

        return text;
    }
    // 2. 初始化音频对象 (单例模式)
    function initAudio() {
        if (!audio) {
            audio = new Audio();
            audio.autoplay = true; // 对 iOS 有帮助
            audio.preload = 'auto'; // 强制预加载
            
            // 绑定事件
            audio.addEventListener('ended', function() {
                // 忽略静音片段的结束
                if (audio.duration > 0.5) { 
                    isPlaying = false;
                    updateButtonState();
                }
            });
            
            audio.addEventListener('error', function(e) {
                console.error("Audio Error Code:", e.target.error ? e.target.error.code : 'unknown');
                // 如果是静音片段报错，忽略
                if (audio.src !== SILENT_WAV) {
                    resetPlayer();
                }
            });
        }
    }

    // 3. 重置播放器
    function resetPlayer() {
        if (audio) {
            audio.pause();
            audio.currentTime = 0;
        }
        isPlaying = false;
        isLoading = false;
        updateButtonState();
    }

    // 4. 更新 UI
    function updateButtonState() {
        if (!$btnIcon || $btnIcon.length === 0) {
            var $btn = $('a[aria-label="语音播报"]');
            $btnIcon = $btn.find('i');
        }
        if (!$btnIcon || $btnIcon.length === 0) return;

        var $btn = $btnIcon.parent();
        $btnIcon.removeClass('fa-volume-up fa-stop fa-spinner fa-spin');
        
        if (isLoading) {
            $btnIcon.addClass('fa-spinner fa-spin');
            updateBtnText($btn, " 合成中");
        } else if (isPlaying) {
            $btnIcon.addClass('fa-stop');
            updateBtnText($btn, " 停止");
        } else {
            $btnIcon.addClass('fa-volume-up');
            updateBtnText($btn, "");
        }
    }

    function updateBtnText($btn, newText) {
        var contents = $btn.contents();
        var textNodeFound = false;
        for (var i = 0; i < contents.length; i++) {
            if (contents[i].nodeType === 3 && contents[i].nodeValue.trim() !== '') {
                contents[i].nodeValue = newText;
                textNodeFound = true;
                break;
            }
        }
        if (!textNodeFound) {
            $btn.append(document.createTextNode(newText));
        }
    }

    // 5. 递归请求逻辑
    function executeTTSFetch(text, urlIndex) {
        if (urlIndex >= API_ENDPOINTS.length) {
            alert("语音服务暂时不可用，请稍后再试。");
            resetPlayer();
            return;
        }

        var currentUrl = API_ENDPOINTS[urlIndex];
        var requestData = $.extend(true, {}, API_CONFIG.payload);
        requestData.input = text;

        fetch(currentUrl, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + API_CONFIG.token,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        })
        .then(function(response) {
            if (!response.ok) throw new Error('Status ' + response.status);
            // ★★★ 修复 Firefox：显式创建带有 MIME 类型的 Blob ★★★
            return response.blob().then(function(blob) {
                return new Blob([blob], { type: 'audio/mpeg' }); 
            });
        })
        .then(function(blob) {
            if (!isLoading) return;

            var audioUrl = URL.createObjectURL(blob);
            
            // ★★★ 修复 iOS：复用同一个 audio 对象，不要 new ★★★
            audio.src = audioUrl;
            audio.load(); // iOS 必须调用 load
            
            triggerPlay();
        })
        .catch(function(err) {
            console.warn("接口 " + currentUrl + " 失败:", err);
            executeTTSFetch(text, urlIndex + 1);
        });
    }

    // 6. 播放触发器 (Promise 处理)
    function triggerPlay() {
        isLoading = true;
        updateButtonState();
        
        var playPromise = audio.play();
        
        if (playPromise !== undefined) {
            playPromise.then(function() {
                // 真正开始播放了
                isLoading = false;
                isPlaying = true;
                updateButtonState();
            })
            .catch(function(error) {
                console.error("播放被阻止或失败:", error);
                // 尝试再次引导用户点击（对于极端严格的浏览器）
                if (audio.src !== SILENT_WAV) {
                    resetPlayer();
                }
            });
        } else {
            isLoading = false;
            isPlaying = true;
            updateButtonState();
        }
    }

    // 7. 点击处理主逻辑
    function handleTTS(e) {
        if (e) e.preventDefault();
        
        // 立即初始化 (iOS 关键)
        initAudio();

        if (isLoading) return;
        
        // 停止逻辑
        if (isPlaying) {
            resetPlayer();
            return;
        }

        // 缓存播放逻辑
        if (audio.src && audio.src !== "" && audio.src !== SILENT_WAV && !audio.src.startsWith('data:')) {
            triggerPlay();
            return;
        }

        var text = getPageContent();
        text = text.trim();
        if (!text || text.length < 5) {
            alert("正文内容太少，无法播报。");
            return;
        }

        // ★★★ 预热：播放静音 (iOS 关键) ★★★
        // 这一步让 audio 对象获得“播放权”
        audio.src = SILENT_WAV;
        audio.play().catch(function(e){ console.log("预热静音忽略"); });

        isLoading = true;
        updateButtonState();

        // 发起请求
        executeTTSFetch(text, 0);
    }

    // 8. 注册按钮
    if (gitbook.toolbar && typeof gitbook.toolbar.createButton === 'function') {
        gitbook.toolbar.createButton({
            icon: 'fa fa-volume-up',
            label: '语音播报',
            text: '',
            position: 'left',
            onClick: handleTTS
        });
    }
});

// =========================================================
// 2. 繁简切换功能集成 (OpenCC + 缓存修复 + 相对路径修复)
// =========================================================
gitbook.push(function() {
    var converterCN2TW = null;
    var converterTW2CN = null;
    var storageKey = 'gitbook-opencc-mode';
    var currentMode = localStorage.getItem(storageKey) || 'cn';
    
    // 动态获取 js.js 路径
    function getJsBasePath() {
        var scripts = document.getElementsByTagName('script');
        for (var i = 0; i < scripts.length; i++) {
            var src = scripts[i].getAttribute('src');
            if (src && src.indexOf('js.js') !== -1) {
                return src.substring(0, src.lastIndexOf('/') + 1);
            }
        }
        return '';
    }

    var basePath = getJsBasePath();
    var fullJsUrl = basePath + "full.js";

    function ensureOpenCCLoaded(callback) {
        if (typeof OpenCC !== 'undefined') {
            initConverters();
            if (callback) callback();
        } else {
            $.ajax({
                url: fullJsUrl, 
                dataType: "script",
                cache: true, 
                success: function() {
                    initConverters();
                    if (callback) callback();
                },
                error: function() {
                    console.error("无法加载: " + fullJsUrl);
                    alert("繁简转换组件加载失败，请检查网络。");
                    $('.opencc-btn').html(currentMode === 'tw' ? '简' : '繁'); 
                }
            });
        }
    }

    function initConverters() {
        if (!converterCN2TW && typeof OpenCC !== 'undefined') {
            converterCN2TW = OpenCC.Converter({ from: 'cn', to: 'tw' });
            converterTW2CN = OpenCC.Converter({ from: 'tw', to: 'cn' });
        }
    }

    function convertPage(mode) {
        if (!converterCN2TW || !converterTW2CN) return;
        var convertFunc = (mode === 'tw') ? converterCN2TW : converterTW2CN;
        
        var selectors = ['.book-summary', '.page-inner', '.book-header h1', 'title'];
        selectors.forEach(function(selector) {
            $(selector).each(function() {
                traverseAndConvert(this, convertFunc);
            });
        });
        
        if (document.title) document.title = convertFunc(document.title);
    }

    function traverseAndConvert(node, converter) {
        if (['SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA', 'INPUT', 'I', 'BUTTON'].indexOf(node.nodeName) !== -1) return;
        if (node.nodeType === 3) {
            var val = node.nodeValue;
            if (val && val.trim().length > 0) node.nodeValue = converter(val);
        } else {
            for (var i = 0; i < node.childNodes.length; i++) {
                traverseAndConvert(node.childNodes[i], converter);
            }
        }
    }

    if (currentMode === 'tw') {
        ensureOpenCCLoaded(function() {
            setTimeout(function() { convertPage('tw'); }, 100);
        });
    }

    function handleToggle(e) {
        e.preventDefault();
        var $btn = $('.opencc-btn'); 
        if (typeof OpenCC === 'undefined') {
            $btn.html('<i class="fa fa-spinner fa-spin">');
        }
        ensureOpenCCLoaded(function() {
            if (currentMode === 'cn') {
                convertPage('tw');
                currentMode = 'tw';
            } else {
                convertPage('cn');
                currentMode = 'cn';
            }
            $btn.html(currentMode === 'tw' ? '简' : '繁');
            localStorage.setItem(storageKey, currentMode);
        });
    }

    var btnText = currentMode === 'tw' ? '简' : '繁';
    if (gitbook.toolbar && typeof gitbook.toolbar.createButton === 'function') {
        gitbook.toolbar.createButton({
            label: '繁/简切换',
            text: btnText,
            className: 'opencc-btn',
            position: 'left',
            onClick: handleToggle
        });
    }
});
// --- 智能 Header 控制逻辑 (修复版) ---
    var lastScrollTop = 0;
    var $header = $('.book-header');
    var $scrollBody = $('.book-body'); 
    var headerHeight = 50; // 设定一个固定高度阈值，避免初始抖动

    $scrollBody.on('scroll', function() {
        var currentScrollTop = $(this).scrollTop();

        // 1. 忽略负值（iOS 回弹效果）
        if (currentScrollTop < 0) return;

        // 2. 核心逻辑
        if (currentScrollTop > lastScrollTop && currentScrollTop > headerHeight) {
            // [向下滚动] 且 [已滚过Header高度] -> 隐藏
            $header.addClass('header-hidden');
        } else if (currentScrollTop < lastScrollTop) {
            // [向上滚动] -> 立即显示
            // 这里去掉了所有额外判断，只要往上滚就显示
            $header.removeClass('header-hidden');
        }

        // 更新滚动位置
        lastScrollTop = currentScrollTop;
    });