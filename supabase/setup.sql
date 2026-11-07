-- =============================================================================
--  OUR LOVE STORY — CÀI ĐẶT MỘT LẦN (SCHEMA + DỮ LIỆU MẪU)
--  File sinh tự động từ schema.sql + seed.sql, đừng sửa tay.
--  Dán toàn bộ file này vào Supabase Dashboard → SQL Editor → Run.
-- =============================================================================

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


-- =============================================================================
--  PHẦN DỮ LIỆU
-- =============================================================================

begin;

insert into public.story_pages
    (id, date, title, layout, photos, bubbles, note, signature, decor, sort_order, is_published)
values
(
    '2025-11-12',
    '2025-11-12',
    'The first times',
    3,
    '[{"src":"image/121101.JPEG","alt":"First date","caption":"Quán Don Chicken"},{"src":"image/121102.JPEG","alt":"Coffee cup","caption":"Quán Don Chicken"}]'::jsonb,
    '[{"variant":1,"style":"top: 40%; left: 15%;","text":"\"Tim anh đập nhanh khi thấy em\""},{"variant":2,"style":"bottom: 30%; right: 15%;","text":"\"Em cười làm tan biến mọi lo âu\""}]'::jsonb,
    'Ngày 12/11/2025, mình chính thức gặp nhau lần đầu tiên sau những tin nhắn dài. Anh vẫn nhớ em mặc chiếc áo trắng bên trong, bên ngoài khoác cái áo màu xanh, <span class="highlight">sự nhí nhảnh của em làm anh càng mê em nhiều hơn.</span> Chúng ta nói chuyện 2 tiếng không ngừng, như thể đã quen nhau từ kiếp trước.',
    'Kỷ niệm đầu tiên ❤️',
    '{"icon":"flower","style":"top: 10px; left: 10px;"}'::jsonb,
    10,
    true
),
(
    '2025-11-14',
    '2025-11-14',
    'The first times',
    1,
    '[{"src":"image/141101.JPEG","alt":"Phone call","caption":"Đi ăn ốc"},{"src":"image/141102.JPEG","alt":"Night sky","caption":"Lúc em đã về"},{"src":"image/141103.JPEG","alt":"Heart","caption":"Về rồi cũng chụp ảnh xinh cho anh"}]'::jsonb,
    '[]'::jsonb,
    'Tối 14/11, hôm đó mình đi ăn ốc, đi cũng khá xa. Hôm đó anh muốn năm tay em lắm nhưng mà mới quen nên còn ngại lắm, đến tận giờ anh mới được chạm vào em nà. <span class="highlight">Hôm đó nhìn em cọc lắm :))) ko bít giận anh gì hong</span>, hôm đó cũng là lần đầu tiên anh chở em đi chơi, lần đầu tiên em chỉ map cho anh, anh vẫn không quên khoảnh khắc ấy, những thứ lần đầu từ em luôn làm anh vui lắm cưng nà.',
    'Ăn ốc ở Bếp Mẹ Đăng ❤️',
    '{"icon":"heart","style":"top: 15px; right: 15px;"}'::jsonb,
    20,
    true
),
(
    '2025-11-18',
    '2025-11-18',
    'The first times',
    6,
    '[{"src":"image/181101.JPEG","alt":"Restaurant","caption":"Quà của em"},{"src":"image/181102.JPEG","alt":"Dinner","caption":"Phê La"},{"src":"image/181103.JPEG","alt":"Candle","caption":"Nét Huế"}]'::jsonb,
    '[{"variant":1,"style":"top: 50%; left: 20%;","text":"\"Nhìn em vô tri lúc đi ăn đi uống trông thật đáng yêu làm sao\""}]'::jsonb,
    'Ngày 18/11, mình đi xem phim ở CGV Nguyễn Chí Thanh, Đi ăn ở Nét Huế, đi uống Phê La, <span class="highlight">Hôm đó là lần đầu tiên anh được Bobo em.Nắm tay nữa thì phải</span> Em còn có quà tặng anh nữa, đó là 1 chiếc áo rất vừa vặn với anh, sao em chọn đồ khéo vậy, anh cảm ơn em nhiều nhaaaa',
    'Buổi xem phim lần đầu ❤️',
    '{"icon":"flower","style":"bottom: 10px; left: 10px;"}'::jsonb,
    30,
    true
),
(
    '2025-11-22',
    '2025-11-22',
    'The first times',
    2,
    '[{"src":"image/221101.JPEG","alt":"Holding hands","caption":"Khoác tay nhau thích nhờ"},{"src":"image/221102.JPEG","alt":"Park walk","caption":"Ăn ở Aeon"},{"src":"image/221103.JPEG","alt":"Smile","caption":"Đi chơi ở Ocean Park 2"}]'::jsonb,
    '[]'::jsonb,
    '22/11, em lên chỗ anh chơi lần đầu tiên. Anh dẫn em đi Ocean Park 2, rồi vào Vincom xem triển lãm. Sau đó mình cùng nhau ăn sushi, thưởng thức bánh ngọt ở Aeon, <span class="highlight">rồi lại nắm tay nhau dạo bước ở vườn thiên nga Ecopark.</span> Một ngày đi chơi thật nhiều, thật vui, và cũng là lần đầu tiên em đến nơi anh sống.',
    'Một ngày đầu, nhiều kỷ niệm ❤️',
    '{"icon":"heart","style":"top: 20px; right: 20px;"}'::jsonb,
    40,
    true
),
(
    '2025-11-25',
    '2025-11-25',
    'The first times',
    5,
    '[{"src":"image/2511.JPEG","alt":"Popcorn","caption":"Ăn ở Hadilao"}]'::jsonb,
    '[]'::jsonb,
    'Hôm đó mình ăn lẩu Hadilao, em cũng bận vì cả bữa ăn anh thấy em toàn nhìn vào điện thoại hoyyy, ăn sang mà chẳng chụp gì cả, dỗi tkeee =)) <span class="highlight">Nhưng mà nhìn em trong khuôn mặt tập trung cũng thật thú vị ^^.</span>1 lần đi chơi hiếm hoy mình ít nói =)).',
    'Anh iu em ❤️',
    '{"icon":"flower","style":"bottom: 15px; right: 15px;"}'::jsonb,
    50,
    true
),
(
    '2025-11-30',
    '2025-11-30',
    'The first times',
    4,
    '[{"src":"image/3011.JPEG","alt":"Nervous","caption":"Hôm em đi chợ Mơ"}]'::jsonb,
    '[{"variant":2,"style":"top: 40%; right: 10%;","text":"\"Hôm đấy cũng chơi vài chỗ mà ko chụp ảnh gì cả\""}]'::jsonb,
    'Hôm đó anh đưa mẹ anh lên Hà Nội để làm mi, em cũng lên chợ Mơ để tham gia cái gì của Kocca ý, thấy cũng gần nên anh hẹn gặp em, mình ăn ở Jolibee, sau đó uống nước ở 1 quán ven đường <span class="highlight">Em có nhờ là hôm đó em đòi ko bobo, giữ khoảng cách không".</span> Nhưng sự nổi dậy của anh nên cuối cùng mình lại nắm tay, bobo trở lại :))',
    'Anh yêu em nhiều lắm ❤️',
    '{"icon":"heart","style":"top: 10px; left: 10px;"}'::jsonb,
    60,
    true
),
(
    '2025-12-08',
    '2025-12-08',
    'The first times',
    7,
    '[{"src":"image/81201.JPEG","alt":"Road trip"},{"src":"image/81202.JPEG","alt":"Mountains"},{"src":"image/81203.JPEG","alt":"Together","caption":"Ăn ở Pizza 4p"}]'::jsonb,
    '[]'::jsonb,
    'Bình thường phải có sự kiện gì anh mới ăn ở đây, hôm đó có sự kiện gì em nhỉ, hình như chẳng có sự kiện gì cả <span class="highlight">Vì từ khi yêu em, mỗi lần gặp nhau đều là sự kiện đẹp rồi,</span> Chẳng cần phải có dịp gì đặc biệt mới dẫn em ăn ngon vì lúc nào với anh cũng là ngày đặc biệt naee',
    'Em là ngoại lệ của anh ❤️',
    '{"icon":"flower","style":"bottom: 10px; right: 10px;"}'::jsonb,
    70,
    true
),
(
    '2025-12-10',
    '2025-12-10',
    'The first times',
    2,
    '[{"src":"image/1012.JPEG","alt":"Surprise","caption":"Ăn bún chả"}]'::jsonb,
    '[]'::jsonb,
    'Hôm đó anh rủ em lên ăn bún chả ở chỗ anh, sau đó mình vào một quán coffee để uống nước, buổi tối mình vào Skylake ăn cháo vì anh nhớ hôm đó em đến tháng <span class="highlight">Anh luôn lo lắng cho em mỗi khi có vấn đề về sức khỏe.</span> Nhớ giữ gìn sức khỏe thật tốt nhé, không phải lúc nào anh cũng bên cạnh em cho tới lúc mình cưới nhau naee',
    'Lúc nào cũng quan tâm em❤️',
    '{"icon":"heart","style":"top: 15px; right: 15px;"}'::jsonb,
    80,
    true
),
(
    '2025-12-19',
    '2025-12-19',
    'The first times',
    3,
    '[{"src":"image/1912.JPEG","alt":"Family dinner","caption":"Dáng vẻ của em khi làm cây thông cho anh"},{"src":"image/191202.JPEG","alt":"Nervous"},{"src":"image/191203.JPEG","alt":"Accepted","caption":"Quà bánh do em tự làm"}]'::jsonb,
    '[{"variant":1,"style":"bottom: 25%; left: 15%;","text":"\"1 hôm mà anh nhận được nhiều quà của em ghiaa\""}]'::jsonb,
    'Ngày hôm ấy em rủ anh đi làm cây thông Noel, sau đó lúc anh đi làm về, mình đi xem phim avatar, cuối buổi em có tặng anh 1 món quà mà anh rất rất thích, đó là những chiếc bánh cute do em tự tay làm, thích đến nỗi cả nhà anh đều ăn hết luôn <span class="highlight">Chưa từng có ai làm bánh thủ công tặng anh cả.</span> Thật hạnh phúc khi được em làm điều ấy cho anh .',
    'Anh luôn trân trọng những món quà em gửi ❤️',
    '{"icon":"flower","style":"top: 10px; left: 10px;"}'::jsonb,
    90,
    true
),
(
    '2025-12-21',
    '2025-12-21',
    'The first times',
    2,
    '[{"src":"image/211201.JPEG","alt":"Christmas tree","caption":"Highland coffee"},{"src":"image/211202.JPEG","alt":"Gifts","caption":"Ảnh chúng taaa"},{"src":"image/211203.JPEG","alt":"Together","caption":"Ăn ramen"}]'::jsonb,
    '[]'::jsonb,
    'Vì nhớ em quá nên ngày hôm sau anh đi bus ra chỗ em luôn, mình hẹn nhau ở highland, sau đó đi ăn Ramen ở gần chỗ em ở <span class="highlight">Cũng là lần đầu tiên anh đi bus từ nhà ra chỗ em</span> và anh biết mình đang có món quà tuyệt vời nhất: chính là em.',
    'Cảm thấy ấm áp ❤️',
    '{"icon":"heart","style":"top: 20px; right: 20px;"}'::jsonb,
    100,
    true
),
(
    '2025-12-25',
    '2025-12-25',
    'The first times',
    6,
    '[{"src":"image/251201.JPEG","alt":"Party","caption":"Ăn ở phố cổ"},{"src":"image/251202.JPEG","alt":"Friends","caption":"Tiệm handmade"},{"src":"image/251203.JPEG","alt":"Celebration","caption":"Nhà thờ"}]'::jsonb,
    '[{"variant":2,"style":"top: 60%; right: 20%;","text":"Giáng sinh đầu tiên bên em"}]'::jsonb,
    'Hôm đó là Giáng Sinh, ăn xin nghỉ làm buổi chiều để đi chơi Noel cùng em, mình đi ăn bún ở Phố Cổ, sau đó đi xem cửa hàng handmade, đi Starbuck, đi nhà thờ và chúa đã nhìn thấy tình yêu của chúng ta đóaaa <span class="highlight">lòng anh tràn ngập niềm hạnh phúc và tự hào.</span> Anh biết mình đã chọn đúng người.',
    'Chia sẻ hạnh phúc ❤️',
    '{"icon":"flower","style":"bottom: 10px; left: 10px;"}'::jsonb,
    110,
    true
),
(
    '2025-12-26',
    '2025-12-26',
    'The first times',
    5,
    '[{"src":"image/2612.JPEG","alt":"Beach night"},{"src":"image/261202.JPEG","alt":"Stars","caption":"Nhớ em quá nên lại đòi gặp em"}]'::jsonb,
    '[]'::jsonb,
    'Hôm đó mình đi ăn Mỳ cay ở gần chỗ em ở, hôm đó chắc cũng thân hơn rồi nên là yên bình em nhỉ <span class="highlight">Em ăn cay không bằng anh .</span> Anh ăn cấp độ 4, em ăn có cấp độ 1 bọ =)).',
    'Bát mỳ cay ngon nhất là khi ăn với em ❤️',
    '{"icon":"heart","style":"top: 15px; right: 15px;"}'::jsonb,
    120,
    true
),
(
    '2025-12-27',
    '2025-12-27',
    'The first times',
    4,
    '[{"src":"image/2712.JPEG","alt":"Cooking","caption":"Ăn ở Aeon"}]'::jsonb,
    '[{"variant":1,"style":"top: 40%; left: 10%;","text":"\"Hôm đó k chụp nhiều ảnh lắm, em còn nhớ hôm đó diễn ra những gì ko :)))\""}]'::jsonb,
    'Hôm đó em đi xe bus sang chỗ anh, đó là lần đầu tiên em vào nhà anh trên Gia Lâm, em có biết hôm đó mình bobo nhau mạnh đến nỗi tím môi ko:))), sau đó em dỗi anh, anh dẫn em đi mua túi, mua áo. <span class="highlight">và đó cũng là lần đầu tiên mình hôn nhau sâu đến vậy</span> kể từ lần đó, anh nghiện em không lối thoát',
    'Ước gì hôm nào cũng được như hôm đó ❤️',
    '{"icon":"flower","style":"bottom: 10px; right: 10px;"}'::jsonb,
    130,
    true
),
(
    '2025-12-29',
    '2025-12-29',
    'The first times',
    7,
    '[{"src":"image/291201.JPEG","alt":"Dreams","caption":"Quán mỳ tay to"},{"src":"image/291202.JPEG","alt":"Future","caption":"1 quán nước xinh"}]'::jsonb,
    '[]'::jsonb,
    'Hôm đó mình ăn nhiều thật ý, anh ăn no tới nỗi phải đi vệ sinh cho bớt no:))), em cũng ăn tốt nhưng mà cuối cùng thức ăn vẫn thừa <span class="highlight">Mình hợp nhau chuyện ăn uống em nhỉ.</span> Chưa thấy mình ko ăn được ít bao giờ cả',
    'Ăn em là ngon nhất:)))❤️',
    '{"icon":"heart","style":"top: 10px; left: 10px;"}'::jsonb,
    140,
    true
),
(
    '2026-01-05',
    '2026-01-05',
    'The first times',
    3,
    '[{"src":"image/5101.JPEG","alt":"New Year"},{"src":"image/5102.JPEG","alt":"Countdown","caption":"Mỳ bay"},{"src":"image/5103.JPEG","alt":"Kiss","caption":"Quán nước gần ktx em"}]'::jsonb,
    '[]'::jsonb,
    'Hôm đó mình đi ăn mỳ bay ở một quán em xem được trên instagram, đồ ăn ngon em nhỉ <span class="highlight">Hôm đó anh bị ốm, nhưng vẫn có thể đi chơi được vì nhìn em là anh thấy khỏe hơn ý</span> .',
    'Ốm nhưng được gặp em vẫn chọn đi chơi nàaa ❤️',
    '{"icon":"flower","style":"top: 15px; right: 15px;"}'::jsonb,
    150,
    true
),
(
    '2026-01-06',
    '2026-01-06',
    'The first times',
    3,
    '[{"src":"image/6101.JPEG","alt":"Morning","caption":"Ăn mỳ cay"},{"src":"image/6102.JPEG","alt":"Coffee","caption":":))))"},{"src":"image/6103.JPEG","alt":"Goodnight","caption":"The gardenia"}]'::jsonb,
    '[{"variant":2,"style":"bottom: 30%; right: 15%;","text":"\"Ăn nhiều nhờ, trưa ăn mỳ cay, tối ăn đồ Hàn =))\""}]'::jsonb,
    'Buổi trưa hôm đó anh nhớ em quá nên giờ nghỉ anh phóng xe ra chỗ em lun, buổi tối cũng tìm 1 quán Hàn gần chỗ em để ăn nà, đồ ăn rất ngonnn <span class="highlight">Yêu em quá :))) anh không biết gõ thêm câu gì nữa ngoài việc chỉ nghĩ về em.</span> em làm cuộc sống anh trọn vẹn hơn bao giờ hết.',
    'I love you ❤️',
    '{"icon":"heart","style":"top: 10px; left: 10px;"}'::jsonb,
    160,
    true
),
(
    '2026-01-07',
    '2026-01-07',
    'The first times',
    2,
    '[{"src":"image/7101.JPEG","alt":"Challenge","caption":"Ăn bún bòaaa"}]'::jsonb,
    '[]'::jsonb,
    'Lại là 1 hôm nhớ em nên buổi trưa tranh thủ ra gặp em <span class="highlight">Có vẻ anh ngày càng thích giờ nghỉ ra chỗ em vào buổi trưa hơn ròi ý.</span>',
    'Sức mạnh tình yêu ❤️',
    '{"icon":"flower","style":"bottom: 10px; left: 10px;"}'::jsonb,
    170,
    true
),
(
    '2026-01-08',
    '2026-01-08',
    '3-month anniversary',
    6,
    '[{"src":"image/8101.JPEG","alt":"2 months","caption":"Khrua Ban Thai"},{"src":"image/8102.JPEG","alt":"Celebration","caption":"Ny anhhh"},{"src":"image/8103.JPEG","alt":"Love","caption":"Vẫn là ny anh"}]'::jsonb,
    '[{"variant":1,"style":"top: 50%; left: 20%;","text":"\"Mỗi ngày đều yêu em hơn\""}]'::jsonb,
    'Kỷ niệm 3 tháng quen nhau, chúng ta chỉ đơn giản là đi ăn, lần này là đi ăn đồ Thái, chúng ta đã ăn đồ Nhật, Hàn, Việt, Thái, Ý rùi em nhỉ <span class="highlight">Anh ngạc nhiên khi nhận ra chỉ 3 tháng mà em đã trở thành một phần không thể thiếu.</span> Anh hứa sẽ làm em cười mỗi ngày.',
    '60 ngày hạnh phúc ❤️',
    '{"icon":"heart","style":"top: 20px; right: 20px;"}'::jsonb,
    180,
    true
),
(
    '2026-01-16',
    '2026-01-16',
    null,
    5,
    '[{"src":"image/160101.JPEG","alt":"Sick","caption":"Công viên cầu giấy"},{"src":"image/160102.JPEG","alt":"Medicine","caption":"vợ chồng :))"},{"src":"image/160103.JPEG","alt":"Care","caption":"The Tokyo Deli"}]'::jsonb,
    '[]'::jsonb,
    'Hôm đó mình dẫn nhau ra công viên Cầu Giấy, mình đi bộ 1 vòng, nghịch mấy cái máy ở đó, sau đó anh còn bảo là sau anh đưa em đi lên ocp2 có công viên đẹp hơn, sau đó mình đi ăn đồ Nhật ở Tokyo Deli <span class="highlight">Hôm đó thấy em ghen vì anh cho nhân viên sđt :))</span> Biết ghen chứng tỏ yêu anh nhiều lắm đúng honggg.',
    'Sarangheyoo ❤️',
    '{"icon":"flower","style":"bottom: 15px; right: 15px;"}'::jsonb,
    190,
    true
),
(
    '2026-01-17',
    '2026-01-17',
    'The first time',
    4,
    '[{"src":"image/170101.JPEG","alt":"Sunset","caption":"Em chọn món"},{"src":"image/170102.JPEG","alt":"Silhouette","caption":"Đồ ăn lên nèee"},{"src":"image/170103.JPEG","alt":"Peace","caption":"Healthy nhờ"}]'::jsonb,
    '[{"variant":2,"style":"top: 40%; right: 10%;","text":"Hôm đó mình còn đi đạp vịt nữa đó, anh k có chụp ảnh :))"}]'::jsonb,
    'Chiều 17/1, chúng ta cùng đạp vịt ở hồ Trúc Bạch. Đây cũng là trải nghiệm đạp vịt đầu tiên với ny, sau đó mình ăn buffe chay ở Sadhu, cũng chill và okela phết. <span class="highlight">Thực sự là anh có rất nhiều cái "lần đầu" với em.</span> Có lẽ ông trời đã định duyên 2 ta rồi ư.',
    'Nhớ em lắm ❤️',
    '{"icon":"heart","style":"top: 10px; left: 10px;"}'::jsonb,
    200,
    true
),
(
    '2026-01-26',
    '2026-01-26',
    'The first times',
    6,
    '[{"src":"image/260101.JPEG","alt":"Future plans","caption":"Let''s sushi"},{"src":"image/260102.JPEG","alt":"Travel","caption":"Ny anhhh"}]'::jsonb,
    '[]'::jsonb,
    'Hôm đấy mình ăn sushi ở quán gần chỗ em, cũng là hôm em giận anh một số chuyện, hơn hết anh xin lỗi em nhiều <span class="highlight">Sự kiện hôm ấy cũng là lúc anh quyết định muốn có danh phận với em hơn bao giờ hết.</span> Anh quyết định phải làm ny em trong ngày hôm sau, đọc trang tiếp theo nhé.',
    'Tương lai chung đôi ❤️',
    '{"icon":"heart","style":"top: 15px; right: 15px;"}'::jsonb,
    210,
    true
),
(
    '2026-01-26-2',
    '2026-01-26',
    'The first times',
    2,
    '[{"src":"image/3201.JPEG","alt":"Future plans","caption":"Phú Cường"}]'::jsonb,
    '[]'::jsonb,
    'Một ngày thật đặc biệt, khi mình đi ăn và vô tình chọn đúng quán đang tổ chức tiệc YEP. <span class="highlight">Cũng chính là ngày đầu tiên mình cùng nhau đi ăn kể từ khi có danh phận.</span>',
    'I love you ❤️',
    '{"icon":"heart","style":"top: 15px; right: 15px;"}'::jsonb,
    220,
    true
),
(
    '2026-01-27',
    '2026-01-27',
    'Confession day',
    3,
    '[]'::jsonb,
    '[]'::jsonb,
    'Đến ngày 27/1, anh nhận ra tình cảm dành cho em đã đủ lớn để trở thành một danh phận rõ ràng. Trưa hôm ấy anh vội vàng đặt một bó hoa, tối thì ra trường đón em đi ăn. Thật ra hôm trước em còn giận anh, mà hôm sau anh đã tỏ tình, nên anh hiểu để em đồng ý ngay là điều không hề dễ. Nhưng <span class="highlight">cảm xúc trong anh lúc đó mạnh mẽ quá, anh chỉ muốn mình phải có danh phận ngay trong chính ngày hôm ấy.</span> Cuối cùng, em cũng đồng ý làm người yêu của anh. Một ngày thật đặc biệt – mọi thứ đều diễn ra rất đột ngột: tỏ tình bất ngờ, có do dự, có sự trỗi dậy của cảm xúc, và rồi mình chọn ở bên nhau. Đó là khoảnh khắc đặc biệt nhất trong đời anh, một kỷ niệm khó quên để sau này mình có thật nhiều điều để kể. Từ ngày ấy, khi mình chính thức có danh phận, anh thấy mình vui hơn, mạnh dạn hơn, và có thể yêu thương em trọn vẹn mà không còn e ngại gì nữa.',
    'Hạnh phúc mỗi ngày ❤️',
    '{"icon":"flower","style":"top: 10px; left: 10px;"}'::jsonb,
    230,
    true
),
(
    '2026-02-07',
    '2026-02-07',
    'Sinh nhật sớm của em',
    5,
    '[{"src":"image/070201.JPEG","alt":"Phòng riêng view hồ","caption":"Phòng riêng view hồ"},{"src":"image/070202.JPEG","alt":"Sinh nhật sớm của em","caption":"Sinh nhật sớm của em"},{"src":"image/070203.JPEG","alt":"Công viên buổi tối","caption":"Công viên buổi tối"}]'::jsonb,
    '[]'::jsonb,
    'Hôm ấy anh tổ chức sinh nhật sớm cho em iu, cũng là ngày anh tỏ tình em lần thứ hai — theo đúng "nguyện vọng" của em nữa chứ :)))<br><br>Đến giờ nghĩ lại anh vẫn thấy hôm đó thật đẹp. Quán ăn gần như chẳng có ai nên hai đứa mình được ngồi riêng trong một căn phòng có view nhìn ra hồ, yên tĩnh và chill vô cùng. Sau bữa tối, mình lại rủ nhau ra công viên gần đó, ngồi cạnh nhau rồi kể đủ thứ chuyện trên trời dưới đất.<br><br>Chẳng có điều gì quá đặc biệt xảy ra, chỉ là hai đứa ngồi bên nhau trong một buổi tối rất bình thường. <span class="highlight">Nhưng chính những khoảnh khắc bình yên như thế, anh lại thấy quý vô cùng.</span> ❤️',
    'Sinh nhật sớm của em iu ❤️',
    '{"icon":"flower","style":"bottom: 15px; right: 15px;"}'::jsonb,
    240,
    true
),
(
    '2026-02-13',
    '2026-02-13',
    'Early Valentine',
    3,
    '[{"src":"image/130201.JPEG","alt":"Khrua Baan Thai","caption":"Khrua Baan Thai"},{"src":"image/130202.JPEG","alt":"Sân tulip đỏ","caption":"Sân tulip đỏ"},{"src":"image/130203.JPEG","alt":"Bó cẩm tú cầu tím","caption":"Bó cẩm tú cầu tím"}]'::jsonb,
    '[]'::jsonb,
    'Hôm ấy anh lên chơi với em nhân dịp Valentine. Hai đứa định đi ăn đồ Thái, nhưng quán đầu tiên đến thì hết bàn nên cuối cùng lại chuyển sang Khrua Baan Thai.<br><br>Trời hôm đó mưa nhẹ một lúc rồi tạnh. Ăn xong, mình đi uống cà phê ở một quán có cả khoảng sân đầy tulip đỏ rất xinh. Hôm ấy anh còn quay được tận hai cái video TikTok nữa cơ :)))<br><br>Sau đó anh dẫn em đi chợ gần đó để mua cho em một bó cẩm tú cầu tím xinh xinh. Rồi hai đứa lại đi lấy đồ hải sản để tối nhà em ăn lẩu.<br><br><span class="highlight">Một ngày chẳng cần kế hoạch gì quá cầu kỳ, cứ đi hết chỗ này sang chỗ khác cùng nhau thôi mà vui đến thế.</span>',
    'Valentine của chúng mình ❤️',
    null,
    250,
    true
),
(
    '2026-02-22',
    '2026-02-22',
    'A whole day for us',
    2,
    '[{"src":"image/220201.JPEG","alt":"Homestay Ocean Park","caption":"Homestay Ocean Park"},{"src":"image/220202.JPEG","alt":"Bún tôm Hải Phòng","caption":"Bún tôm Hải Phòng"},{"src":"image/220203.JPEG","alt":"Cả ngày bên nhau","caption":"Cả ngày bên nhau"}]'::jsonb,
    '[]'::jsonb,
    'Hôm đó anh rủ em về Ocean Park, thuê homestay để hai đứa có thể dành cả ngày bên nhau.<br><br>Mình cùng xuống Aeon mua nguyên liệu rồi về nấu ăn. Hôm ấy anh nấu bún tôm Hải Phòng cho em. Thực ra công thức anh mới ngồi xem từ tối hôm trước thôi :))) may mà kết quả cuối cùng cũng không "failed".<br><br>Anh còn bắt em ngồi tuốt rau ngót phụ anh nữa. <span class="highlight">Hai đứa vừa nấu vừa trêu nhau, căn phòng nhỏ mà lúc nào cũng đầy tiếng cười.</span><br><br>Sau đó chẳng cần làm gì nhiều nữa, chỉ cần được ở cạnh nhau, nghỉ ngơi, nói chuyện rồi cuối ngày anh đưa em về. Một ngày rất giản dị nhưng lại là kiểu ngày mà anh nghĩ sau này mình sẽ nhớ rất lâu.',
    'Bữa cơm đầu tiên anh nấu cho em ❤️',
    null,
    260,
    true
),
(
    '2026-02-28',
    '2026-02-28',
    'Royal City',
    4,
    '[{"src":"image/280201.JPEG","alt":"Bowling","caption":"Bowling"},{"src":"image/280202.JPEG","alt":"Máy đấm","caption":"Máy đấm"},{"src":"image/280203.JPEG","alt":"Royal City","caption":"Royal City"}]'::jsonb,
    '[]'::jsonb,
    'Hôm đó hai đứa dẫn nhau đi Royal City.<br><br>Mình chơi bowling, chơi máy đấm rồi lang thang thử thêm vài trò khác nữa. Cuối buổi hình như hai đứa còn cãi nhau một trận thì phải :)))<br><br>Nhưng nghĩ lại, có lẽ yêu nhau đâu phải lúc nào cũng chỉ toàn những ngày vui vẻ. Có lúc giận nhau, có lúc chẳng hiểu nhau, <span class="highlight">nhưng cuối cùng hai đứa vẫn lựa chọn ở lại.</span><br><br>Vậy nên em bớt bướng một chút nha :))) Anh cũng sẽ cố gắng hiểu em nhiều hơn.',
    'Giận rồi lại thương ❤️',
    null,
    270,
    true
),
(
    '2026-03-01',
    '2026-03-01',
    'Old quarter',
    5,
    '[{"src":"image/010301.JPEG","alt":"Tokyo Matcha","caption":"Tokyo Matcha"},{"src":"image/010302.JPEG","alt":"Bún chả trong ngõ","caption":"Bún chả trong ngõ"},{"src":"image/010303.JPEG","alt":"Lotte Tây Hồ","caption":"Lotte Tây Hồ"}]'::jsonb,
    '[]'::jsonb,
    'Hôm ấy hai đứa rủ nhau lên phố cổ chơi.<br><br>Buổi sáng mình uống Tokyo Matcha. Anh nhớ lúc ấy em vừa uống nước vừa tất bật tìm quà cho sếp người Hàn chuẩn bị đi Hong Kong thì phải. Sếp hỏi nên mua gì nên em ngồi tìm đủ thứ, từ cà phê đến mấy món khác nữa… đoạn này anh không nhớ hết rồi :)))<br><br>Buổi trưa mình chui vào một quán bún chả trong ngõ ở phố cổ. Quán nhỏ thôi nhưng ăn cũng khá ngon.<br><br>Sau đó hai đứa sang Lotte Tây Hồ. Hình như hôm ấy anh còn dẫn em vào YSL xem đồ. Tiếc là những mẫu đẹp lúc đó hết mất rồi, nên anh chỉ biết chụp lại.<br><br><span class="highlight">Không mua được hôm ấy thì để dành đó. Biết đâu một ngày nào đó anh lại mua đúng món ấy cho em.</span>',
    'Một ngày lang thang phố cổ ❤️',
    null,
    280,
    true
),
(
    '2026-03-04',
    '2026-03-04',
    'An ordinary evening',
    6,
    '[{"src":"image/040301.JPEG","alt":"Bữa tối sau giờ làm","caption":"Bữa tối sau giờ làm"},{"src":"image/040302.JPEG","alt":"Quán đồ Trung Á","caption":"Quán đồ Trung Á"}]'::jsonb,
    '[]'::jsonb,
    'Một ngày đi làm rất bình thường.<br><br>Anh đi làm cả ngày rồi tối mới gặp em. Hôm ấy anh bảo tự nhiên thèm đồ Trung Quốc, thế nào cuối cùng lại dẫn em đi ăn đồ Trung Á :)))<br><br>Ăn xong anh đưa em về ký túc xá.<br><br>Có những buổi hẹn chẳng cần có hoạt động gì đặc biệt. <span class="highlight">Chỉ đơn giản là sau một ngày mệt mỏi vẫn muốn gặp nhau, cùng ăn một bữa tối rồi đưa nhau về.</span> Với anh, như vậy cũng đã đủ vui rồi.',
    'Ngày thường có em cũng thành đặc biệt ❤️',
    null,
    290,
    true
),
(
    '2026-03-08',
    '2026-03-08',
    'Happy Women''s Day',
    7,
    '[{"src":"image/080301.JPEG","alt":"Bó cẩm tú cầu 8/3","caption":"Bó cẩm tú cầu 8/3"},{"src":"image/080302.JPEG","alt":"Long Wang","caption":"Long Wang"},{"src":"image/080303.JPEG","alt":"Matcha gần ký túc xá","caption":"Matcha gần ký túc xá"}]'::jsonb,
    '[]'::jsonb,
    'Chúc mừng ngày Quốc tế Phụ nữ của em. <span class="highlight">Anh mong em lúc nào cũng xinh đẹp, vui vẻ và ngày càng thành công trong công việc nhaaa.</span><br><br>Hôm ấy buổi trưa em từ quê lên. Anh đi xe bus lên gặp em, mang theo một bó cẩm tú cầu và cả chiếc sạc dự phòng đôi anh mua cho em.<br><br>Hai đứa ăn Long Wang, sau đó lại đi uống matcha ở quán gần ký túc xá của em. Cuối ngày anh lại lóc cóc bắt bus về.<br><br>Đi một quãng đường dài chỉ để gặp em vài tiếng, ăn với nhau một bữa, uống với nhau một cốc nước. Nhưng hồi đó anh chưa bao giờ thấy những chuyến đi như thế là phiền cả.',
    '8/3 của riêng em ❤️',
    null,
    300,
    true
),
(
    '2026-03-10',
    '2026-03-10',
    'The first night',
    1,
    '[{"src":"image/100301.JPEG","alt":"Bữa tối","caption":"Bữa tối"},{"src":"image/100302.JPEG","alt":"Highlands","caption":"Highlands"}]'::jsonb,
    '[]'::jsonb,
    'Lại là một ngày đi làm bình thường.<br><br>Buổi tối mình gặp nhau, đi ăn rồi ghé Highlands ngồi chơi. Ban đầu anh định về, nhưng lúc ấy cũng khuya rồi nên cuối cùng em giữ anh ở lại.<br><br><span class="highlight">Đó cũng là lần đầu tiên hai đứa ở cạnh nhau suốt một đêm.</span><br><br>Anh nghĩ đó là một trong những cột mốc mà có lẽ cả hai sẽ còn nhớ rất lâu — vừa ngại ngùng, vừa vui, vừa có rất nhiều cảm xúc khó diễn tả thành lời.',
    'Đêm đầu tiên có em bên cạnh ❤️',
    null,
    310,
    true
),
(
    '2026-03-15',
    '2026-03-15',
    'Tulip season',
    2,
    '[{"src":"image/150301.JPEG","alt":"Công viên Hoàng Hoa Thám","caption":"Công viên Hoàng Hoa Thám"},{"src":"image/150302.JPEG","alt":"Tulip của em","caption":"Tulip của em"},{"src":"image/150303.JPEG","alt":"Chậu tulip sáng 16/3","caption":"Chậu tulip sáng 16/3"}]'::jsonb,
    '[]'::jsonb,
    'Hôm ấy mình đi chơi ở công viên Hoàng Hoa Thám.<br><br>Sau đó anh dẫn em đi mua tulip. <span class="highlight">Nhìn thấy em vui vẻ khi ôm hoa trên tay, tự nhiên anh cũng thấy hạnh phúc theo.</span> Có lẽ một trong những điều anh thích nhất là nhìn thấy em vui vì những thứ bé xíu như vậy.<br><br>Buổi tối hai đứa ăn Don Chicken gần ký túc xá của em.<br><br>Sáng hôm sau, ngày 16/3, anh lại mua thêm cho em một chậu tulip nữa. Tối hôm ấy mình đi ăn bún chả Sinh Từ gần ký túc xá.<br><br>Tiếc là bữa đó anh lại quên không chụp hình :v Nhưng thôi, có những kỷ niệm không có ảnh thì mình giữ trong đầu vậy.',
    'Mùa tulip của em ❤️',
    null,
    320,
    true
),
(
    '2026-03-21',
    '2026-03-21',
    'Valley of flowers',
    3,
    '[{"src":"image/210301.JPEG","alt":"Thung lũng hoa Hồ Tây","caption":"Thung lũng hoa Hồ Tây"},{"src":"image/210302.JPEG","alt":"Anh chụp cho em","caption":"Anh chụp cho em"},{"src":"image/210303.JPEG","alt":"Chợ hoa Quảng Bá","caption":"Chợ hoa Quảng Bá"}]'::jsonb,
    '[]'::jsonb,
    'Hôm đó hai đứa đi Thung lũng hoa Hồ Tây.<br><br>Mình đi qua từng khu vườn, ngắm hoa, ngắm đèn rồi cứ thong thả đi cạnh nhau. Có lúc em còn gọi điện về cho gia đình nữa.<br><br>Anh thì đảm nhận nhiệm vụ chụp ảnh cho em. Hôm ấy thấy một đôi khác đang chụp ảnh cho nhau đẹp quá, thế là em quay sang bảo anh: "Anh học tập người ta cách chụp ảnh cho người yêu đi." :)))<br><br>Sau đó hai đứa lại kéo nhau sang chợ hoa Quảng Bá.<br><br>Thật ra mình chẳng nhất thiết phải mua gì. <span class="highlight">Chỉ cần cùng nhau đi giữa một nơi đầy hoa thôi cũng đã thấy vui rồi, đúng không em?</span>',
    'Thung lũng hoa hồ Tây ❤️',
    null,
    330,
    true
),
(
    '2026-03-25',
    '2026-03-25',
    'Two cups of Highlands',
    4,
    '[{"src":"image/250301.JPEG","alt":"Hai cốc Highlands","caption":"Hai cốc Highlands"},{"src":"image/250302.JPEG","alt":"Quán Thái ở Nhân Chính","caption":"Quán Thái ở Nhân Chính"}]'::jsonb,
    '[]'::jsonb,
    'Hôm ấy cũng là một ngày đi làm bình thường.<br><br>Anh nhớ em đi cùng công ty cũ xuống Thái Nguyên thì phải. Trên đường về em còn mua hai cốc Highlands cho anh.<br><br>Buổi tối mình gặp nhau rồi đi ăn ở một quán Thái bên Nhân Chính. Sau đó anh lại đưa em về ký túc xá.<br><br>Những ngày bình thường như thế xuất hiện rất nhiều trong câu chuyện của hai đứa mình. Nhưng nghĩ lại, <span class="highlight">chính chúng mới là phần lớn tình yêu — không phải những dịp thật đặc biệt, mà là việc giữa một ngày bận rộn vẫn nhớ đến nhau.</span>',
    'Cảm ơn em vì luôn nghĩ tới anh ❤️',
    null,
    340,
    true
),
(
    '2026-04-01',
    '2026-04-01',
    'Grill night',
    5,
    '[{"src":"image/010401.JPEG","alt":"Nướng Huỳnh Thúc Kháng","caption":"Nướng Huỳnh Thúc Kháng"},{"src":"image/010402.JPEG","alt":"Tai nạn nhỏ","caption":"Tai nạn nhỏ"}]'::jsonb,
    '[]'::jsonb,
    'Hôm đó em bắt bus ra chỗ anh.<br><br>Anh dẫn em đi ăn nướng ở Huỳnh Thúc Kháng. Em còn nhớ không, hôm ấy anh đang ngồi yên lành thì bà chị bàn đằng sau làm đổ cả thịt sang chỗ anh :)))))<br><br><span class="highlight">Một tai nạn nhỏ nhưng nhờ thế lại thành chuyện để sau này nhắc lại vẫn buồn cười.</span>',
    'Kỷ niệm dở khóc dở cười ❤️',
    null,
    350,
    true
),
(
    '2026-04-03',
    '2026-04-03',
    'Ốc, round two',
    6,
    '[{"src":"image/030401.JPEG","alt":"Ốc Bếp Mẹ Đăng","caption":"Ốc Bếp Mẹ Đăng"},{"src":"image/030402.JPEG","alt":"Quán tủ của anh","caption":"Quán tủ của anh"}]'::jsonb,
    '[]'::jsonb,
    'Hai đứa đi ăn ốc lần thứ hai ở Bếp Mẹ Đăng.<br><br>Quán tủ của anh rồi nên cứ nghĩ đến ăn ốc là anh chẳng muốn mất công tìm quán khác nữa :)))<br><br><span class="highlight">Có một vài nơi tự nhiên dần trở thành "quán của hai đứa mình" như thế.</span>',
    'Vẫn là Bếp Mẹ Đăng ❤️',
    null,
    360,
    true
),
(
    '2026-04-05',
    '2026-04-05',
    'Indian food',
    7,
    '[{"src":"image/050401.JPEG","alt":"Quán Ấn Độ toà S2.10","caption":"Quán Ấn Độ toà S2.10"},{"src":"image/050402.JPEG","alt":"Thử một lần cho biết","caption":"Thử một lần cho biết"}]'::jsonb,
    '[]'::jsonb,
    'Hôm ấy em lên nhà anh chơi.<br><br>Em bảo muốn ăn đồ Ấn Độ nên anh dẫn em đến quán ở tòa S2.10.<br><br>Hai đứa háo hức thử cho biết…<br><br><span class="highlight">Và sau khi ăn xong thì có lẽ thống nhất rằng trải nghiệm một lần trong đời là đủ rồi ha :)))</span>',
    'Thử một lần cho biết ❤️',
    null,
    370,
    true
),
(
    '2026-04-06',
    '2026-04-06',
    'Our first photobooth',
    1,
    '[{"src":"image/060401.JPEG","alt":"Quán Onjeong","caption":"Quán Onjeong"},{"src":"image/060402.JPEG","alt":"Photobooth đầu tiên","caption":"Photobooth đầu tiên"},{"src":"image/060403.JPEG","alt":"Quà ngày đàn ông","caption":"Quà ngày đàn ông"}]'::jsonb,
    '[]'::jsonb,
    'Một ngày đi làm bình thường khác.<br><br>Buổi tối em mời anh đi ăn và anh chọn quán Onjeong gần công ty.<br><br>Ăn xong hai đứa rủ nhau đi chụp photobooth. Với anh hôm ấy khá đặc biệt, vì đó là lần đầu tiên trong đời anh chụp photobooth.<br><br><span class="highlight">Một việc rất bình thường với nhiều người nhưng lại trở thành một kỷ niệm đáng nhớ của anh chỉ vì người đứng cạnh anh trong những tấm ảnh ấy là em.</span><br><br>À, em còn tặng anh dung dịch vệ sinh nam nhân ngày đàn ông nữa chứ :))) Đúng là quà của em lúc nào cũng rất… thực tế.',
    'Tấm hình đầu tiên của chúng mình ❤️',
    null,
    380,
    true
),
(
    '2026-04-09',
    '2026-04-09',
    'Sườn Mười',
    2,
    '[{"src":"image/090401.JPEG","alt":"Sườn Mười","caption":"Sườn Mười"},{"src":"image/090402.JPEG","alt":"Miếng sườn to đùng","caption":"Miếng sườn to đùng"}]'::jsonb,
    '[]'::jsonb,
    'Hôm ấy anh hỏi: "Em muốn ăn gì?"<br><br>Em bảo muốn ăn Sườn Mười.<br><br>Anh cũng chưa ăn ở đó bao giờ nên cuối cùng hai đứa cùng nhau đi thử. Ngồi ngoạm mấy miếng sườn to đùng mà thấy cũng ngon phết hehehe.<br><br><span class="highlight">Lại thêm một quán mới được hai đứa cùng nhau khám phá.</span>',
    'Em thích gì anh chiều đó ❤️',
    null,
    390,
    true
),
(
    '2026-04-12',
    '2026-04-12',
    'Cake and stories',
    3,
    '[{"src":"image/120401.JPEG","alt":"Quán nước gần chỗ em","caption":"Quán nước gần chỗ em"},{"src":"image/120402.JPEG","alt":"Bánh ngọt","caption":"Bánh ngọt"},{"src":"image/120403.JPEG","alt":"Ngồi kể chuyện","caption":"Ngồi kể chuyện"}]'::jsonb,
    '[]'::jsonb,
    'Hôm ấy anh đến chỗ em và hai đứa hẹn nhau ở một quán nước gần đó.<br><br>Quán khá xinh, có cả bánh nên hai đứa ngồi chọn nước, chọn bánh rồi kiếm một góc ngồi cạnh nhau.<br><br>Sau đó chẳng làm gì cả, chỉ kể cho nhau nghe những chuyện đang xảy ra trong cuộc sống của mình.<br><br>Anh luôn thích những buổi như vậy. Không cần đi đâu xa, không cần phải nghĩ xem hôm nay chơi gì. <span class="highlight">Chỉ cần hai đứa ngồi trước mặt nhau và vẫn còn thật nhiều chuyện muốn kể cho nhau nghe là được.</span>',
    'Chỉ cần ngồi cạnh em ❤️',
    null,
    400,
    true
),
(
    '2026-04-15',
    '2026-04-15',
    'Bingsu',
    4,
    '[{"src":"image/150401.JPEG","alt":"Bingsu Mễ Trì","caption":"Bingsu Mễ Trì"},{"src":"image/150402.JPEG","alt":"Lựa chọn của em","caption":"Lựa chọn của em"}]'::jsonb,
    '[]'::jsonb,
    'Hôm ấy hai đứa hẹn nhau đi ăn bingsu ở Mễ Trì.<br><br>Trong tình trạng anh đang ho, còn em thì cũng đang không được khỏe lắm :))) Ấy thế mà cuối cùng vẫn quyết định ăn bingsu.<br><br>Mà quan trọng nhất là… <span class="highlight">bingsu do em chọn nhé. Vậy nên nếu anh ho nặng thêm thì lỗi tại em hết :)))</span><br><br>Em chẳng thương anhhh.',
    'Ốm cũng chiều em ❤️',
    null,
    410,
    true
),
(
    '2026-04-16',
    '2026-04-16',
    'Painting by the lake',
    5,
    '[{"src":"image/160401.JPEG","alt":"Cuốn Deli","caption":"Cuốn Deli"},{"src":"image/160402.JPEG","alt":"Tô tượng Hồ Tây","caption":"Tô tượng Hồ Tây"},{"src":"image/160403.JPEG","alt":"Chú mèo loè loẹt","caption":"Chú mèo loè loẹt"}]'::jsonb,
    '[]'::jsonb,
    'Tối hôm ấy mình đi ăn bánh tráng cuộn ở Cuốn Deli.<br><br>Ăn xong hai đứa lại rủ nhau ra Hồ Tây tô tượng. Không hiểu bằng một cách thần kỳ nào đó mà hai đứa đã biến một chú mèo vô tội thành một tác phẩm đầy màu sắc, loè loẹt hết mức có thể :))) Khổ thân nó thật.<br><br>Nhưng đến giờ anh vẫn giữ chú mèo ấy trên bàn làm việc. Có lẽ bởi vì nhìn nó, anh không chỉ nhìn thấy một món đồ trang trí. Anh nhớ lại buổi tối hôm đó, nhớ hai đứa ngồi cạnh nhau hí hoáy tô từng chút một, nhớ những câu chuyện linh tinh, những lần cười ngớ ngẩn.<br><br>Và rồi anh nhận ra rằng tình yêu của mình được tạo nên từ rất nhiều ngày như thế. Có những ngày đặc biệt, có những ngày chẳng có gì đặc biệt. Có những bó hoa, những bữa ăn, những chuyến xe bus, những quán nước, những lần cãi nhau rồi làm hòa, những món quà ngốc nghếch và cả những buổi tối chỉ đơn giản là ngồi cạnh nhau.<br><br>Từng chuyện khi xảy ra có vẻ rất nhỏ. Nhưng khi đặt tất cả chúng cạnh nhau, anh mới thấy đó chính là một đoạn thanh xuân rất đẹp của anh.<br><br><span class="highlight">Và điều làm cho những ngày ấy trở nên đáng nhớ nhất, vẫn luôn là vì trong những ngày đó có em.</span> ❤️',
    'Một đoạn thanh xuân rất đẹp của anh ❤️',
    null,
    420,
    true
)
on conflict (id) do nothing;

commit;
