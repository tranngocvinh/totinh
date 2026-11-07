/* =============================================================================
   LỚP DỮ LIỆU SUPABASE CHO TRANG SÁCH
   -----------------------------------------------------------------------------
   - Nếu supabase-config.js chưa điền URL/key (hoặc mạng lỗi), tự quay về dùng
     mảng STORY_PAGES trong pages.js, nhờ vậy trang vẫn mở bình thường.
   - Nếu đã cấu hình, dữ liệu lấy từ bảng story_pages (chỉ các trang published).
   - Trang admin dùng lại getClient() ở đây để không tạo nhiều kết nối.
   ============================================================================= */

(function (global) {
    'use strict';

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const REQUEST_TIMEOUT = 8000;

    let client = null;
    let warnedMissingLibrary = false;

    function config() {
        return global.SUPABASE_CONFIG || {};
    }

    function tableName() {
        return config().table || 'story_pages';
    }

    function isConfigured() {
        const cfg = config();
        const url = String(cfg.url || '').trim();
        const key = String(cfg.anonKey || '').trim();
        return /^https?:\/\//i.test(url) && key.length > 20;
    }

    function getClient() {
        if (client) return client;
        if (!isConfigured()) return null;

        if (!global.supabase || typeof global.supabase.createClient !== 'function') {
            if (!warnedMissingLibrary) {
                warnedMissingLibrary = true;
                console.warn('[Supabase] Chưa tải được thư viện supabase-js. Kiểm tra kết nối mạng hoặc thẻ <script> trong index.html.');
            }
            return null;
        }

        const cfg = config();
        try {
            client = global.supabase.createClient(
                String(cfg.url).trim().replace(/\/+$/, ''),
                String(cfg.anonKey).trim(),
                {
                    auth: {
                        persistSession: true,
                        autoRefreshToken: true,
                        detectSessionInUrl: false
                    }
                }
            );
        } catch (err) {
            console.error('[Supabase] Không tạo được client. Kiểm tra Project URL và anon key:', err);
            client = null;
        }
        return client;
    }

    // Chặn trường hợp mạng treo làm màn hình loading quay mãi
    function withTimeout(promise, ms) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error(`Supabase không phản hồi sau ${Math.round(ms / 1000)} giây`));
            }, ms);

            Promise.resolve(promise).then(
                value => { clearTimeout(timer); resolve(value); },
                error => { clearTimeout(timer); reject(error); }
            );
        });
    }

    function toISODate(value) {
        if (!value) return '';
        const match = String(value).trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
        return match ? match[0] : '';
    }

    function formatDateLabel(value) {
        const iso = toISODate(value);
        if (!iso) return String(value || '');
        const [year, month, day] = iso.split('-').map(Number);
        if (!MONTHS[month - 1]) return iso;
        return `${MONTHS[month - 1]} ${day}, ${year}`;
    }

    function parseArray(value) {
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

    // Chuyển một dòng trong bảng thành object mà script.js đang dùng
    function rowToPage(row) {
        const photos = parseArray(row.photos)
            .filter(photo => photo && typeof photo === 'object' && photo.src)
            .map(photo => ({
                src: String(photo.src),
                alt: photo.alt ? String(photo.alt) : '',
                caption: photo.caption ? String(photo.caption) : ''
            }));

        return {
            id: row.id,
            date: formatDateLabel(row.date),
            title: row.title || '',
            layout: Number(row.layout) || 1,
            photos,
            bubbles: parseArray(row.bubbles).filter(bubble => bubble && bubble.text),
            note: row.note || '',
            signature: row.signature || '',
            decor: parseObject(row.decor) || null
        };
    }

    function localPages() {
        return Array.isArray(global.STORY_PAGES) ? global.STORY_PAGES : [];
    }

    async function fetchStoryPages() {
        const fallback = localPages();
        const supabase = getClient();

        if (!supabase) {
            return { pages: fallback, source: 'local', error: null };
        }

        try {
            const query = supabase
                .from(tableName())
                .select('id,date,title,layout,photos,bubbles,note,signature,decor,sort_order,is_published')
                .eq('is_published', true)
                .order('date', { ascending: true })
                .order('sort_order', { ascending: true })
                .order('id', { ascending: true });

            const { data, error } = await withTimeout(query, REQUEST_TIMEOUT);
            if (error) throw error;

            if (!data || !data.length) {
                console.warn(`[Supabase] Bảng "${tableName()}" chưa có trang nào đã publish — tạm dùng pages.js. Hãy chạy supabase/seed.sql hoặc thêm trang trong admin.html.`);
                return { pages: fallback, source: 'local-empty', error: null };
            }

            console.info(`[Supabase] Đã tải ${data.length} trang kỷ niệm.`);
            return { pages: data.map(rowToPage), source: 'supabase', error: null };
        } catch (err) {
            console.warn('[Supabase] Không tải được dữ liệu, dùng pages.js dự phòng:', err && err.message ? err.message : err);
            return { pages: fallback, source: 'local-error', error: err };
        }
    }

    global.StoryAPI = {
        isConfigured,
        getClient,
        fetchStoryPages,
        rowToPage,
        parseArray,
        parseObject,
        toISODate,
        formatDateLabel,
        tableName
    };
})(window);
