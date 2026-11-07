# Hướng dẫn Supabase cho “Our Love Story”

Từ bây giờ nội dung các trang kỷ niệm nằm trong **Supabase**, và bạn thêm/sửa/xóa bằng trang
`admin.html` thay vì sửa code. Trang sách vẫn là web tĩnh, không cần build.

```
index.html ──► story-api.js ──► Supabase (bảng story_pages)
                    │
                    └── nếu lỗi / chưa cấu hình ──► pages.js (dự phòng)

admin.html ──► admin.js ──► Supabase (CRUD + Storage ảnh)
```

- `pages.js` không bị xóa: nó là **dữ liệu dự phòng** khi chưa cấu hình Supabase, đồng thời là
  nguồn để sinh `supabase/seed.sql` (42 trang kỷ niệm hiện có).
- Khi đã cấu hình Supabase, sửa nội dung trên `admin.html` là đủ.

---

## 1. Tạo project Supabase

1. Vào <https://supabase.com>, đăng nhập và bấm **New project**.
2. Đặt tên, chọn mật khẩu database, chọn region gần Việt Nam (Singapore là hợp lý).
3. Chờ project khởi tạo xong (khoảng 1–2 phút).

---

## 2. Chạy SQL

Mở **SQL Editor → New query**, dán **toàn bộ** nội dung file:

```
supabase/setup.sql
```

rồi bấm **Run**.

File này làm những việc sau:

- Tạo bảng `public.story_pages` (mỗi dòng là một trang kỷ niệm).
- Tạo index, trigger tự cập nhật `updated_at`.
- Bật RLS: khách chỉ đọc trang đã publish; tài khoản đăng nhập được đọc tất cả và ghi.
- Tạo bucket Storage `story-images` (public để đọc ảnh, chỉ tài khoản đăng nhập mới upload).
- Nhập 42 trang kỷ niệm hiện có từ `pages.js`.

> `setup.sql` được sinh tự động từ `schema.sql` + `seed.sql`.
> Nếu muốn chạy riêng, chạy `schema.sql` trước rồi `seed.sql` sau.
> Phần seed dùng `on conflict (id) do nothing`, nên **chạy lại không ghi đè** những gì bạn đã sửa
> trên web admin.

Kiểm tra nhanh trong SQL Editor:

```sql
select count(*) from public.story_pages;
-- khoảng 42
```

---

## 3. Tạo tài khoản admin

1. Vào **Authentication → Users → Add user**.
2. Nhập email và mật khẩu của bạn.
3. Bật **Auto Confirm User** (để đăng nhập được ngay, không cần xác nhận email).

### Quan trọng: tắt đăng ký công khai

Vào **Authentication → Sign In / Providers → Email**:

- Tắt **Enable sign ups** (không cho người lạ tự tạo tài khoản).
- Tắt **Allow anonymous sign-ins**.

Vì policy cho phép mọi tài khoản `authenticated` được ghi dữ liệu, nếu bật signup công khai thì
người lạ có thể tạo tài khoản và sửa cuốn sách của bạn.

