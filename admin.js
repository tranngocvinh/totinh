/* =============================================================================
   TRANG QUẢN TRỊ KỶ NIỆM — CRUD trên Supabase
   -----------------------------------------------------------------------------
   Yêu cầu: đã chạy supabase/setup.sql và điền supabase-config.js.
   Đăng nhập bằng tài khoản tạo trong Supabase → Authentication → Users.
   ============================================================================= */

(function () {
    'use strict';

    const CONFIG = window.SUPABASE_CONFIG || {};
    const TABLE = CONFIG.table || 'story_pages';
    const BUCKET = CONFIG.bucket || 'story-images';

    const state = {
        client: null,
        session: null,
        pages: [],
        filter: '',
        editingId: null,
        saving: false,
        loading: false,
        loadToken: 0,
        authBusy: false,
        lastFocus: null
    };

    const q = id => document.getElementById(id);

    // ---------------------------------------------------------------------
    // Tiện ích
    // ---------------------------------------------------------------------
    function escapeHTML(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[ch]));
    }

    function truncate(text, max) {
        const value = String(text || '');
        return value.length > max ? value.slice(0, max - 1).trimEnd() + '…' : value;
    }

    function stripHTML(html) {
        if (!html) return '';
        try {
            const doc = new DOMParser().parseFromString(String(html), 'text/html');
            return (doc.body.textContent || '').replace(/\s+/g, ' ').trim();
        } catch (err) {
            return String(html).replace(/<[^>]+>/g, ' ');
        }
    }

    function parseArray(value) {
        if (window.StoryAPI && typeof StoryAPI.parseArray === 'function') return StoryAPI.parseArray(value);
        if (Array.isArray(value)) return value;
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return Array.isArray(parsed) ? parsed : [];
            } catch (err) {
                return [];
            }
        }
        return [];
    }

    function parseObject(value) {
        if (window.StoryAPI && typeof StoryAPI.parseObject === 'function') return StoryAPI.parseObject(value);
        if (value && typeof value === 'object' && !Array.isArray(value)) return value;
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null;
            } catch (err) {
                return null;
            }
        }
        return null;
    }

    function toISODate(value) {
        if (window.StoryAPI && typeof StoryAPI.toISODate === 'function') return StoryAPI.toISODate(value);
        const match = String(value || '').match(/^(\d{4}-\d{2}-\d{2})/);
        return match ? match[1] : '';
    }

    function formatShortDate(value) {
        const iso = toISODate(value);
        if (!iso) return String(value || '');
        const [year, month, day] = iso.split('-');
        return `${day}/${month}/${year}`;
    }

    function todayISO() {
        const now = new Date();
        const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
        return local.toISOString().slice(0, 10);
    }

    function randomId(length) {
        const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
        let out = '';
        for (let i = 0; i < (length || 6); i++) out += chars[Math.floor(Math.random() * chars.length)];
        return out;
    }

    function configReady() {
        if (window.StoryAPI && typeof StoryAPI.isConfigured === 'function') return StoryAPI.isConfigured();
        return Boolean(String(CONFIG.url || '').trim() && String(CONFIG.anonKey || '').trim());
    }

    function libraryReady() {
        return Boolean(window.supabase && typeof window.supabase.createClient === 'function');
    }

    function friendlyError(err) {
        const message = (err && (err.message || err.error_description || err.details || err.hint)) || String(err || 'Lỗi không xác định');

        if (/Could not find the table|relation .* does not exist|schema cache/i.test(message)) {
            return `Chưa có bảng "${TABLE}" trong Supabase. Hãy chạy file supabase/setup.sql (hoặc schema.sql + seed.sql) trước.`;
        }
        if (/Bucket not found/i.test(message)) {
            return `Chưa có bucket "${BUCKET}". Chạy lại phần Storage trong supabase/schema.sql.`;
        }
        if (/Payload too large|maximum allowed size|exceeded the maximum/i.test(message)) {
            return 'Ảnh vượt quá 10 MB. Hãy chọn ảnh nhỏ hơn.';
        }
        if (/mime type|not allowed/i.test(message)) {
            return 'Định dạng ảnh chưa được hỗ trợ. Dùng JPG, PNG, WebP, GIF hoặc AVIF.';
        }
        if (/duplicate key|already exists/i.test(message)) {
            return 'ID trang đã tồn tại. Chọn ngày khác hoặc tải lại danh sách rồi thử lại.';
        }
        if (/row-level security|permission denied/i.test(message)) {
            return 'Tài khoản không có quyền thao tác. Kiểm tra RLS và đăng nhập lại.';
        }
        if (/JWT|invalid token|token is expired/i.test(message)) {
            return 'Phiên đăng nhập đã hết hạn. Đăng nhập lại.';
        }
        if (/Invalid API key|apikey/i.test(message)) {
            return 'anon key không đúng. Kiểm tra lại supabase-config.js.';
        }
        if (/Failed to fetch|NetworkError|Load failed/i.test(message)) {
            return 'Không kết nối được Supabase. Kiểm tra mạng và Project URL.';
        }
        if (/PGRST116|0 rows|JSON object requested/i.test(message)) {
            return 'Trang không còn tồn tại (có thể đã bị xóa ở nơi khác). Tải lại danh sách.';
        }
        return message;
    }

    function friendlyAuthError(err) {
        const message = (err && (err.message || err.error_description)) || String(err || '');
        if (/Invalid login credentials/i.test(message)) return 'Email hoặc mật khẩu không đúng.';
        if (/Email not confirmed/i.test(message)) {
            return 'Tài khoản chưa xác nhận email. Xác nhận trong Supabase → Authentication → Users.';
        }
        return friendlyError(err);
    }

    let toastTimer = null;
    function showToast(message, type) {
        const toast = q('toast');
        toast.textContent = message;
        toast.className = `toast toast-${type === 'error' ? 'error' : 'success'}`;
        toast.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => { toast.hidden = true; }, 4500);
    }

    function showLoginError(message) {
        const box = q('loginError');
        box.textContent = message;
        box.hidden = !message;
    }

    function hideLoginError() {
        showLoginError('');
    }

    function hideBoot() {
        q('bootView').hidden = true;
    }

    function showSetup(message) {
        hideBoot();
        if (message) q('setupMessage').textContent = message;
        q('setupView').hidden = false;
        q('loginView').hidden = true;
        q('dashboardView').hidden = true;
        q('logoutBtn').hidden = true;
    }

    // ---------------------------------------------------------------------
    // Khởi động + đăng nhập
    // ---------------------------------------------------------------------
    document.addEventListener('DOMContentLoaded', init);

    async function init() {
        bindEvents();

        if (!configReady()) {
            showSetup('Bạn chưa điền Project URL và anon key vào file supabase-config.js.');
            return;
        }
        if (!libraryReady()) {
            showSetup('Không tải được thư viện supabase-js từ CDN. Kiểm tra kết nối mạng rồi tải lại trang.');
            return;
        }

        try {
            state.client = window.StoryAPI ? StoryAPI.getClient() : null;
        } catch (err) {
            console.error('[Admin] Không tạo được Supabase client:', err);
            state.client = null;
        }
        if (!state.client) {
            showSetup('Không khởi tạo được Supabase client. Kiểm tra lại URL và anon key trong supabase-config.js.');
            return;
        }

        hideBoot();

        try {
            const { data, error } = await state.client.auth.getSession();
            if (error) throw error;
            setSession(data.session || null);
        } catch (err) {
            console.error('[Admin] getSession:', err);
            setSession(null);
            showLoginError(friendlyAuthError(err));
        }

        state.client.auth.onAuthStateChange((event, session) => {
            if (event === 'INITIAL_SESSION') return;
            setSession(session);
        });
    }

    function setSession(session) {
        const previous = state.session;
        const previousId = previous && previous.user ? previous.user.id : null;
        const userId = session && session.user ? session.user.id : null;

        state.session = session || null;
        q('logoutBtn').hidden = !userId;

        if (userId) {
            q('setupView').hidden = true;
            q('loginView').hidden = true;
            q('dashboardView').hidden = false;
            q('userEmail').textContent = session.user.email || '';

            if (userId !== previousId) {
                state.pages = [];
                loadPages();
            }
            return;
        }

        q('setupView').hidden = true;
        q('loginView').hidden = false;
        q('dashboardView').hidden = true;

        if (previousId) {
            state.loadToken += 1;
            state.loading = false;
            state.pages = [];
            closeEditor(true);
            renderStats();
            renderList();
        }
    }

    async function handleLogin(event) {
        event.preventDefault();
        if (state.authBusy || !state.client) return;

        const email = q('loginEmail').value.trim();
        const password = q('loginPassword').value;

        hideLoginError();
        if (!email || !password) {
            showLoginError('Nhập đầy đủ email và mật khẩu.');
            return;
        }

        setAuthBusy(true);
        try {
            const { data, error } = await state.client.auth.signInWithPassword({ email, password });
            if (error) throw error;
            q('loginForm').reset();
            setSession(data.session);
            showToast('Đăng nhập thành công.');
        } catch (err) {
            console.error('[Admin] login:', err);
            showLoginError(friendlyAuthError(err));
        } finally {
            setAuthBusy(false);
        }
    }

    function setAuthBusy(busy) {
        state.authBusy = busy;
        const button = q('loginBtn');
        button.disabled = busy;
        button.innerHTML = busy
            ? '<i class="fas fa-spinner fa-spin"></i> Đang đăng nhập…'
            : '<i class="fas fa-unlock-keyhole"></i> Đăng nhập';
    }

    async function handleLogout() {
        if (!state.client) return;
        try {
            await state.client.auth.signOut();
        } catch (err) {
            console.warn('[Admin] signOut:', err);
        }
        setSession(null);
        showToast('Đã đăng xuất.');
    }

    // ---------------------------------------------------------------------
    // Tải + hiển thị danh sách
    // ---------------------------------------------------------------------
    async function loadPages() {
        if (!state.client || !state.session) return;

        const token = ++state.loadToken;
        state.loading = true;
        renderStats();
        renderList();

        let errorMessage = '';
        try {
            const { data, error } = await state.client
                .from(TABLE)
                .select('*')
                .order('date', { ascending: false })
                .order('sort_order', { ascending: true })
                .order('id', { ascending: true });

            if (error) throw error;
            if (token !== state.loadToken) return;
            state.pages = Array.isArray(data) ? data : [];
        } catch (err) {
            if (token !== state.loadToken) return;
            console.error('[Admin] loadPages:', err);
            state.pages = [];
            errorMessage = friendlyError(err);
            showToast('Không tải được dữ liệu: ' + errorMessage, 'error');
        }

        if (token !== state.loadToken) return;
        state.loading = false;
        renderStats();
        renderList(errorMessage);
    }

    function renderStats() {
        const total = state.pages.length;
        const published = state.pages.filter(page => page.is_published !== false).length;
        const photos = state.pages.reduce((sum, page) => sum + parseArray(page.photos).length, 0);
        const drafts = total - published;
        const value = number => (state.loading && !total ? '—' : number);

        const cards = [
            { icon: 'fa-layer-group', label: 'Tổng số trang', value: value(total), tone: 'pink' },
            { icon: 'fa-eye', label: 'Đang hiển thị', value: value(published), tone: 'rose' },
            { icon: 'fa-pen-nib', label: 'Bản nháp', value: value(drafts), tone: 'sand' },
            { icon: 'fa-camera', label: 'Ảnh đã dùng', value: value(photos), tone: 'lilac' }
        ];

        q('stats').innerHTML = cards.map(card => `
            <div class="stat-card stat-${card.tone}">
                <span class="stat-icon"><i class="fas ${card.icon}"></i></span>
                <span class="stat-value">${card.value}</span>
                <span class="stat-label">${card.label}</span>
            </div>`).join('');
    }

    function renderList(errorMessage) {
        const list = q('pageList');

        if (state.loading && !state.pages.length) {
            list.innerHTML = Array.from({ length: 4 }).map(() => `
                <div class="skeleton-card" aria-hidden="true">
                    <div class="skeleton-thumb"></div>
                    <div class="skeleton-body">
                        <div class="skeleton-line short"></div>
                        <div class="skeleton-line"></div>
                        <div class="skeleton-line"></div>
                    </div>
                </div>`).join('');
            return;
        }

        if (errorMessage) {
            list.innerHTML = `
                <div class="empty-state error-state">
                    <div class="empty-icon"><i class="fas fa-triangle-exclamation"></i></div>
                    <h2>Không tải được dữ liệu</h2>
                    <p>${escapeHTML(errorMessage)}</p>
                    <button class="btn btn-ghost" type="button" data-action="retry">
                        <i class="fas fa-rotate"></i> Thử lại
                    </button>
                </div>`;
            return;
        }

        if (!state.pages.length) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-book-heart"></i></div>
                    <h2>Chưa có trang kỷ niệm nào</h2>
                    <p>Thêm trang đầu tiên, hoặc chạy <code>supabase/seed.sql</code> để nhập dữ liệu cũ từ <code>pages.js</code>.</p>
                    <button class="btn btn-primary" type="button" data-action="new">
                        <i class="fas fa-plus"></i> Thêm trang đầu tiên
                    </button>
                </div>`;
            return;
        }

        const term = state.filter.trim().toLowerCase();
        const visible = state.pages.filter(page => {
            if (!term) return true;
            return [
                page.title,
                page.note,
                page.signature,
                page.id,
                page.date
            ].join(' ').toLowerCase().includes(term);
        });

        if (!visible.length) {
            list.innerHTML = `
                <div class="empty-state compact">
                    <div class="empty-icon"><i class="fas fa-magnifying-glass"></i></div>
                    <h2>Không tìm thấy trang nào</h2>
                    <p>Không có kết quả cho “${escapeHTML(state.filter)}”.</p>
                </div>`;
            return;
        }

        list.innerHTML = `
            <p class="list-summary">${visible.length} / ${state.pages.length} trang</p>
            ${visible.map(cardHTML).join('')}`;

        list.querySelectorAll('.page-thumb img').forEach(img => {
            img.addEventListener('error', () => {
                const thumb = img.closest('.page-thumb');
                if (thumb) thumb.classList.add('is-empty');
            });
        });
    }

    function cardHTML(page) {
        const photos = parseArray(page.photos);
        const bubbles = parseArray(page.bubbles);
        const firstPhoto = photos.find(photo => photo && photo.src);
        const published = page.is_published !== false;
        const title = page.title || 'Chưa đặt tiêu đề';
        const snippet = truncate(stripHTML(page.note), 150);
        const layout = Number(page.layout) || 1;

        return `
        <article class="page-card${published ? '' : ' is-draft'}" data-id="${escapeHTML(page.id)}" tabindex="0" aria-label="Sửa trang ${escapeHTML(title)}">
            <div class="page-thumb${firstPhoto ? '' : ' is-empty'}">
                ${firstPhoto ? `<img src="${escapeHTML(firstPhoto.src)}" alt="" loading="lazy">` : '<i class="fas fa-image"></i>'}
                <span class="photo-count"><i class="fas fa-camera"></i> ${photos.length}</span>
            </div>
            <div class="page-card-body">
                <div class="page-card-top">
                    <span class="page-date">${escapeHTML(formatShortDate(page.date))}</span>
                    <span class="badge ${published ? 'badge-live' : 'badge-draft'}">
                        ${published ? 'Đang hiển thị' : 'Bản nháp'}
                    </span>
                </div>
                <h3>${escapeHTML(title)}</h3>
                <p class="page-snippet">${escapeHTML(snippet || 'Chưa có lời nhắn.')}</p>
                <p class="page-meta">Bố cục ${layout} · ${photos.length} ảnh · ${bubbles.length} bong bóng</p>
            </div>
            <div class="page-card-actions">
                <button type="button" class="icon-btn" data-action="publish"
                        title="${published ? 'Ẩn khỏi sách' : 'Đăng trang'}"
                        aria-label="${published ? 'Ẩn khỏi sách' : 'Đăng trang'}">
                    <i class="fas fa-${published ? 'eye' : 'eye-slash'}"></i>
                </button>
                <button type="button" class="icon-btn" data-action="edit" title="Sửa trang" aria-label="Sửa trang">
                    <i class="fas fa-pen"></i>
                </button>
                <button type="button" class="icon-btn danger" data-action="delete" title="Xóa trang" aria-label="Xóa trang">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        </article>`;
    }

    function findPage(id) {
        return state.pages.find(page => page.id === id) || null;
    }

    async function togglePublished(page) {
        if (!page || !state.client) return;
        const next = page.is_published === false;

        try {
            const { error } = await state.client.from(TABLE).update({ is_published: next }).eq('id', page.id);
            if (error) throw error;
            page.is_published = next;
            renderStats();
            renderList();
            showToast(next ? 'Đã đăng trang lên sách.' : 'Đã chuyển trang thành bản nháp.');
        } catch (err) {
            console.error('[Admin] togglePublished:', err);
            showToast('Không đổi được trạng thái: ' + friendlyError(err), 'error');
        }
    }

    async function deletePage(page) {
        if (!page || !state.client) return;
        const label = page.title || formatShortDate(page.date);
        const confirmed = window.confirm(
            `Xóa vĩnh viễn trang "${label}"?\n\n` +
            'Trang sẽ biến mất khỏi danh sách. Ảnh đã tải lên Storage vẫn còn trong bucket.'
        );
        if (!confirmed) return;

        try {
            const { error } = await state.client.from(TABLE).delete().eq('id', page.id);
            if (error) throw error;
            state.pages = state.pages.filter(item => item.id !== page.id);
            if (state.editingId === page.id) closeEditor(true);
            renderStats();
            renderList();
            showToast('Đã xóa trang.');
        } catch (err) {
            console.error('[Admin] deletePage:', err);
            showToast('Xóa thất bại: ' + friendlyError(err), 'error');
        }
    }

    // ---------------------------------------------------------------------
    // Trình soạn trang
    // ---------------------------------------------------------------------
    function openEditor(page) {
        state.lastFocus = document.activeElement;
        state.editingId = page ? page.id : null;

        q('pageForm').reset();
        q('photoList').innerHTML = '';
        q('bubbleList').innerHTML = '';

        if (page) {
            q('editorEyebrow').textContent = 'Chỉnh sửa';
            q('editorTitle').textContent = 'Sửa kỷ niệm';
            q('editorNote').textContent = `Mã trang: ${page.id}`;
            q('pageId').value = page.id;
            q('fieldDate').value = toISODate(page.date);
            q('fieldOrder').value = Number(page.sort_order) || 0;
            q('fieldTitle').value = page.title || '';
            q('fieldLayout').value = String(Number(page.layout) || 1);
            q('fieldPublished').checked = page.is_published !== false;
            q('fieldNote').value = page.note || '';
            q('fieldSignature').value = page.signature || '';

            const decor = parseObject(page.decor) || {};
            q('fieldDecorIcon').value = decor.icon === 'heart' ? 'heart' : (decor.icon === 'flower' ? 'flower' : '');
            q('fieldDecorStyle').value = decor.style || '';

            parseArray(page.photos).forEach(addPhotoRow);
            parseArray(page.bubbles).forEach(addBubbleRow);
        } else {
            const today = todayISO();
            q('editorEyebrow').textContent = 'Trang mới';
            q('editorTitle').textContent = 'Thêm kỷ niệm';
            q('editorNote').textContent = 'Trang mới sẽ được thêm theo ngày đã chọn.';
            q('pageId').value = '';
            q('fieldDate').value = today;
            q('fieldOrder').value = nextSortOrder(today);
            q('fieldLayout').value = '1';
            q('fieldPublished').checked = true;
        }

        if (!q('photoList').children.length) addPhotoRow({});

        q('editorOverlay').hidden = false;
        q('editor').hidden = false;
        document.body.classList.add('editor-open');
        const editorBody = q('editor').querySelector('.editor-body');
        if (editorBody) editorBody.scrollTop = 0;

        setTimeout(() => {
            q('fieldDate').focus();
        }, 80);
    }

    function closeEditor(force) {
        if (state.saving && !force) return;

        q('editor').hidden = true;
        q('editorOverlay').hidden = true;
        document.body.classList.remove('editor-open');
        state.editingId = null;

        if (state.lastFocus && document.contains(state.lastFocus) && typeof state.lastFocus.focus === 'function') {
            state.lastFocus.focus();
        }
        state.lastFocus = null;
    }

    function nextSortOrder(date) {
        const iso = toISODate(date);
        const sameDay = state.pages.filter(page => toISODate(page.date) === iso);
        if (!sameDay.length) return 0;
        return Math.max(...sameDay.map(page => Number(page.sort_order) || 0)) + 10;
    }

    function makeId(date) {
        const base = String(date || '')
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 70) || `page-${randomId(6)}`;

        const used = new Set(state.pages.map(page => page.id));
        let candidate = base;
        let suffix = 2;
        while (used.has(candidate)) {
            candidate = `${base}-${suffix}`;
            suffix += 1;
        }
        return candidate;
    }

    // ---------------------------------------------------------------------
    // Ảnh
    // ---------------------------------------------------------------------
    function addPhotoRow(photo) {
        const data = photo || {};
        const row = document.createElement('div');
        row.className = 'repeat-row photo-row';
        row.innerHTML = `
            <div class="photo-preview" title="Xem trước">
                <img alt="" loading="lazy">
                <span class="photo-placeholder"><i class="fas fa-image"></i></span>
            </div>
            <div class="repeat-fields">
                <label class="field field-compact">
                    <span>Ảnh</span>
                    <input type="text" class="photo-src" placeholder="https://… hoặc image/121101.JPEG">
                </label>
                <div class="grid-2">
                    <label class="field field-compact">
                        <span>Mô tả (alt)</span>
                        <input type="text" class="photo-alt" placeholder="Ảnh chụp lần đầu gặp">
                    </label>
                    <label class="field field-compact">
                        <span>Chú thích</span>
                        <input type="text" class="photo-caption" placeholder="Quán Don Chicken">
                    </label>
                </div>
            </div>
            <div class="repeat-actions">
                <label class="icon-btn upload-label" title="Tải ảnh lên Supabase Storage">
                    <i class="fas fa-upload"></i>
                    <input type="file" class="photo-file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" hidden>
                </label>
                <button type="button" class="icon-btn" data-move="up" title="Di chuyển lên" aria-label="Di chuyển ảnh lên">
                    <i class="fas fa-arrow-up"></i>
                </button>
                <button type="button" class="icon-btn" data-move="down" title="Di chuyển xuống" aria-label="Di chuyển ảnh xuống">
                    <i class="fas fa-arrow-down"></i>
                </button>
                <button type="button" class="icon-btn danger" data-remove title="Xóa ảnh khỏi trang" aria-label="Xóa ảnh khỏi trang">
                    <i class="fas fa-xmark"></i>
                </button>
            </div>`;

        row.querySelector('.photo-src').value = data.src || '';
        row.querySelector('.photo-alt').value = data.alt || '';
        row.querySelector('.photo-caption').value = data.caption || '';

        const image = row.querySelector('.photo-preview img');
        image.addEventListener('load', () => row.querySelector('.photo-preview').classList.add('has-image'));
        image.addEventListener('error', () => row.querySelector('.photo-preview').classList.remove('has-image'));

        q('photoList').appendChild(row);
        syncPhotoPreview(row);
        return row;
    }

    function syncPhotoPreview(row) {
        const src = row.querySelector('.photo-src').value.trim();
        const preview = row.querySelector('.photo-preview');
        const image = row.querySelector('img');

        if (!src) {
            preview.classList.remove('has-image');
            image.removeAttribute('src');
            return;
        }

        if (image.getAttribute('src') !== src) image.src = src;
        preview.classList.add('has-image');
    }

    function moveRow(row, direction) {
        const sibling = direction < 0 ? row.previousElementSibling : row.nextElementSibling;
        if (!sibling) return;
        if (direction < 0) row.parentNode.insertBefore(row, sibling);
        else row.parentNode.insertBefore(sibling, row);
    }

    async function uploadPhoto(row, file, input) {
        if (!state.client) return;
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) {
            showToast('Ảnh vượt quá 10 MB. Hãy chọn ảnh nhỏ hơn.', 'error');
            input.value = '';
            return;
        }

        const label = row.querySelector('.upload-label');
        label.classList.add('is-uploading');
        input.disabled = true;

        try {
            const extension = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
            const path = `${todayISO()}/${Date.now()}-${randomId(6)}.${extension}`;

            const { error } = await state.client.storage.from(BUCKET).upload(path, file, {
                cacheControl: '3600',
                upsert: false,
                contentType: file.type || 'image/jpeg'
            });
            if (error) throw error;

            const { data } = state.client.storage.from(BUCKET).getPublicUrl(path);
            row.querySelector('.photo-src').value = data.publicUrl;
            syncPhotoPreview(row);
            showToast('Đã tải ảnh lên.');
        } catch (err) {
            console.error('[Admin] uploadPhoto:', err);
            showToast('Tải ảnh thất bại: ' + friendlyError(err), 'error');
        } finally {
            label.classList.remove('is-uploading');
            input.disabled = false;
            input.value = '';
        }
    }

    // ---------------------------------------------------------------------
    // Bong bóng chữ
    // ---------------------------------------------------------------------
    function addBubbleRow(bubble) {
        const data = bubble || {};
        const row = document.createElement('div');
        row.className = 'repeat-row bubble-row';
        row.innerHTML = `
            <div class="repeat-fields">
                <div class="grid-2">
                    <label class="field field-compact">
                        <span>Kiểu bong bóng</span>
                        <select class="bubble-variant">
                            <option value="1">Kiểu 1</option>
                            <option value="2">Kiểu 2</option>
                        </select>
                    </label>
                    <label class="field field-compact">
                        <span>Vị trí (CSS)</span>
                        <input type="text" class="bubble-style" placeholder="top: 40%; left: 15%;">
                    </label>
                </div>
                <label class="field field-compact">
                    <span>Nội dung</span>
                    <input type="text" class="bubble-text" placeholder="&quot;Tim anh đập nhanh khi thấy em&quot;">
                </label>
            </div>
            <div class="repeat-actions">
                <button type="button" class="icon-btn danger" data-remove title="Xóa bong bóng" aria-label="Xóa bong bóng">
                    <i class="fas fa-xmark"></i>
                </button>
            </div>`;

        row.querySelector('.bubble-variant').value = String(Number(data.variant) === 2 ? 2 : 1);
        row.querySelector('.bubble-style').value = data.style || '';
        row.querySelector('.bubble-text').value = data.text || '';

        q('bubbleList').appendChild(row);
        return row;
    }

    // ---------------------------------------------------------------------
    // Thu thập dữ liệu form
    // ---------------------------------------------------------------------
    function collectPhotos() {
        return Array.from(q('photoList').querySelectorAll('.photo-row'))
            .map(row => {
                const src = row.querySelector('.photo-src').value.trim();
                const alt = row.querySelector('.photo-alt').value.trim();
                const caption = row.querySelector('.photo-caption').value.trim();
                const photo = { src };
                if (alt) photo.alt = alt;
                if (caption) photo.caption = caption;
                return photo;
            })
            .filter(photo => photo.src);
    }

    function collectBubbles() {
        return Array.from(q('bubbleList').querySelectorAll('.bubble-row'))
            .map(row => ({
                variant: Number(row.querySelector('.bubble-variant').value) === 2 ? 2 : 1,
                style: row.querySelector('.bubble-style').value.trim(),
                text: row.querySelector('.bubble-text').value.trim()
            }))
            .filter(bubble => bubble.text);
    }

    function collectDecor() {
        const icon = q('fieldDecorIcon').value;
        if (icon !== 'flower' && icon !== 'heart') return null;
        const style = q('fieldDecorStyle').value.trim()
            || (icon === 'heart' ? 'top: 15px; right: 15px;' : 'top: 10px; left: 10px;');
        return { icon, style };
    }

    async function handleSave(event) {
        event.preventDefault();
        if (state.saving || !state.client) return;

        const date = q('fieldDate').value;
        if (!date) {
            showToast('Chọn ngày cho trang trước khi lưu.', 'error');
            return;
        }

        const editing = Boolean(state.editingId);
        const id = editing ? state.editingId : makeId(date);
        const payload = {
            id,
            date,
            title: q('fieldTitle').value.trim() || null,
            layout: Number(q('fieldLayout').value) || 1,
            photos: collectPhotos(),
            bubbles: collectBubbles(),
            note: q('fieldNote').value.trim() || null,
            signature: q('fieldSignature').value.trim() || null,
            decor: collectDecor(),
            sort_order: Number(q('fieldOrder').value) || 0,
            is_published: q('fieldPublished').checked
        };

        setSaving(true);
        try {
            const query = editing
                ? state.client.from(TABLE).update(payload).eq('id', state.editingId).select('id').single()
                : state.client.from(TABLE).insert(payload).select('id').single();

            const { error } = await query;
            if (error) throw error;

            showToast(editing ? 'Đã lưu thay đổi.' : 'Đã thêm trang kỷ niệm mới.');
            closeEditor(true);
            await loadPages();
        } catch (err) {
            console.error('[Admin] save:', err);
            showToast('Lưu thất bại: ' + friendlyError(err), 'error');
        } finally {
            setSaving(false);
        }
    }

    function setSaving(saving) {
        state.saving = saving;
        q('saveBtn').disabled = saving;
        q('cancelBtn').disabled = saving;
        q('saveBtn').innerHTML = saving
            ? '<i class="fas fa-spinner fa-spin"></i> Đang lưu…'
            : '<i class="fas fa-floppy-disk"></i> Lưu trang';
    }

    // ---------------------------------------------------------------------
    // Sự kiện
    // ---------------------------------------------------------------------
    function bindEvents() {
        q('loginForm').addEventListener('submit', handleLogin);
        q('logoutBtn').addEventListener('click', handleLogout);
        q('loginEmail').addEventListener('input', hideLoginError);
        q('loginPassword').addEventListener('input', hideLoginError);

        q('newPageBtn').addEventListener('click', () => openEditor(null));
        q('refreshBtn').addEventListener('click', () => loadPages());
        q('searchInput').addEventListener('input', event => {
            state.filter = event.target.value;
            renderList();
        });

        q('pageList').addEventListener('click', handleListClick);
        q('pageList').addEventListener('keydown', handleListKeydown);

        q('addPhotoBtn').addEventListener('click', () => {
            const row = addPhotoRow({});
            const input = row.querySelector('.photo-src');
            if (input) input.focus();
            row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });

        q('addBubbleBtn').addEventListener('click', () => {
            const row = addBubbleRow({});
            const input = row.querySelector('.bubble-text');
            if (input) input.focus();
            row.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        });

        q('photoList').addEventListener('click', handlePhotoClick);
        q('photoList').addEventListener('input', handlePhotoInput);
        q('photoList').addEventListener('change', handlePhotoChange);
        q('bubbleList').addEventListener('click', handleBubbleClick);

        q('pageForm').addEventListener('submit', handleSave);
        q('editorClose').addEventListener('click', () => closeEditor());
        q('cancelBtn').addEventListener('click', () => closeEditor());
        q('editorOverlay').addEventListener('click', () => closeEditor());

        q('fieldDate').addEventListener('change', () => {
            if (!state.editingId) q('fieldOrder').value = nextSortOrder(q('fieldDate').value);
        });

        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && !q('editor').hidden) closeEditor();
        });
    }

    function handleListClick(event) {
        const action = event.target.closest('[data-action]');
        if (action && action.dataset.action === 'retry') {
            loadPages();
            return;
        }
        if (action && action.dataset.action === 'new') {
            openEditor(null);
            return;
        }

        const card = event.target.closest('.page-card');
        if (!card) return;

        const page = findPage(card.dataset.id);
        if (!page) return;

        if (!action) {
            openEditor(page);
            return;
        }

        if (action.dataset.action === 'edit') openEditor(page);
        else if (action.dataset.action === 'delete') deletePage(page);
        else if (action.dataset.action === 'publish') togglePublished(page);
    }

    function handleListKeydown(event) {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        if (event.target.closest('button, a, input, select, textarea')) return;

        const card = event.target.closest('.page-card');
        if (!card) return;

        const page = findPage(card.dataset.id);
        if (!page) return;

        event.preventDefault();
        openEditor(page);
    }

    function handlePhotoClick(event) {
        const row = event.target.closest('.photo-row');
        if (!row) return;

        if (event.target.closest('[data-remove]')) {
            row.remove();
            return;
        }

        const move = event.target.closest('[data-move]');
        if (move) moveRow(row, move.dataset.move === 'up' ? -1 : 1);
    }

    function handlePhotoInput(event) {
        const input = event.target.closest('.photo-src');
        if (!input) return;
        const row = input.closest('.photo-row');
        if (row) syncPhotoPreview(row);
    }

    function handlePhotoChange(event) {
        const input = event.target.closest('.photo-file');
        if (!input || !input.files || !input.files[0]) return;
        const row = input.closest('.photo-row');
        if (row) uploadPhoto(row, input.files[0], input);
    }

    function handleBubbleClick(event) {
        const row = event.target.closest('.bubble-row');
        if (!row) return;
        if (event.target.closest('[data-remove]')) row.remove();
    }
})();
