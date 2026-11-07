-- =============================================================================
--  OUR LOVE STORY — SCHEMA SUPABASE
--  Chạy file này trong Supabase Dashboard → SQL Editor.
--  File này chỉ tạo cấu trúc; dữ liệu kỷ niệm hiện có nằm ở supabase/seed.sql.
--  Bản gộp sẵn để dán một lần: supabase/setup.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
--  Bảng chính: mỗi dòng là một trang kỷ niệm trong cuốn sách
-- -----------------------------------------------------------------------------
create table if not exists public.story_pages (
    id            text        primary key,
    date          date        not null,
    title         text,
    layout        integer     not null default 1,
    photos        jsonb       not null default '[]'::jsonb,
    bubbles       jsonb       not null default '[]'::jsonb,
    note          text,
    signature     text,
    decor         jsonb,
    sort_order    integer     not null default 0,
    is_published  boolean     not null default true,
    created_at    timestamptz not null default now(),
    updated_at    timestamptz not null default now(),

    constraint story_pages_id_format
        check (id ~ '^[a-z0-9][a-z0-9-]*$' and char_length(id) between 1 and 80),
    constraint story_pages_layout_range
        check (layout between 1 and 7),
    constraint story_pages_photos_is_array
        check (jsonb_typeof(photos) = 'array'),
    constraint story_pages_bubbles_is_array
        check (jsonb_typeof(bubbles) = 'array'),
    constraint story_pages_decor_is_object
        check (decor is null or jsonb_typeof(decor) = 'object')
);

comment on table  public.story_pages is 'Các trang kỷ niệm của cuốn sách flipbook';
comment on column public.story_pages.id is 'Khóa duy nhất, dạng slug: 2025-11-12, 2025-11-12-2...';
comment on column public.story_pages.date is 'Ngày xảy ra kỷ niệm (dùng cho nhãn ngày + sắp xếp)';
comment on column public.story_pages.layout is 'Kiểu bố cục ảnh 1..7, tương ứng .layout-N trong styles.css';
comment on column public.story_pages.photos is 'Mảng [{src, alt, caption}] — src có thể là URL Supabase Storage hoặc đường dẫn nội bộ image/...';
comment on column public.story_pages.bubbles is 'Mảng [{variant: 1|2, style: "top: 40%; left: 15%;", text}]';
comment on column public.story_pages.note is 'Đoạn tâm sự, cho phép HTML: <br>, <span class="highlight">...</span>';
comment on column public.story_pages.decor is 'Hoa văn trang trí: {icon: "flower"|"heart", style: "top: 10px; left: 10px;"}';
comment on column public.story_pages.sort_order is 'Thứ tự trong cùng một ngày (số nhỏ đứng trước)';
comment on column public.story_pages.is_published is 'false = bản nháp, khách xem sách không thấy';

-- Truy vấn chính của trang sách: lọc published, sắp theo ngày rồi thứ tự
create index if not exists story_pages_order_idx
    on public.story_pages (date, sort_order, id);

create index if not exists story_pages_published_idx
    on public.story_pages (date, sort_order, id)
    where is_published = true;

-- -----------------------------------------------------------------------------
--  Tự cập nhật updated_at mỗi lần sửa
-- -----------------------------------------------------------------------------
create or replace function public.story_pages_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
    new.updated_at := current_timestamp;
    return new;
end;
$$;

drop trigger if exists story_pages_touch_updated_at on public.story_pages;
create trigger story_pages_touch_updated_at
    before update on public.story_pages
    for each row
    execute function public.story_pages_touch_updated_at();

-- -----------------------------------------------------------------------------
--  Phân quyền
--  - Khách (anon): chỉ đọc trang đã publish
--  - Đã đăng nhập (authenticated): đọc tất cả + thêm/sửa/xóa
--  Lưu ý: phải TẮT đăng ký công khai trong Supabase Auth, nếu không ai cũng
--  tạo được tài khoản và có quyền ghi. Xem HUONG-DAN-SUPABASE.md.
-- -----------------------------------------------------------------------------
alter table public.story_pages enable row level security;

grant select on public.story_pages to anon, authenticated;
grant insert, update, delete on public.story_pages to authenticated;

drop policy if exists story_pages_public_read on public.story_pages;
create policy story_pages_public_read
    on public.story_pages
    for select
    to anon
    using (is_published = true);

drop policy if exists story_pages_auth_read on public.story_pages;
create policy story_pages_auth_read
    on public.story_pages
    for select
    to authenticated
    using (true);

drop policy if exists story_pages_auth_insert on public.story_pages;
create policy story_pages_auth_insert
    on public.story_pages
    for insert
    to authenticated
    with check (true);

drop policy if exists story_pages_auth_update on public.story_pages;
create policy story_pages_auth_update
    on public.story_pages
    for update
    to authenticated
    using (true)
    with check (true);

drop policy if exists story_pages_auth_delete on public.story_pages;
create policy story_pages_auth_delete
    on public.story_pages
    for delete
    to authenticated
    using (true);

-- -----------------------------------------------------------------------------
--  Storage: nơi chứa ảnh tải lên từ trang admin
--  Bucket public để <img> đọc trực tiếp; chỉ tài khoản đã đăng nhập mới ghi.
-- -----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'story-images',
    'story-images',
    true,
    10485760, -- 10 MB
    array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update
    set public             = excluded.public,
        file_size_limit    = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists story_images_public_read on storage.objects;
create policy story_images_public_read
    on storage.objects
    for select
    to anon, authenticated
    using (bucket_id = 'story-images');

drop policy if exists story_images_auth_insert on storage.objects;
create policy story_images_auth_insert
    on storage.objects
    for insert
    to authenticated
    with check (bucket_id = 'story-images');

drop policy if exists story_images_auth_update on storage.objects;
create policy story_images_auth_update
    on storage.objects
    for update
    to authenticated
    using (bucket_id = 'story-images')
    with check (bucket_id = 'story-images');

drop policy if exists story_images_auth_delete on storage.objects;
create policy story_images_auth_delete
    on storage.objects
    for delete
    to authenticated
    using (bucket_id = 'story-images');

-- =============================================================================
--  (Tùy chọn) Chỉ cho MỘT email quản trị được ghi dữ liệu.
--  Nếu muốn dùng, thay email bên dưới rồi chạy phần này SAU khi đã tạo user.
--  Khi đó có thể bật lại signup mà vẫn an toàn.
-- =============================================================================
-- drop policy if exists story_pages_auth_insert on public.story_pages;
-- create policy story_pages_auth_insert on public.story_pages
--     for insert to authenticated
--     with check ((auth.jwt() ->> 'email') = 'ban@example.com');
--
-- drop policy if exists story_pages_auth_update on public.story_pages;
-- create policy story_pages_auth_update on public.story_pages
--     for update to authenticated
--     using ((auth.jwt() ->> 'email') = 'ban@example.com')
--     with check ((auth.jwt() ->> 'email') = 'ban@example.com');
--
-- drop policy if exists story_pages_auth_delete on public.story_pages;
-- create policy story_pages_auth_delete on public.story_pages
--     for delete to authenticated
--     using ((auth.jwt() ->> 'email') = 'ban@example.com');

-- Báo PostgREST làm mới schema cache ngay sau khi tạo bảng.
-- (Supabase thường tự làm, dòng này chỉ để chắc chắn.)
notify pgrst, 'reload schema';
