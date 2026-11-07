/* =============================================================================
   CẤU HÌNH SUPABASE
   -----------------------------------------------------------------------------
   1. Tạo project tại https://supabase.com
   2. Mở SQL Editor, dán và chạy toàn bộ file supabase/setup.sql
   3. Vào Project Settings → API, copy:
        - Project URL        (dạng https://abcdefgh.supabase.co)
        - anon / publishable key
   4. Dán vào 2 dòng bên dưới, lưu file rồi tải lại trang.

   Lưu ý: anon key được thiết kế để công khai trong trình duyệt. Quyền ghi được
   bảo vệ bằng RLS + đăng nhập admin, không phải bằng cách giấu key này.
   TUYỆT ĐỐI không dán service_role key vào file này.
   ============================================================================= */

window.SUPABASE_CONFIG = {
    url: "https://aplabcbsxrgpaxftwola.supabase.co",        // ví dụ: "https://abcdefgh.supabase.co"
    anonKey: "sb_publishable_5i4LBKlentnoFaEE6-2xzA_mrg5W-5C",    // ví dụ: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

    // Tên bảng và bucket ảnh, khớp với supabase/schema.sql
    table: "story_pages",
    bucket: "story-images"
};
