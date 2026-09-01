document.addEventListener('DOMContentLoaded', function () {
    // Khai báo dùng chung cho phần render + phần map mục lục.
    // Phải đứng trước renderStoryPages() bên dưới vì const không được hoisting.
    const MONTHS = {
        jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
        jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
    };

    const DEFAULT_DECOR = [
        { icon: 'flower', style: 'top: 10px; left: 10px;' },
        { icon: 'heart', style: 'top: 15px; right: 15px;' },
        { icon: 'flower', style: 'bottom: 10px; right: 10px;' },
        { icon: 'heart', style: 'bottom: 15px; left: 15px;' }
    ];

    const loadingScreen = document.getElementById('loadingScreen');
    const loadingProgress = document.querySelector('.loading-progress');
    const loadingText = document.querySelector('.loading-text');
    const book = document.getElementById('book');
    const bookContainer = document.getElementById('bookContainer');
    renderStoryPages();
    const pages = book.querySelectorAll('.page-wrapper');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const soundToggle = document.getElementById('soundToggle');
    const menuToggle = document.getElementById('menuToggle');
    const menuPanel = document.getElementById('quickMenu');
    const menuOverlay = document.getElementById('menuOverlay');
    const menuClose = document.getElementById('menuClose');
    const menuBody = document.getElementById('menuBody');
    const menuHint = document.getElementById('menuHint');
    const musicToggle = document.getElementById('musicToggle');
    const musicPanel = document.getElementById('musicPanel');
    const musicOverlay = document.getElementById('musicOverlay');
    const musicClose = document.getElementById('musicClose');
    const musicList = document.getElementById('musicList');
    const musicHint = document.getElementById('musicHint');
    const musicVolume = document.getElementById('musicVolume');
    const npPlay = document.getElementById('npPlay');
    const npTitle = document.getElementById('npTitle');
    const npArtist = document.getElementById('npArtist');

    const pageFlipSound = new Audio();
    pageFlipSound.src = "https://foldr.space/f/tXevQBqzD0Bfkwwe";

    const bgMusic = new Audio();
    bgMusic.loop = false;
    bgMusic.volume = 0.7;

    let currentPage = 0;
    let isSoundOn = true;
    let isFlipping = false;

    function simulateLoading() {
        let progress = 0;
        const interval = setInterval(() => {
            progress += Math.random() * 15 + 5;
            if (progress > 100) progress = 100;

            loadingProgress.style.width = `${progress}%`;
            loadingText.textContent = `${Math.round(progress)}%`;

            if (progress === 100) {
                clearInterval(interval);
                setTimeout(() => {
                    document.body.classList.add('loaded');
                    initializeBook();
                }, 500);
            }
        }, 200);
    }

    // ===== Sinh các trang kỷ niệm từ pages.js =====
    // Mọi trang trong STORY_PAGES đều dùng chung khung dưới đây, nên thêm trang
    // chỉ cần thêm dữ liệu, không phải đụng vào index.html.
    function storyPageHTML(page, order) {
        const decor = page.decor || DEFAULT_DECOR[order % DEFAULT_DECOR.length];
        const layout = page.layout || (order % 7) + 1;

        const photos = (page.photos || []).map(photo => `
                    <div class="photo-item">
                        <div class="photo-frame">
                            <img src="${photo.src}" alt="${photo.alt || ''}" loading="lazy">
                            ${photo.caption ? `<div class="photo-caption">${photo.caption}</div>` : ''}
                        </div>
                    </div>`).join('');

        const bubbles = (page.bubbles || []).map(bubble => `
                    <div class="text-bubble-${bubble.variant || 1}" style="${bubble.style || ''}">${bubble.text}</div>`).join('');

        return `<div class="page-wrapper" data-story data-key="${page.id}">
        <div class="front">
            <div class="page-content layout-${layout}">
                <div class="date-label">${page.date}</div>
                ${page.title ? `<h2 class="page-title">${page.title}</h2>` : ''}
                ${photos || bubbles ? `<div class="photo-collage">${photos}${bubbles}
                </div>` : ''}
                <div class="collage-footer">
                    <p class="love-note">${page.note || ''}</p>
                    <div class="signature">
                        <div class="signature-line"></div>
                        <span>${page.signature || ''}</span>
                    </div>
                </div>
                <i class="fas fa-${decor.icon} ${decor.icon}-decoration" style="${decor.style}"></i>
                <div class="page-corner"></div>
                <span class="page-number"></span>
            </div>
        </div>
        <div class="back"></div>
    </div>`;
    }

    function renderStoryPages() {
        const anchor = document.getElementById('storyAnchor');
        const data = typeof STORY_PAGES !== 'undefined' ? STORY_PAGES : null;

        if (!anchor || !data) {
            console.error('[Story] Thiếu #storyAnchor trong index.html hoặc chưa nạp pages.js');
            return;
        }

        const seen = new Set();
        data.forEach(page => {
            if (!page.id) console.warn(`[Story] Trang "${page.date}" chưa có id`);
            else if (seen.has(page.id)) console.warn(`[Story] id bị trùng: "${page.id}"`);
            seen.add(page.id);
        });

        anchor.insertAdjacentHTML('beforebegin', data.map(storyPageHTML).join('\n'));

        // Mục lục phần kỷ niệm sinh từ cùng nguồn dữ liệu -> không bao giờ lệch
        const list = document.querySelector('.toc-list[data-auto="story"]');
        if (list) {
            list.insertAdjacentHTML('beforeend', data.map(page => {
                const key = toDateKey(page.date);
                return `<li data-key="${page.id}"><span>${key ? toDisplayDate(key) : page.date}</span><span></span></li>`;
            }).join(''));
        }
    }

    // Số trang in trên các trang kỷ niệm lấy theo vị trí thật trong sách
    function numberStoryPages() {
        pages.forEach((page, index) => {
            if (!page.hasAttribute('data-story')) return;
            const number = page.querySelector('.page-number');
            if (number) number.textContent = index;
        });
    }

    // ===== Tự động map mục lục <-> trang =====
    // Nguồn duy nhất là chính các trang: .date-label, .page-title, hoặc data-key.
    // Mục lục chỉ cần ghi đúng ngày (hoặc data-key), số trang sẽ được tính lại mỗi lần load.
    function normText(text) {
        return (text || '').replace(/\s+/g, ' ').trim().toLowerCase();
    }

    // "12/11/2025" hoặc "Nov 12, 2025" -> "2025-11-12"; không phải ngày -> null
    function toDateKey(text) {
        const s = normText(text);
        let m = s.match(/^(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})$/);
        if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;

        m = s.match(/^([a-z]{3,})\.?\s+(\d{1,2}),?\s*(\d{4})$/);
        const month = m && MONTHS[m[1].slice(0, 3)];
        if (month) return `${m[3]}-${String(month).padStart(2, '0')}-${m[2].padStart(2, '0')}`;

        return null;
    }

    function toDisplayDate(dateKey) {
        const [y, mo, d] = dateKey.split('-');
        return `${Number(d)}/${Number(mo)}/${y}`;
    }

    function buildPageIndex() {
        const byKey = new Map();
        const byDate = new Map();
        const byTitle = new Map();

        // Trùng khóa thì bỏ qua trang sau; riêng tiêu đề (hay bị đặt giống nhau)
        // thì đánh dấu nhập nhằng để không map bừa, và không cảnh báo cho đỡ nhiễu.
        const add = (map, label, key, index, warn = true) => {
            if (!key) return;
            if (map.has(key)) {
                if (warn) console.warn(`[TOC] ${label} bị trùng "${key}": trang ${map.get(key)} và ${index}`);
                else map.set(key, null);
                return;
            }
            map.set(key, index);
        };

        pages.forEach((page, index) => {
            add(byKey, 'data-key', page.dataset.key, index);
            const dateEl = page.querySelector('.date-label');
            if (dateEl) add(byDate, 'Ngày', toDateKey(dateEl.textContent), index);
            const titleEl = page.querySelector('.page-title');
            if (titleEl) add(byTitle, 'Tiêu đề', normText(titleEl.textContent), index, false);
        });

        return { byKey, byDate, byTitle };
    }

    function syncTableOfContents() {
        const index = buildPageIndex();

        document.querySelectorAll('.toc-list li').forEach(item => {
            const spans = item.querySelectorAll('span');
            const labelEl = spans[0];
            const numberEl = spans.length > 1 ? spans[spans.length - 1] : null;
            const label = labelEl ? labelEl.textContent : '';
            const dateKey = toDateKey(item.dataset.key || label);

            let target;
            if (item.dataset.key && index.byKey.has(item.dataset.key)) {
                target = index.byKey.get(item.dataset.key);
            } else if (dateKey && index.byDate.has(dateKey)) {
                target = index.byDate.get(dateKey);
            } else if (index.byTitle.get(normText(label)) !== null) {
                target = index.byTitle.get(normText(label));
            }

            if (target === undefined) {
                item.classList.add('toc-missing');
                item.removeAttribute('data-page');
                if (numberEl && numberEl !== labelEl) numberEl.textContent = '—';
                console.warn(`[TOC] Chưa có trang cho mục: "${normText(label)}"`);
                return;
            }

            item.classList.remove('toc-missing');
            item.dataset.page = target;
            if (numberEl && numberEl !== labelEl) numberEl.textContent = target;

            // Nếu mục lục ghi theo ngày thì lấy lại ngày từ chính trang đó
            const pageDateEl = dateKey && pages[target].querySelector('.date-label');
            const pageDateKey = pageDateEl && toDateKey(pageDateEl.textContent);
            if (pageDateKey && labelEl) labelEl.textContent = toDisplayDate(pageDateKey);
        });
    }

    // ===== Bảng mục lục nhanh =====
    // Dựng lại từ chính mục lục trong sách (đã được syncTableOfContents xử lý),
    // nên không có nguồn dữ liệu thứ hai để lệch nhau.
    function escapeHTML(text) {
        return String(text).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
    }

    function buildQuickMenu() {
        if (!menuBody) return;

        menuBody.innerHTML = [...document.querySelectorAll('.toc-content .toc-section')].map(section => {
            const heading = section.querySelector('.toc-section-title');
            const items = [...section.querySelectorAll('.toc-list li')].map(item => {
                const label = escapeHTML(item.querySelector('span').textContent.trim());
                if (item.dataset.page === undefined) {
                    return `<li class="menu-item is-missing"><span>${label}</span><span>chưa có</span></li>`;
                }
                return `<li class="menu-item" data-page="${item.dataset.page}"><span>${label}</span><span>tr. ${item.dataset.page}</span></li>`;
            }).join('');

            const title = heading ? `<h3 class="menu-section-title">${escapeHTML(heading.textContent.trim())}</h3>` : '';
            return `${title}<ul class="menu-list">${items}</ul>`;
        }).join('');
    }

    // ===== Trình phát nhạc =====
    // Danh sách bài lấy từ music.js. Thiếu file đó thì panel hiện hướng dẫn thêm nhạc.
    const TRACKS = (typeof PLAYLIST !== 'undefined' && Array.isArray(PLAYLIST)) ? PLAYLIST : [];
    let currentTrack = -1;

    function buildMusicList() {
        if (!musicList) return;

        if (!TRACKS.length) {
            musicList.innerHTML = `<div class="music-empty">
                Chưa có bài hát nào. Chép file <code>.mp3</code> vào thư mục <code>sound/</code>
                rồi thêm một dòng vào <code>music.js</code> là bài sẽ hiện ở đây.
            </div>`;
            if (npPlay) npPlay.disabled = true;
            return;
        }

        musicList.innerHTML = TRACKS.map((track, index) => {
            const subtitle = track.artist || track.note || '';
            return `<button class="music-item" data-track="${index}">
                <span class="music-item-icon"><i class="fas fa-music"></i></span>
                <span class="music-item-text">
                    <span class="music-item-title">${escapeHTML(track.title || track.src)}</span>
                    ${subtitle ? `<span class="music-item-note">${escapeHTML(subtitle)}</span>` : ''}
                </span>
            </button>`;
        }).join('');
    }

    function markCurrentTrack() {
        if (musicList) {
            musicList.querySelectorAll('.music-item').forEach(item => {
                item.classList.toggle('is-current', Number(item.dataset.track) === currentTrack);
            });
        }
        const track = TRACKS[currentTrack];
        if (npTitle) npTitle.textContent = track ? (track.title || track.src) : 'Chưa chọn bài nào';
        if (npArtist) npArtist.textContent = track ? (track.artist || track.note || '') : '';
    }

    function updateSoundIcon() {
        if (soundToggle) soundToggle.innerHTML = `<i class="fas fa-volume-${isSoundOn ? 'up' : 'mute'}"></i>`;
    }

    function setPlayIcon(playing) {
        if (npPlay) npPlay.innerHTML = `<i class="fas fa-${playing ? 'pause' : 'play'}"></i>`;
        if (musicToggle) musicToggle.classList.toggle('is-playing', playing);
    }

    function loadTrack(index, autoplay) {
        if (!TRACKS[index]) return;
        currentTrack = index;
        bgMusic.src = TRACKS[index].src;
        markCurrentTrack();
        if (autoplay) startMusic();
        else setPlayIcon(false);
    }

    function startMusic() {
        if (!TRACKS.length) return;
        if (currentTrack < 0) loadTrack(0, false);
        bgMusic.play().catch(err => {
            console.warn('[Nhạc] Trình duyệt chưa cho phát:', err && err.name, '- bấm nút phát là được');
        });
    }

    function pauseMusic() {
        bgMusic.pause();
        setPlayIcon(false);
    }

    function nextTrack() {
        if (TRACKS.length) loadTrack((currentTrack + 1) % TRACKS.length, true);
    }

    // Sai tên file là lỗi dễ gặp nhất khi thêm nhạc, nên báo thẳng ra panel
    bgMusic.addEventListener('error', () => {
        setPlayIcon(false);
        const track = TRACKS[currentTrack];
        if (!track) return;
        console.warn(`[Nhạc] Không mở được "${track.src}" - kiểm tra lại tên file khai trong music.js`);
        const item = musicList && musicList.querySelector(`.music-item[data-track="${currentTrack}"]`);
        if (item) item.classList.add('is-broken');
        if (npArtist) npArtist.textContent = 'Không mở được file này';
    });

    bgMusic.addEventListener('ended', nextTrack);

    // Nguồn sự thật cho giao diện là chính thẻ audio
    bgMusic.addEventListener('play', () => {
        isSoundOn = true;
        updateSoundIcon();
        setPlayIcon(true);
    });

    bgMusic.addEventListener('pause', () => setPlayIcon(false));

    function initializeBook() {
        numberStoryPages();
        syncTableOfContents();
        buildQuickMenu();
        buildMusicList();
        if (TRACKS.length) loadTrack(0, false);

        pages.forEach((page, index) => {
            page.style.zIndex = pages.length - index;
            const polaroid = page.querySelector('.polaroid');
            if (polaroid) {
                polaroid.style.transform = `rotate(${Math.random() * 10 - 5}deg)`;
            }
        });

        function updateButtons() {
            prevBtn.disabled = currentPage === 0;
            nextBtn.disabled = currentPage === pages.length - 1;
            highlightMenuItem();
        }

        function highlightMenuItem() {
            if (!menuBody) return;
            menuBody.querySelectorAll('.menu-item').forEach(item => {
                item.classList.toggle('is-current', Number(item.dataset.page) === currentPage);
            });
        }

        function isMenuOpen() {
            return menuPanel && menuPanel.classList.contains('is-open');
        }

        // Sticker nhắc chỉ chào một lần: tự tắt sau 9 giây hoặc ngay khi mở panel
        const hintTimers = new Map();

        function showHint(hint, button) {
            if (!hint || !button || button.getAttribute('aria-expanded') === 'true') return;
            hint.classList.add('is-visible');
            button.classList.add('is-hinting');
            hintTimers.set(hint, setTimeout(() => hideHint(hint, button), 9000));
        }

        function hideHint(hint, button) {
            if (!hint) return;
            clearTimeout(hintTimers.get(hint));
            hint.classList.remove('is-visible');
            if (button) button.classList.remove('is-hinting');
        }

        function isMusicOpen() {
            return musicPanel && musicPanel.classList.contains('is-open');
        }

        function openMusic() {
            hideHint(musicHint, musicToggle);
            closeMenu();
            musicPanel.classList.add('is-open');
            musicOverlay.classList.add('is-open');
            musicToggle.setAttribute('aria-expanded', 'true');
        }

        function closeMusic() {
            if (!musicPanel) return;
            musicPanel.classList.remove('is-open');
            musicOverlay.classList.remove('is-open');
            musicToggle.setAttribute('aria-expanded', 'false');
        }

        function openMenu() {
            hideHint(menuHint, menuToggle);
            closeMusic();
            menuPanel.classList.add('is-open');
            menuOverlay.classList.add('is-open');
            menuToggle.setAttribute('aria-expanded', 'true');
            const current = menuBody.querySelector('.menu-item.is-current');
            if (current) current.scrollIntoView({ block: 'center' });
        }

        function closeMenu() {
            if (!menuPanel) return;
            menuPanel.classList.remove('is-open');
            menuOverlay.classList.remove('is-open');
            menuToggle.setAttribute('aria-expanded', 'false');
        }

        function playSound() {
            if (isSoundOn) {
                pageFlipSound.currentTime = 0;
                pageFlipSound.play().catch(e => console.log('Audio play failed:', e));
            }
        }

        function toggleSound() {
            isSoundOn = !isSoundOn;
            updateSoundIcon();
            if (isSoundOn) startMusic();
            else pauseMusic();
        }

        function createHeart(x, y) {
            if (!isSoundOn) return;
            const heart = document.createElement('i');
            heart.className = 'fas fa-heart heart';
            heart.style.left = `${x}px`;
            heart.style.top = `${y}px`;
            bookContainer.appendChild(heart);
            setTimeout(() => heart.remove(), 5000);
        }

        function createSparkle(x, y) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.style.left = `${x}px`;
            sparkle.style.top = `${y}px`;
            bookContainer.appendChild(sparkle);
            setTimeout(() => sparkle.remove(), 1500);
        }

        function goToPage(targetPage) {
            if (isFlipping || targetPage === currentPage) return;
            if (targetPage < 0 || targetPage >= pages.length) return;
            isFlipping = true;

            if (targetPage > currentPage) {
                for (let i = currentPage; i < targetPage; i++) {
                    pages[i].classList.add('flipped');
                }
            } else if (targetPage < currentPage) {
                for (let i = currentPage - 1; i >= targetPage; i--) {
                    pages[i].classList.remove('flipped');
                }
            }

            playSound();

            const rect = bookContainer.getBoundingClientRect();
            for (let i = 0; i < 3; i++) {
                const heartX = rect.left + Math.random() * rect.width;
                const heartY = rect.top + rect.height * (0.6 + Math.random() * 0.3);
                createHeart(heartX, heartY);
                createSparkle(heartX, heartY);
            }

            setTimeout(() => {
                isFlipping = false;
                currentPage = targetPage;
                updateButtons();
            }, 1200);
        }

        function goToNextPage() { goToPage(currentPage + 1); }
        function goToPrevPage() { goToPage(currentPage - 1); }

        nextBtn.addEventListener('click', goToNextPage);
        prevBtn.addEventListener('click', goToPrevPage);
        soundToggle.addEventListener('click', toggleSound);

        const tocItems = document.querySelectorAll('.toc-list li');
        tocItems.forEach(item => {
            item.addEventListener('click', () => {
                const targetPage = parseInt(item.dataset.page, 10);
                if (Number.isInteger(targetPage)) goToPage(targetPage);
            });
        });

        if (menuToggle && menuPanel && menuOverlay && menuBody) {
            menuToggle.addEventListener('click', () => (isMenuOpen() ? closeMenu() : openMenu()));
            menuClose.addEventListener('click', closeMenu);
            menuOverlay.addEventListener('click', closeMenu);

            menuBody.addEventListener('click', (e) => {
                const item = e.target.closest('.menu-item[data-page]');
                if (!item) return;
                closeMenu();
                goToPage(Number(item.dataset.page));
            });

            menuPanel.querySelectorAll('.quick-jump').forEach(button => {
                button.addEventListener('click', () => {
                    closeMenu();
                    goToPage(button.dataset.page === 'last' ? pages.length - 1 : 0);
                });
            });

            if (menuHint) menuHint.addEventListener('click', openMenu);
        }

        if (musicToggle && musicPanel && musicOverlay && musicList) {
            musicToggle.addEventListener('click', () => (isMusicOpen() ? closeMusic() : openMusic()));
            musicClose.addEventListener('click', closeMusic);
            musicOverlay.addEventListener('click', closeMusic);
            if (musicHint) musicHint.addEventListener('click', openMusic);

            musicList.addEventListener('click', (e) => {
                const item = e.target.closest('.music-item');
                if (!item) return;
                const index = Number(item.dataset.track);
                if (index === currentTrack && !bgMusic.paused) pauseMusic();
                else loadTrack(index, true);
            });

            if (npPlay) {
                npPlay.addEventListener('click', () => {
                    if (bgMusic.paused) startMusic();
                    else pauseMusic();
                });
            }

            if (musicVolume) {
                bgMusic.volume = Number(musicVolume.value);
                musicVolume.addEventListener('input', () => {
                    bgMusic.volume = Number(musicVolume.value);
                });
            }
        }

        setTimeout(() => {
            showHint(menuHint, menuToggle);
            showHint(musicHint, musicToggle);
        }, 1200);

        bookContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('page-corner')) goToNextPage();
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                closeMenu();
                closeMusic();
                return;
            }
            if (isMenuOpen() || isMusicOpen()) return;
            if (e.key === 'ArrowRight') goToNextPage();
            if (e.key === 'ArrowLeft') goToPrevPage();
        });

        let touchStartX = 0;
        let touchEndX = 0;
        bookContainer.addEventListener('touchstart', (e) => {
            touchStartX = e.changedTouches[0].screenX;
        });
        bookContainer.addEventListener('touchend', (e) => {
            touchEndX = e.changedTouches[0].screenX;
            if (touchEndX < touchStartX - 50) goToNextPage();
            if (touchEndX > touchStartX + 50) goToPrevPage();
        });

        if (isSoundOn) setTimeout(startMusic, 1000);

        updateButtons();
    }

    simulateLoading();
});
