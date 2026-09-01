/* =========================================================================
   DANH SÁCH NHẠC NỀN
   -------------------------------------------------------------------------
   Thêm bài mới = chép file .mp3 vào thư mục sound/ rồi thêm 1 dòng vào mảng
   dưới đây. Không cần sửa file nào khác.

   Các field:
     id      (bắt buộc) khóa duy nhất, đặt gì cũng được miễn không trùng
     title   (bắt buộc) tên bài hiện trong danh sách
     artist  ca sĩ, bỏ trống cũng được
     src     (bắt buộc) đường dẫn tới file, ví dụ "sound/ten-bai.mp3"
     note    dòng ghi chú nhỏ, ví dụ "bài mình nghe hôm 14/11"

   Bài đầu tiên trong mảng là bài tự phát khi mở sách.
   ========================================================================= */

const PLAYLIST = [
   
    {
        id: "Boy With Luv",
        title: "Boy With Luv",
        artist: "BTS",
        src: "sound/Boy With Luv.mp3",
        note: "bài đang dùng làm nhạc nền"
    },
    {
        id: "Zack Tabudlo",
        title: "Zack Tabudlo",
        artist: "Pano",
        src: "sound/Zack Tabudlo.mp3",
        note: "bài đang dùng làm nhạc nền"
    }

    // Thêm bài mới theo mẫu này:
    // {
    //     id: "em-cua-ngay-hom-qua",
    //     title: "Em Của Ngày Hôm Qua",
    //     artist: "Sơn Tùng M-TP",
    //     src: "sound/em-cua-ngay-hom-qua.mp3",
    //     note: ""
    // },
];

if (typeof window !== 'undefined') window.PLAYLIST = PLAYLIST;
if (typeof module !== 'undefined') module.exports = PLAYLIST;
