/* =============================================================================
   Sinh supabase/seed.sql và supabase/setup.sql từ pages.js
   Chạy: node supabase/build-seed.mjs
   Chỉ cần dùng khi bạn sửa nội dung trong pages.js và muốn nhập lại vào Supabase.
   ============================================================================= */

import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const STORY_PAGES = require(resolve(HERE, '..', 'pages.js'));

const MONTHS = {
    jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
    jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12
};

function isoDate(label) {
    const match = String(label || '').trim().match(/^([A-Za-z]{3,})\.?\s+(\d{1,2}),?\s*(\d{4})$/);
    if (!match) throw new Error(`Ngày không hợp lệ: "${label}"`);
    const month = MONTHS[match[1].slice(0, 3).toLowerCase()];
    if (!month) throw new Error(`Tháng không hợp lệ: "${label}"`);
    return `${match[3]}-${String(month).padStart(2, '0')}-${match[2].padStart(2, '0')}`;
}

function sqlText(value) {
    if (value === null || value === undefined || value === '') return 'null';
    return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlJson(value) {
    if (value === null || value === undefined) return 'null';
    return `'${JSON.stringify(value).replace(/'/g, "''")}'::jsonb`;
}

if (!Array.isArray(STORY_PAGES) || !STORY_PAGES.length) {
    throw new Error('pages.js không xuất ra mảng STORY_PAGES hợp lệ.');
}

const seen = new Set();
STORY_PAGES.forEach((page, index) => {
    if (!page.id) throw new Error(`Trang #${index} thiếu id`);
    if (!/^[a-z0-9][a-z0-9-]*$/.test(page.id)) {
        throw new Error(`id "${page.id}" phải là chữ thường, số và dấu gạch ngang`);
    }
    if (seen.has(page.id)) throw new Error(`id bị trùng: "${page.id}"`);
    seen.add(page.id);
    isoDate(page.date);
    if (page.layout != null && (page.layout < 1 || page.layout > 7)) {
        throw new Error(`layout của "${page.id}" phải trong khoảng 1..7`);
    }
});

const rows = STORY_PAGES.map((page, index) => {
    const date = isoDate(page.date);
    const layout = Number(page.layout) || (index % 7) + 1;
    const sortOrder = (index + 1) * 10;

    return `(
    ${sqlText(page.id)},
    ${sqlText(date)},
    ${sqlText(page.title)},
    ${layout},
    ${sqlJson(page.photos || [])},
    ${sqlJson(page.bubbles || [])},
    ${sqlText(page.note)},
    ${sqlText(page.signature)},
    ${sqlJson(page.decor)},
    ${sortOrder},
    true
)`;
});

const seed = `-- =============================================================================
--  OUR LOVE STORY — DỮ LIỆU KỶ NIỆM BAN ĐẦU
--  Sinh tự động từ pages.js bằng: node supabase/build-seed.mjs
--  Chạy SAU schema.sql. Có thể chạy lại nhiều lần: bản ghi đã tồn tại sẽ
--  được giữ nguyên (on conflict do nothing), không ghi đè nội dung bạn đã sửa
--  trên web admin.
-- =============================================================================

begin;

insert into public.story_pages
    (id, date, title, layout, photos, bubbles, note, signature, decor, sort_order, is_published)
values
${rows.join(',\n')}
on conflict (id) do nothing;

commit;
`;

const schema = readFileSync(resolve(HERE, 'schema.sql'), 'utf8');

const setup = `-- =============================================================================
--  OUR LOVE STORY — CÀI ĐẶT MỘT LẦN (SCHEMA + DỮ LIỆU MẪU)
--  File sinh tự động từ schema.sql + seed.sql, đừng sửa tay.
--  Dán toàn bộ file này vào Supabase Dashboard → SQL Editor → Run.
-- =============================================================================

${schema}

-- =============================================================================
--  PHẦN DỮ LIỆU
-- =============================================================================

begin;

insert into public.story_pages
    (id, date, title, layout, photos, bubbles, note, signature, decor, sort_order, is_published)
values
${rows.join(',\n')}
on conflict (id) do nothing;

commit;
`;

writeFileSync(resolve(HERE, 'seed.sql'), seed, 'utf8');
writeFileSync(resolve(HERE, 'setup.sql'), setup, 'utf8');

console.log(`Đã sinh seed.sql và setup.sql cho ${STORY_PAGES.length} trang.`);