Nếu muốn chặt hơn nữa, xem phần [Bảo mật nâng cao](#10-bảo-mật-nâng-cao).

---

## 4. Lấy key và cấu hình

1. Vào **Project Settings → API** (hoặc **Settings → API Keys**).
2. Copy:
   - **Project URL** — dạng `https://abcdefgh.supabase.co`
   - **anon public** key (một số project mới gọi là **publishable key**)
3. Mở file `supabase-config.js` và điền:

```js
window.SUPABASE_CONFIG = {
    url: "https://abcdefgh.supabase.co",
    anonKey: "eyJhbGciOiJIUzI1NiIs...",

    table: "story_pages",
    bucket: "story-images"
};
```

Lưu file rồi tải lại trang.

> **Không** dán `service_role` key vào đây. Key đó bỏ qua RLS và chỉ được dùng ở server.
> `anon` key được thiết kế để công khai trong trình duyệt; quyền ghi được bảo vệ bằng đăng nhập +
> RLS.

---

## 5. Mở trang quản trị

Nên chạy qua local server thay vì mở trực tiếp `file://` (một số trình duyệt chặn
localStorage/Auth với `file://`):

```bash
# Python có sẵn trên máy
python -m http.server 8000
```

Hoặc dùng extension **Live Server** trong VS Code, rồi mở:

```
http://localhost:8000/admin.html
```

Đăng nhập bằng tài khoản đã tạo ở bước 3.

> Nếu deploy lên mạng, địa chỉ sẽ là `https://ten-mien-cua-ban/admin.html`.

---

## 6. Kiểm tra trang sách

Mở `index.html` (qua local server hoặc domain). Nếu mọi thứ ổn, mở DevTools Console sẽ thấy:

```
[Supabase] Đã tải 42 trang kỷ niệm.
```

Nếu chưa cấu hình hoặc không kết nối được, trang tự dùng `pages.js` và vẫn mở bình thường.

> Nếu bảng `story_pages` đã kết nối được nhưng **chưa có trang nào được publish**, trang sách cũng
> tạm dùng `pages.js`. Hãy publish ít nhất một trang trong admin (hoặc chạy `seed.sql`) để thấy dữ
> liệu từ Supabase.

---

## 7. Cách dùng trang admin

### Thêm một kỷ niệm

1. Bấm **Thêm trang**.
2. Chọn **Ngày** — ngày này quyết định vị trí trang trong sách và nhãn ngày.
3. Điền **Tiêu đề**, **Lời nhắn**, **Dòng ký tên**.
4. Chọn **Bố cục ảnh** 1–7 (xem bảng bên dưới).
5. Thêm ảnh:
   - Bấm biểu tượng **upload** để tải ảnh lên Supabase Storage, hoặc
   - dán URL, hoặc đường dẫn nội bộ như `image/121101.JPEG`.
6. Thêm **bong bóng chữ** nếu muốn lời thoại nổi trên ảnh.
7. Giữ **Hiển thị trên sách** nếu muốn khách thấy; bỏ chọn để lưu nháp.
8. Bấm **Lưu trang**, rồi tải lại `index.html`.

### Bố cục ảnh

| Layout | Cách xếp |
|---|---|
| 1 | Ảnh lớn + 2 ảnh nhỏ |
| 2 | Hai ảnh cạnh nhau |
| 3 | Ảnh lớn bên trái |
| 4 | Ảnh lớn bên phải |
| 5 | Một ảnh rộng |
| 6 | Ba ảnh so le |
| 7 | Ảnh chồng lớp |

Số ảnh không nhất thiết phải khớp tuyệt đối; layout chỉ là CSS, ảnh thiếu sẽ được ẩn.

### Lời nhắn có định dạng

Ô **Lời nhắn** cho phép HTML:

```html
Anh nhớ hôm đó trời mưa rất nhẹ.<br><br>
<span class="highlight">Và em thì vẫn cười như thế.</span>
```

- `<br>` để xuống dòng.
- `<span class="highlight">…</span>` để tô sáng đoạn chữ.
- Có thể dùng `<b>`, `<i>` nếu muốn.

### Thứ tự trong cùng một ngày

Sách sắp xếp theo **ngày tăng dần**, sau đó theo **thứ tự trong ngày** (số nhỏ đứng trước).
Khi thêm trang mới, ô này tự gợi ý số tiếp theo. Có thể sửa tay, ví dụ 10, 20, 30…

### Ẩn / hiện, xóa

- Nút hình **con mắt** trên thẻ trang: chuyển giữa *Đang hiển thị* và *Bản nháp*.
- Nút **thùng rác**: xóa vĩnh viễn trang khỏi database (ảnh đã upload vẫn còn trong Storage).
- Ô tìm kiếm lọc theo tiêu đề, nội dung, ngày, mã trang.

---

## 8. Cấu trúc dữ liệu

Bảng `public.story_pages`:

| Cột | Kiểu | Ý nghĩa |
|---|---|---|
| `id` | `text` | Khóa chính, dạng slug `2025-11-12` (trang cùng ngày có thể là `2025-11-12-2`) |
| `date` | `date` | Ngày kỷ niệm |
| `title` | `text` | Tiêu đề trang |
| `layout` | `integer` | Bố cục 1–7 |
| `photos` | `jsonb` | Mảng ảnh `[{src, alt, caption}]` |
| `bubbles` | `jsonb` | Mảng bong bóng `[{variant, style, text}]` |
| `note` | `text` | Lời nhắn, cho phép HTML |
| `signature` | `text` | Dòng ký tên |
| `decor` | `jsonb` | `{icon: "flower"|"heart", style: "top: 10px; left: 10px;"}` |
| `sort_order` | `integer` | Thứ tự trong cùng ngày |
| `is_published` | `boolean` | Khách xem sách có thấy trang không |
| `created_at` | `timestamptz` | Tự sinh |
| `updated_at` | `timestamptz` | Tự cập nhật mỗi lần sửa |

Ví dụ JSON của một trang:

```json
{
  "photos": [
    { "src": "https://.../story-images/2025-11-12/abc.jpg", "alt": "First date", "caption": "Quán Don Chicken" }
  ],
  "bubbles": [
    { "variant": 1, "style": "top: 40%; left: 15%;", "text": "\"Tim anh đập nhanh khi thấy em\"" }
  ],
  "decor": { "icon": "flower", "style": "top: 10px; left: 10px;" }
}
```

---

## 9. Ảnh và Storage

- Bucket: `story-images`, chế độ **public** (ai cũng xem được ảnh, giống ảnh trong `image/`).
- Chỉ tài khoản đã đăng nhập mới upload/sửa/xóa ảnh.
- Giới hạn 10 MB/ảnh; định dạng: JPG, PNG, WebP, GIF, AVIF.
- Ảnh tải lên được đặt theo ngày, ví dụ `2026-04-16/1713…-ab12cd.jpg`.
- Ảnh cũ trong thư mục `image/` vẫn dùng bình thường nếu bạn dán đường dẫn `image/...`.

Khi xóa một trang, các file ảnh đã upload **không** tự xóa khỏi bucket. Nếu muốn dọn, vào
**Storage → story-images** xóa file không dùng nữa.

---

## 10. Bảo mật nâng cao

### 10.1. Chỉ một email được ghi dữ liệu

Nếu muốn vẫn bật signup mà chỉ tài khoản của bạn được sửa, chạy phần comment ở cuối
`supabase/schema.sql` (thay `ban@example.com` bằng email thật), hoặc chạy:

```sql
drop policy if exists story_pages_auth_insert on public.story_pages;
create policy story_pages_auth_insert on public.story_pages
    for insert to authenticated
    with check ((auth.jwt() ->> 'email') = 'ban@example.com');

drop policy if exists story_pages_auth_update on public.story_pages;
create policy story_pages_auth_update on public.story_pages
    for update to authenticated
    using ((auth.jwt() ->> 'email') = 'ban@example.com')
    with check ((auth.jwt() ->> 'email') = 'ban@example.com');

drop policy if exists story_pages_auth_delete on public.story_pages;
create policy story_pages_auth_delete on public.story_pages
    for delete to authenticated
    using ((auth.jwt() ->> 'email') = 'ban@example.com');
```

Làm tương tự cho policy Storage nếu cần.

### 10.2. Nguyên tắc

- `anon` key: công khai được, chỉ đọc trang published.
- `service_role` key: **không bao giờ** đặt trong HTML/JS frontend.
- Trang admin không phải “bí mật”; lớp bảo vệ thật là đăng nhập + RLS.
- Khi deploy, dùng HTTPS.

---

## 11. Deploy lên mạng

Đây là site tĩnh, có thể đưa lên GitHub Pages, Netlify, Vercel, Cloudflare Pages…

Các file cần đưa lên:

```
index.html
admin.html
script.js
story-api.js
supabase-config.js
pages.js
music.js
styles.css
admin.css
image/
sound/
supabase/   (không bắt buộc khi chạy, nhưng nên giữ để backup)
```

Không cần build, không cần server Node.

Sau khi deploy:

- Mở `https://ten-mien/admin.html`, đăng nhập, thêm thử một trang.
- Mở `https://ten-mien/` để xem.
- Nếu dùng email/mật khẩu và sau này làm chức năng quên mật khẩu, nhớ cấu hình
  **Authentication → URL Configuration** (Site URL + Redirect URLs) trong Supabase.

---

## 12. Xử lý sự cố

| Hiện tượng | Nguyên nhân thường gặp | Cách xử lý |
|---|---|---|
| Admin hiện “Chưa kết nối Supabase” | Chưa điền `supabase-config.js` | Điền `url` + `anonKey`, lưu và tải lại |
| `Could not find the table 'public.story_pages'` | Chưa chạy SQL, hoặc PostgREST chưa reload schema | Chạy `supabase/setup.sql`; đợi vài giây; chạy `notify pgrst, 'reload schema';` |
| `Bucket not found` | Chưa tạo bucket Storage | Chạy lại phần Storage trong `schema.sql` |
| `Invalid login credentials` | Sai email/mật khẩu, hoặc chưa tạo user | Tạo lại user trong Authentication → Users |
| `Email not confirmed` | User chưa xác nhận | Bật Auto Confirm khi tạo, hoặc xác nhận trong dashboard |
| `new row violates row-level security policy` | Chưa đăng nhập, hoặc policy bị sai | Đăng nhập lại; kiểm tra RLS; chạy lại `schema.sql` |
| Ảnh upload báo lỗi | Sai định dạng / quá 10 MB / thiếu policy | Dùng JPG/PNG/WebP/GIF/AVIF, ảnh nhỏ hơn 10 MB |
| Ảnh không hiện trên sách | URL sai, file bị xóa, bucket không public | Kiểm tra URL; xem Storage; chạy lại phần bucket |
| Trang mới không thấy trên sách | Đang là bản nháp | Bật “Hiển thị trên sách” trong admin |
| Sửa xong nhưng sách không đổi | Cache trình duyệt | Ctrl/Cmd + Shift + R; kiểm tra `is_published` |
| Trang tự quay về nội dung cũ | Supabase lỗi / chưa cấu hình nên dùng `pages.js` | Xem Console; kiểm tra key/URL/mạng |
| Không đăng nhập được khi mở `file://` | Trình duyệt chặn Auth/localStorage | Chạy local server (`python -m http.server`) |
| CDN supabase-js bị chặn | Mạng/firewall | Tải `supabase.js` về thư mục dự án và sửa `<script src>` trong `index.html` + `admin.html` |

Mẹo: mở DevTools Console ở cả `index.html` và `admin.html` — các lỗi đều được log kèm tiền tố
`[Supabase]` hoặc `[Admin]`.

---

## 13. Câu lệnh SQL hữu ích

```sql
-- Đếm và xem danh sách
select count(*) from public.story_pages;

select id, date, title, is_published, sort_order
from public.story_pages
order by date desc, sort_order;

-- Ẩn/hiện nhanh một trang
update public.story_pages set is_published = false where id = '2026-04-16';

-- Đổi thứ tự trong ngày
update public.story_pages set sort_order = 30 where id = '2026-01-26-2';

-- Xem các trang chưa có ảnh
select id, date, title
from public.story_pages
where jsonb_array_length(photos) = 0
order by date desc;
```

### Backup

- **Dashboard → Database → Backups** (tùy gói).
- Hoặc **Table Editor → story_pages → Export → CSV**.
- Hoặc dùng chuỗi kết nối Postgres với `pg_dump` nếu quen.

### Sinh lại seed từ `pages.js`

Nếu sau này bạn sửa `pages.js` và muốn nhập lại vào một project mới:

```bash
node supabase/build-seed.mjs
```

Lệnh này ghi lại `supabase/seed.sql` và `supabase/setup.sql`. Với project đã có dữ liệu, seed
**không ghi đè** các `id` đã tồn tại.

---

## 14. File nào đã thay đổi?

| File | Vai trò |
|---|---|
| `index.html` | Thêm 3 thẻ script: supabase-js, config, story-api |
| `script.js` | Tải dữ liệu bất đồng bộ, fallback `pages.js`, escape nội dung |
| `pages.js` | Vẫn giữ làm dữ liệu dự phòng + nguồn seed |
| `supabase-config.js` | **Bạn cần điền URL + anon key** |
| `story-api.js` | Lớp gọi Supabase, chuyển row → object cho sách |
| `admin.html` | Trang quản trị mới |
| `admin.css` | Giao diện trang quản trị |
| `admin.js` | Đăng nhập + CRUD + upload ảnh |
| `supabase/schema.sql` | Bảng, RLS, trigger, Storage |
| `supabase/seed.sql` | 42 trang kỷ niệm hiện có |
| `supabase/setup.sql` | Bản gộp schema + seed để dán một lần |
| `supabase/build-seed.mjs` | Script sinh seed từ `pages.js` |

Chúc hai đứa mình luôn có thật nhiều trang mới để viết ❤️
