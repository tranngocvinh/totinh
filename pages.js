/* =========================================================================
   NỘI DUNG CÁC TRANG KỶ NIỆM
   -------------------------------------------------------------------------
   Thêm trang mới = thêm 1 object vào mảng dưới đây, đặt đúng vị trí theo
   thứ tự thời gian. Trang và mục lục sẽ tự sinh ra, không cần sửa index.html.

   Các field:
     id        (bắt buộc) khóa duy nhất, mặc định dùng "yyyy-mm-dd"
     date      (bắt buộc) hiện trên nhãn ngày, dạng "Mon D, YYYY"
     title     tiêu đề trang, bỏ trống thì không hiện
     layout    1..7, kiểu xếp ảnh (xem .layout-N trong styles.css)
     photos    [{ src, alt, caption }] - caption có thể bỏ
     bubbles   [{ variant: 1|2, style, text }] - bong bóng chữ nổi trên ảnh
     note      đoạn tâm sự, cho phép dùng <span class="highlight">...</span>
     signature dòng ký tên cuối trang
     decor     { icon: "flower"|"heart", style } - bỏ trống thì tự luân phiên

   VỀ ẢNH:
   Có thể khai sẵn ô ảnh trước khi có file. Ô nào chưa có file thì trang tự
   ẩn đi, khi nào chép ảnh vào thư mục image/ là nó tự hiện ra, không phải
   sửa gì thêm. Tên file theo quy ước NGÀY-THÁNG-SỐ THỨ TỰ, ví dụ ngày 13/2
   thì đặt 130201.JPEG, 130202.JPEG, 130203.JPEG.
   ========================================================================= */

const STORY_PAGES = [
    {
        id: "2025-11-12",
        date: "Nov 12, 2025",
        title: "The first times",
        layout: 3,
        photos: [
            { src: "image/121101.JPEG", alt: "First date", caption: "Quán Don Chicken" },
            { src: "image/121102.JPEG", alt: "Coffee cup", caption: "Quán Don Chicken" },
        ],
        bubbles: [
            { variant: 1, style: "top: 40%; left: 15%;", text: "\"Tim anh đập nhanh khi thấy em\"" },
            { variant: 2, style: "bottom: 30%; right: 15%;", text: "\"Em cười làm tan biến mọi lo âu\"" },
        ],
        note: "Ngày 12/11/2025, mình chính thức gặp nhau lần đầu tiên sau những tin nhắn dài. Anh vẫn nhớ em mặc chiếc áo trắng bên trong, bên ngoài khoác cái áo màu xanh, <span class=\"highlight\">sự nhí nhảnh của em làm anh càng mê em nhiều hơn.</span> Chúng ta nói chuyện 2 tiếng không ngừng, như thể đã quen nhau từ kiếp trước.",
        signature: "Kỷ niệm đầu tiên ❤️",
        decor: { icon: "flower", style: "top: 10px; left: 10px;" }
    },
    {
        id: "2025-11-14",
        date: "Nov 14, 2025",
        title: "The first times",
        layout: 1,
        photos: [
            { src: "image/141101.JPEG", alt: "Phone call", caption: "Đi ăn ốc" },
            { src: "image/141102.JPEG", alt: "Night sky", caption: "Lúc em đã về" },
            { src: "image/141103.JPEG", alt: "Heart", caption: "Về rồi cũng chụp ảnh xinh cho anh" },
        ],
        note: "Tối 14/11, hôm đó mình đi ăn ốc, đi cũng khá xa. Hôm đó anh muốn năm tay em lắm nhưng mà mới quen nên còn ngại lắm, đến tận giờ anh mới được chạm vào em nà. <span class=\"highlight\">Hôm đó nhìn em cọc lắm :))) ko bít giận anh gì hong</span>, hôm đó cũng là lần đầu tiên anh chở em đi chơi, lần đầu tiên em chỉ map cho anh, anh vẫn không quên khoảnh khắc ấy, những thứ lần đầu từ em luôn làm anh vui lắm cưng nà.",
        signature: "Ăn ốc ở Bếp Mẹ Đăng ❤️",
        decor: { icon: "heart", style: "top: 15px; right: 15px;" }
    },
    {
        id: "2025-11-18",
        date: "Nov 18, 2025",
        title: "The first times",
        layout: 6,
        photos: [
            { src: "image/181101.JPEG", alt: "Restaurant", caption: "Quà của em" },
            { src: "image/181102.JPEG", alt: "Dinner", caption: "Phê La" },
            { src: "image/181103.JPEG", alt: "Candle", caption: "Nét Huế" },
        ],
        bubbles: [
            { variant: 1, style: "top: 50%; left: 20%;", text: "\"Nhìn em vô tri lúc đi ăn đi uống trông thật đáng yêu làm sao\"" },
        ],
        note: "Ngày 18/11, mình đi xem phim ở CGV Nguyễn Chí Thanh, Đi ăn ở Nét Huế, đi uống Phê La, <span class=\"highlight\">Hôm đó là lần đầu tiên anh được Bobo em.Nắm tay nữa thì phải</span> Em còn có quà tặng anh nữa, đó là 1 chiếc áo rất vừa vặn với anh, sao em chọn đồ khéo vậy, anh cảm ơn em nhiều nhaaaa",
        signature: "Buổi xem phim lần đầu ❤️",
        decor: { icon: "flower", style: "bottom: 10px; left: 10px;" }
    },
    {
        id: "2025-11-22",
        date: "Nov 22, 2025",
        title: "The first times",
        layout: 2,
        photos: [
            { src: "image/221101.JPEG", alt: "Holding hands", caption: "Khoác tay nhau thích nhờ" },
            { src: "image/221102.JPEG", alt: "Park walk", caption: "Ăn ở Aeon" },
            { src: "image/221103.JPEG", alt: "Smile", caption: "Đi chơi ở Ocean Park 2" },
        ],
        note: "22/11, em lên chỗ anh chơi lần đầu tiên. Anh dẫn em đi Ocean Park 2, rồi vào Vincom xem triển lãm. Sau đó mình cùng nhau ăn sushi, thưởng thức bánh ngọt ở Aeon, <span class=\"highlight\">rồi lại nắm tay nhau dạo bước ở vườn thiên nga Ecopark.</span> Một ngày đi chơi thật nhiều, thật vui, và cũng là lần đầu tiên em đến nơi anh sống.",
        signature: "Một ngày đầu, nhiều kỷ niệm ❤️",
        decor: { icon: "heart", style: "top: 20px; right: 20px;" }
    },
    {
        id: "2025-11-25",
        date: "Nov 25, 2025",
        title: "The first times",
        layout: 5,
        photos: [
            { src: "image/2511.JPEG", alt: "Popcorn", caption: "Ăn ở Hadilao" },
        ],
        note: "Hôm đó mình ăn lẩu Hadilao, em cũng bận vì cả bữa ăn anh thấy em toàn nhìn vào điện thoại hoyyy, ăn sang mà chẳng chụp gì cả, dỗi tkeee =)) <span class=\"highlight\">Nhưng mà nhìn em trong khuôn mặt tập trung cũng thật thú vị ^^.</span>1 lần đi chơi hiếm hoy mình ít nói =)).",
        signature: "Anh iu em ❤️",
        decor: { icon: "flower", style: "bottom: 15px; right: 15px;" }
    },
    {
        id: "2025-11-30",
        date: "Nov 30, 2025",
        title: "The first times",
        layout: 4,
        photos: [
            { src: "image/3011.JPEG", alt: "Nervous", caption: "Hôm em đi chợ Mơ" },
        ],
        bubbles: [
            { variant: 2, style: "top: 40%; right: 10%;", text: "\"Hôm đấy cũng chơi vài chỗ mà ko chụp ảnh gì cả\"" },
        ],
        note: "Hôm đó anh đưa mẹ anh lên Hà Nội để làm mi, em cũng lên chợ Mơ để tham gia cái gì của Kocca ý, thấy cũng gần nên anh hẹn gặp em, mình ăn ở Jolibee, sau đó uống nước ở 1 quán ven đường <span class=\"highlight\">Em có nhờ là hôm đó em đòi ko bobo, giữ khoảng cách không\".</span> Nhưng sự nổi dậy của anh nên cuối cùng mình lại nắm tay, bobo trở lại :))",
        signature: "Anh yêu em nhiều lắm ❤️",
        decor: { icon: "heart", style: "top: 10px; left: 10px;" }
    },
    {
        id: "2025-12-08",
        date: "Dec 8, 2025",
        title: "The first times",
        layout: 7,
        photos: [
            { src: "image/81201.JPEG", alt: "Road trip" },
            { src: "image/81202.JPEG", alt: "Mountains" },
            { src: "image/81203.JPEG", alt: "Together", caption: "Ăn ở Pizza 4p" },
        ],
        note: "Bình thường phải có sự kiện gì anh mới ăn ở đây, hôm đó có sự kiện gì em nhỉ, hình như chẳng có sự kiện gì cả <span class=\"highlight\">Vì từ khi yêu em, mỗi lần gặp nhau đều là sự kiện đẹp rồi,</span> Chẳng cần phải có dịp gì đặc biệt mới dẫn em ăn ngon vì lúc nào với anh cũng là ngày đặc biệt naee",
        signature: "Em là ngoại lệ của anh ❤️",
        decor: { icon: "flower", style: "bottom: 10px; right: 10px;" }
    },
    {
        id: "2025-12-10",
        date: "Dec 10, 2025",
        title: "The first times",
        layout: 2,
        photos: [
            { src: "image/1012.JPEG", alt: "Surprise", caption: "Ăn bún chả" },
        ],
        note: "Hôm đó anh rủ em lên ăn bún chả ở chỗ anh, sau đó mình vào một quán coffee để uống nước, buổi tối mình vào Skylake ăn cháo vì anh nhớ hôm đó em đến tháng <span class=\"highlight\">Anh luôn lo lắng cho em mỗi khi có vấn đề về sức khỏe.</span> Nhớ giữ gìn sức khỏe thật tốt nhé, không phải lúc nào anh cũng bên cạnh em cho tới lúc mình cưới nhau naee",
        signature: "Lúc nào cũng quan tâm em❤️",
        decor: { icon: "heart", style: "top: 15px; right: 15px;" }
    },
    {
        id: "2025-12-19",
        date: "Dec 19, 2025",
        title: "The first times",
        layout: 3,
        photos: [
            { src: "image/1912.JPEG", alt: "Family dinner", caption: "Dáng vẻ của em khi làm cây thông cho anh" },
            { src: "image/191202.JPEG", alt: "Nervous" },
            { src: "image/191203.JPEG", alt: "Accepted", caption: "Quà bánh do em tự làm" },
        ],
        bubbles: [
            { variant: 1, style: "bottom: 25%; left: 15%;", text: "\"1 hôm mà anh nhận được nhiều quà của em ghiaa\"" },
        ],
        note: "Ngày hôm ấy em rủ anh đi làm cây thông Noel, sau đó lúc anh đi làm về, mình đi xem phim avatar, cuối buổi em có tặng anh 1 món quà mà anh rất rất thích, đó là những chiếc bánh cute do em tự tay làm, thích đến nỗi cả nhà anh đều ăn hết luôn <span class=\"highlight\">Chưa từng có ai làm bánh thủ công tặng anh cả.</span> Thật hạnh phúc khi được em làm điều ấy cho anh .",
        signature: "Anh luôn trân trọng những món quà em gửi ❤️",
        decor: { icon: "flower", style: "top: 10px; left: 10px;" }
    },
    {
        id: "2025-12-21",
        date: "Dec 21, 2025",
        title: "The first times",
        layout: 2,
        photos: [
            { src: "image/211201.JPEG", alt: "Christmas tree", caption: "Highland coffee" },
            { src: "image/211202.JPEG", alt: "Gifts", caption: "Ảnh chúng taaa" },
            { src: "image/211203.JPEG", alt: "Together", caption: "Ăn ramen" },
        ],
        note: "Vì nhớ em quá nên ngày hôm sau anh đi bus ra chỗ em luôn, mình hẹn nhau ở highland, sau đó đi ăn Ramen ở gần chỗ em ở <span class=\"highlight\">Cũng là lần đầu tiên anh đi bus từ nhà ra chỗ em</span> và anh biết mình đang có món quà tuyệt vời nhất: chính là em.",
        signature: "Cảm thấy ấm áp ❤️",
        decor: { icon: "heart", style: "top: 20px; right: 20px;" }
    },
    {
        id: "2025-12-25",
        date: "Dec 25, 2025",
        title: "The first times",
        layout: 6,
        photos: [
            { src: "image/251201.JPEG", alt: "Party", caption: "Ăn ở phố cổ" },
            { src: "image/251202.JPEG", alt: "Friends", caption: "Tiệm handmade" },
            { src: "image/251203.JPEG", alt: "Celebration", caption: "Nhà thờ" },
        ],
        bubbles: [
            { variant: 2, style: "top: 60%; right: 20%;", text: "Giáng sinh đầu tiên bên em" },
        ],
        note: "Hôm đó là Giáng Sinh, ăn xin nghỉ làm buổi chiều để đi chơi Noel cùng em, mình đi ăn bún ở Phố Cổ, sau đó đi xem cửa hàng handmade, đi Starbuck, đi nhà thờ và chúa đã nhìn thấy tình yêu của chúng ta đóaaa <span class=\"highlight\">lòng anh tràn ngập niềm hạnh phúc và tự hào.</span> Anh biết mình đã chọn đúng người.",
        signature: "Chia sẻ hạnh phúc ❤️",
        decor: { icon: "flower", style: "bottom: 10px; left: 10px;" }
    },
    {
        id: "2025-12-26",
        date: "Dec 26, 2025",
        title: "The first times",
        layout: 5,
        photos: [
            { src: "image/2612.JPEG", alt: "Beach night" },
            { src: "image/261202.JPEG", alt: "Stars", caption: "Nhớ em quá nên lại đòi gặp em" },
        ],
        note: "Hôm đó mình đi ăn Mỳ cay ở gần chỗ em ở, hôm đó chắc cũng thân hơn rồi nên là yên bình em nhỉ <span class=\"highlight\">Em ăn cay không bằng anh .</span> Anh ăn cấp độ 4, em ăn có cấp độ 1 bọ =)).",
        signature: "Bát mỳ cay ngon nhất là khi ăn với em ❤️",
        decor: { icon: "heart", style: "top: 15px; right: 15px;" }
    },
    {
        id: "2025-12-27",
        date: "Dec 27, 2025",
        title: "The first times",
        layout: 4,
        photos: [
            { src: "image/2712.JPEG", alt: "Cooking", caption: "Ăn ở Aeon" },
        ],
        bubbles: [
            { variant: 1, style: "top: 40%; left: 10%;", text: "\"Hôm đó k chụp nhiều ảnh lắm, em còn nhớ hôm đó diễn ra những gì ko :)))\"" },
        ],
        note: "Hôm đó em đi xe bus sang chỗ anh, đó là lần đầu tiên em vào nhà anh trên Gia Lâm, em có biết hôm đó mình bobo nhau mạnh đến nỗi tím môi ko:))), sau đó em dỗi anh, anh dẫn em đi mua túi, mua áo. <span class=\"highlight\">và đó cũng là lần đầu tiên mình hôn nhau sâu đến vậy</span> kể từ lần đó, anh nghiện em không lối thoát",
        signature: "Ước gì hôm nào cũng được như hôm đó ❤️",
        decor: { icon: "flower", style: "bottom: 10px; right: 10px;" }
    },
    {
        id: "2025-12-29",
        date: "Dec 29, 2025",
        title: "The first times",
        layout: 7,
        photos: [
            { src: "image/291201.JPEG", alt: "Dreams", caption: "Quán mỳ tay to" },
            { src: "image/291202.JPEG", alt: "Future", caption: "1 quán nước xinh" },
        ],
        note: "Hôm đó mình ăn nhiều thật ý, anh ăn no tới nỗi phải đi vệ sinh cho bớt no:))), em cũng ăn tốt nhưng mà cuối cùng thức ăn vẫn thừa <span class=\"highlight\">Mình hợp nhau chuyện ăn uống em nhỉ.</span> Chưa thấy mình ko ăn được ít bao giờ cả",
        signature: "Ăn em là ngon nhất:)))❤️",
        decor: { icon: "heart", style: "top: 10px; left: 10px;" }
    },
    {
        id: "2026-01-05",
        date: "Jan 5, 2026",
        title: "The first times",
        layout: 3,
        photos: [
            { src: "image/5101.JPEG", alt: "New Year" },
            { src: "image/5102.JPEG", alt: "Countdown", caption: "Mỳ bay" },
            { src: "image/5103.JPEG", alt: "Kiss", caption: "Quán nước gần ktx em" },
        ],
        note: "Hôm đó mình đi ăn mỳ bay ở một quán em xem được trên instagram, đồ ăn ngon em nhỉ <span class=\"highlight\">Hôm đó anh bị ốm, nhưng vẫn có thể đi chơi được vì nhìn em là anh thấy khỏe hơn ý</span> .",
        signature: "Ốm nhưng được gặp em vẫn chọn đi chơi nàaa ❤️",
        decor: { icon: "flower", style: "top: 15px; right: 15px;" }
    },
    {
        id: "2026-01-06",
        date: "Jan 6, 2026",
        title: "The first times",
        layout: 3,
        photos: [
            { src: "image/6101.JPEG", alt: "Morning", caption: "Ăn mỳ cay" },
            { src: "image/6102.JPEG", alt: "Coffee", caption: ":))))" },
            { src: "image/6103.JPEG", alt: "Goodnight", caption: "The gardenia" },
        ],
        bubbles: [
            { variant: 2, style: "bottom: 30%; right: 15%;", text: "\"Ăn nhiều nhờ, trưa ăn mỳ cay, tối ăn đồ Hàn =))\"" },
        ],
        note: "Buổi trưa hôm đó anh nhớ em quá nên giờ nghỉ anh phóng xe ra chỗ em lun, buổi tối cũng tìm 1 quán Hàn gần chỗ em để ăn nà, đồ ăn rất ngonnn <span class=\"highlight\">Yêu em quá :))) anh không biết gõ thêm câu gì nữa ngoài việc chỉ nghĩ về em.</span> em làm cuộc sống anh trọn vẹn hơn bao giờ hết.",
        signature: "I love you ❤️",
        decor: { icon: "heart", style: "top: 10px; left: 10px;" }
    },
    {
        id: "2026-01-07",
        date: "Jan 7, 2026",
        title: "The first times",
        layout: 2,
        photos: [
            { src: "image/7101.JPEG", alt: "Challenge", caption: "Ăn bún bòaaa" },
        ],
        note: "Lại là 1 hôm nhớ em nên buổi trưa tranh thủ ra gặp em <span class=\"highlight\">Có vẻ anh ngày càng thích giờ nghỉ ra chỗ em vào buổi trưa hơn ròi ý.</span>",
        signature: "Sức mạnh tình yêu ❤️",
        decor: { icon: "flower", style: "bottom: 10px; left: 10px;" }
    },
    {
        id: "2026-01-08",
        date: "Jan 8, 2026",
        title: "3-month anniversary",
        layout: 6,
        photos: [
            { src: "image/8101.JPEG", alt: "2 months", caption: "Khrua Ban Thai" },
            { src: "image/8102.JPEG", alt: "Celebration", caption: "Ny anhhh" },
            { src: "image/8103.JPEG", alt: "Love", caption: "Vẫn là ny anh" },
        ],
        bubbles: [
            { variant: 1, style: "top: 50%; left: 20%;", text: "\"Mỗi ngày đều yêu em hơn\"" },
        ],
        note: "Kỷ niệm 3 tháng quen nhau, chúng ta chỉ đơn giản là đi ăn, lần này là đi ăn đồ Thái, chúng ta đã ăn đồ Nhật, Hàn, Việt, Thái, Ý rùi em nhỉ <span class=\"highlight\">Anh ngạc nhiên khi nhận ra chỉ 3 tháng mà em đã trở thành một phần không thể thiếu.</span> Anh hứa sẽ làm em cười mỗi ngày.",
        signature: "60 ngày hạnh phúc ❤️",
        decor: { icon: "heart", style: "top: 20px; right: 20px;" }
    },
    {
        id: "2026-01-16",
        date: "Jan 16, 2026",
        layout: 5,
        photos: [
            { src: "image/160101.JPEG", alt: "Sick", caption: "Công viên cầu giấy" },
            { src: "image/160102.JPEG", alt: "Medicine", caption: "vợ chồng :))" },
            { src: "image/160103.JPEG", alt: "Care", caption: "The Tokyo Deli" },
        ],
        note: "Hôm đó mình dẫn nhau ra công viên Cầu Giấy, mình đi bộ 1 vòng, nghịch mấy cái máy ở đó, sau đó anh còn bảo là sau anh đưa em đi lên ocp2 có công viên đẹp hơn, sau đó mình đi ăn đồ Nhật ở Tokyo Deli <span class=\"highlight\">Hôm đó thấy em ghen vì anh cho nhân viên sđt :))</span> Biết ghen chứng tỏ yêu anh nhiều lắm đúng honggg.",
        signature: "Sarangheyoo ❤️",
        decor: { icon: "flower", style: "bottom: 15px; right: 15px;" }
    },
    {
        id: "2026-01-17",
        date: "Jan 17, 2026",
        title: "The first time",
        layout: 4,
        photos: [
            { src: "image/170101.JPEG", alt: "Sunset", caption: "Em chọn món" },
            { src: "image/170102.JPEG", alt: "Silhouette", caption: "Đồ ăn lên nèee" },
            { src: "image/170103.JPEG", alt: "Peace", caption: "Healthy nhờ" },
        ],
        bubbles: [
            { variant: 2, style: "top: 40%; right: 10%;", text: "Hôm đó mình còn đi đạp vịt nữa đó, anh k có chụp ảnh :))" },
        ],
        note: "Chiều 17/1, chúng ta cùng đạp vịt ở hồ Trúc Bạch. Đây cũng là trải nghiệm đạp vịt đầu tiên với ny, sau đó mình ăn buffe chay ở Sadhu, cũng chill và okela phết. <span class=\"highlight\">Thực sự là anh có rất nhiều cái \"lần đầu\" với em.</span> Có lẽ ông trời đã định duyên 2 ta rồi ư.",
        signature: "Nhớ em lắm ❤️",
        decor: { icon: "heart", style: "top: 10px; left: 10px;" }
    },
    {
        id: "2026-01-26",
        date: "Jan 26, 2026",
        title: "The first times",
        layout: 6,
        photos: [
            { src: "image/260101.JPEG", alt: "Future plans", caption: "Let's sushi" },
            { src: "image/260102.JPEG", alt: "Travel", caption: "Ny anhhh" },
        ],
        note: "Hôm đấy mình ăn sushi ở quán gần chỗ em, cũng là hôm em giận anh một số chuyện, hơn hết anh xin lỗi em nhiều <span class=\"highlight\">Sự kiện hôm ấy cũng là lúc anh quyết định muốn có danh phận với em hơn bao giờ hết.</span> Anh quyết định phải làm ny em trong ngày hôm sau, đọc trang tiếp theo nhé.",
        signature: "Tương lai chung đôi ❤️",
        decor: { icon: "heart", style: "top: 15px; right: 15px;" }
    },
    {
        id: "2026-01-26-2",
        date: "Jan 26, 2026",
        title: "The first times",
        layout: 2,
        photos: [
            { src: "image/3201.JPEG", alt: "Future plans", caption: "Phú Cường" },
        ],
        note: "Một ngày thật đặc biệt, khi mình đi ăn và vô tình chọn đúng quán đang tổ chức tiệc YEP. <span class=\"highlight\">Cũng chính là ngày đầu tiên mình cùng nhau đi ăn kể từ khi có danh phận.</span>",
        signature: "I love you ❤️",
        decor: { icon: "heart", style: "top: 15px; right: 15px;" }
    },
    {
        id: "2026-01-27",
        date: "Jan 27, 2026",
        title: "Confession day",
        layout: 3,
        note: "Đến ngày 27/1, anh nhận ra tình cảm dành cho em đã đủ lớn để trở thành một danh phận rõ ràng. Trưa hôm ấy anh vội vàng đặt một bó hoa, tối thì ra trường đón em đi ăn. Thật ra hôm trước em còn giận anh, mà hôm sau anh đã tỏ tình, nên anh hiểu để em đồng ý ngay là điều không hề dễ. Nhưng <span class=\"highlight\">cảm xúc trong anh lúc đó mạnh mẽ quá, anh chỉ muốn mình phải có danh phận ngay trong chính ngày hôm ấy.</span> Cuối cùng, em cũng đồng ý làm người yêu của anh. Một ngày thật đặc biệt – mọi thứ đều diễn ra rất đột ngột: tỏ tình bất ngờ, có do dự, có sự trỗi dậy của cảm xúc, và rồi mình chọn ở bên nhau. Đó là khoảnh khắc đặc biệt nhất trong đời anh, một kỷ niệm khó quên để sau này mình có thật nhiều điều để kể. Từ ngày ấy, khi mình chính thức có danh phận, anh thấy mình vui hơn, mạnh dạn hơn, và có thể yêu thương em trọn vẹn mà không còn e ngại gì nữa.",
        signature: "Hạnh phúc mỗi ngày ❤️",
        decor: { icon: "flower", style: "top: 10px; left: 10px;" }
    },
    {
        id: "2026-02-07",
        date: "Feb 7, 2026",
        title: "Sinh nhật sớm của em",
        layout: 5,
        photos: [
            { src: "image/070201.JPEG", alt: "Phòng riêng view hồ", caption: "Phòng riêng view hồ" },
            { src: "image/070202.JPEG", alt: "Sinh nhật sớm của em", caption: "Sinh nhật sớm của em" },
            { src: "image/070203.JPEG", alt: "Công viên buổi tối", caption: "Công viên buổi tối" },
        ],
        note: "Hôm ấy anh tổ chức sinh nhật sớm cho em iu, cũng là ngày anh tỏ tình em lần thứ hai — theo đúng \"nguyện vọng\" của em nữa chứ :)))<br><br>Đến giờ nghĩ lại anh vẫn thấy hôm đó thật đẹp. Quán ăn gần như chẳng có ai nên hai đứa mình được ngồi riêng trong một căn phòng có view nhìn ra hồ, yên tĩnh và chill vô cùng. Sau bữa tối, mình lại rủ nhau ra công viên gần đó, ngồi cạnh nhau rồi kể đủ thứ chuyện trên trời dưới đất.<br><br>Chẳng có điều gì quá đặc biệt xảy ra, chỉ là hai đứa ngồi bên nhau trong một buổi tối rất bình thường. <span class=\"highlight\">Nhưng chính những khoảnh khắc bình yên như thế, anh lại thấy quý vô cùng.</span> ❤️",
        signature: "Sinh nhật sớm của em iu ❤️",
        decor: { icon: "flower", style: "bottom: 15px; right: 15px;" }
    },
    {
        id: "2026-02-13",
        date: "Feb 13, 2026",
        title: "Early Valentine",
        layout: 3,
        photos: [
            { src: "image/130201.JPEG", alt: "Khrua Baan Thai", caption: "Khrua Baan Thai" },
            { src: "image/130202.JPEG", alt: "Sân tulip đỏ", caption: "Sân tulip đỏ" },
            { src: "image/130203.JPEG", alt: "Bó cẩm tú cầu tím", caption: "Bó cẩm tú cầu tím" },
        ],
        note: "Hôm ấy anh lên chơi với em nhân dịp Valentine. Hai đứa định đi ăn đồ Thái, nhưng quán đầu tiên đến thì hết bàn nên cuối cùng lại chuyển sang Khrua Baan Thai.<br><br>Trời hôm đó mưa nhẹ một lúc rồi tạnh. Ăn xong, mình đi uống cà phê ở một quán có cả khoảng sân đầy tulip đỏ rất xinh. Hôm ấy anh còn quay được tận hai cái video TikTok nữa cơ :)))<br><br>Sau đó anh dẫn em đi chợ gần đó để mua cho em một bó cẩm tú cầu tím xinh xinh. Rồi hai đứa lại đi lấy đồ hải sản để tối nhà em ăn lẩu.<br><br><span class=\"highlight\">Một ngày chẳng cần kế hoạch gì quá cầu kỳ, cứ đi hết chỗ này sang chỗ khác cùng nhau thôi mà vui đến thế.</span>",
        signature: "Valentine của chúng mình ❤️",
    },
    {
        id: "2026-02-22",
        date: "Feb 22, 2026",
        title: "A whole day for us",
        layout: 2,
        photos: [
            { src: "image/220201.JPEG", alt: "Homestay Ocean Park", caption: "Homestay Ocean Park" },
            { src: "image/220202.JPEG", alt: "Bún tôm Hải Phòng", caption: "Bún tôm Hải Phòng" },
            { src: "image/220203.JPEG", alt: "Cả ngày bên nhau", caption: "Cả ngày bên nhau" },
        ],
        note: "Hôm đó anh rủ em về Ocean Park, thuê homestay để hai đứa có thể dành cả ngày bên nhau.<br><br>Mình cùng xuống Aeon mua nguyên liệu rồi về nấu ăn. Hôm ấy anh nấu bún tôm Hải Phòng cho em. Thực ra công thức anh mới ngồi xem từ tối hôm trước thôi :))) may mà kết quả cuối cùng cũng không \"failed\".<br><br>Anh còn bắt em ngồi tuốt rau ngót phụ anh nữa. <span class=\"highlight\">Hai đứa vừa nấu vừa trêu nhau, căn phòng nhỏ mà lúc nào cũng đầy tiếng cười.</span><br><br>Sau đó chẳng cần làm gì nhiều nữa, chỉ cần được ở cạnh nhau, nghỉ ngơi, nói chuyện rồi cuối ngày anh đưa em về. Một ngày rất giản dị nhưng lại là kiểu ngày mà anh nghĩ sau này mình sẽ nhớ rất lâu.",
        signature: "Bữa cơm đầu tiên anh nấu cho em ❤️",
    },
    {
        id: "2026-02-28",
        date: "Feb 28, 2026",
        title: "Royal City",
        layout: 4,
        photos: [
            { src: "image/280201.JPEG", alt: "Bowling", caption: "Bowling" },
            { src: "image/280202.JPEG", alt: "Máy đấm", caption: "Máy đấm" },
            { src: "image/280203.JPEG", alt: "Royal City", caption: "Royal City" },
        ],
        note: "Hôm đó hai đứa dẫn nhau đi Royal City.<br><br>Mình chơi bowling, chơi máy đấm rồi lang thang thử thêm vài trò khác nữa. Cuối buổi hình như hai đứa còn cãi nhau một trận thì phải :)))<br><br>Nhưng nghĩ lại, có lẽ yêu nhau đâu phải lúc nào cũng chỉ toàn những ngày vui vẻ. Có lúc giận nhau, có lúc chẳng hiểu nhau, <span class=\"highlight\">nhưng cuối cùng hai đứa vẫn lựa chọn ở lại.</span><br><br>Vậy nên em bớt bướng một chút nha :))) Anh cũng sẽ cố gắng hiểu em nhiều hơn.",
        signature: "Giận rồi lại thương ❤️",
    },
    {
        id: "2026-03-01",
        date: "Mar 1, 2026",
        title: "Old quarter",
        layout: 5,
        photos: [
            { src: "image/010301.JPEG", alt: "Tokyo Matcha", caption: "Tokyo Matcha" },
            { src: "image/010302.JPEG", alt: "Bún chả trong ngõ", caption: "Bún chả trong ngõ" },
            { src: "image/010303.JPEG", alt: "Lotte Tây Hồ", caption: "Lotte Tây Hồ" },
        ],
        note: "Hôm ấy hai đứa rủ nhau lên phố cổ chơi.<br><br>Buổi sáng mình uống Tokyo Matcha. Anh nhớ lúc ấy em vừa uống nước vừa tất bật tìm quà cho sếp người Hàn chuẩn bị đi Hong Kong thì phải. Sếp hỏi nên mua gì nên em ngồi tìm đủ thứ, từ cà phê đến mấy món khác nữa… đoạn này anh không nhớ hết rồi :)))<br><br>Buổi trưa mình chui vào một quán bún chả trong ngõ ở phố cổ. Quán nhỏ thôi nhưng ăn cũng khá ngon.<br><br>Sau đó hai đứa sang Lotte Tây Hồ. Hình như hôm ấy anh còn dẫn em vào YSL xem đồ. Tiếc là những mẫu đẹp lúc đó hết mất rồi, nên anh chỉ biết chụp lại.<br><br><span class=\"highlight\">Không mua được hôm ấy thì để dành đó. Biết đâu một ngày nào đó anh lại mua đúng món ấy cho em.</span>",
        signature: "Một ngày lang thang phố cổ ❤️",
    },
    {
        id: "2026-03-04",
        date: "Mar 4, 2026",
        title: "An ordinary evening",
        layout: 6,
        photos: [
            { src: "image/040301.JPEG", alt: "Bữa tối sau giờ làm", caption: "Bữa tối sau giờ làm" },
            { src: "image/040302.JPEG", alt: "Quán đồ Trung Á", caption: "Quán đồ Trung Á" },
        ],
        note: "Một ngày đi làm rất bình thường.<br><br>Anh đi làm cả ngày rồi tối mới gặp em. Hôm ấy anh bảo tự nhiên thèm đồ Trung Quốc, thế nào cuối cùng lại dẫn em đi ăn đồ Trung Á :)))<br><br>Ăn xong anh đưa em về ký túc xá.<br><br>Có những buổi hẹn chẳng cần có hoạt động gì đặc biệt. <span class=\"highlight\">Chỉ đơn giản là sau một ngày mệt mỏi vẫn muốn gặp nhau, cùng ăn một bữa tối rồi đưa nhau về.</span> Với anh, như vậy cũng đã đủ vui rồi.",
        signature: "Ngày thường có em cũng thành đặc biệt ❤️",
    },
    {
        id: "2026-03-08",
        date: "Mar 8, 2026",
        title: "Happy Women's Day",
        layout: 7,
        photos: [
            { src: "image/080301.JPEG", alt: "Bó cẩm tú cầu 8/3", caption: "Bó cẩm tú cầu 8/3" },
            { src: "image/080302.JPEG", alt: "Long Wang", caption: "Long Wang" },
            { src: "image/080303.JPEG", alt: "Matcha gần ký túc xá", caption: "Matcha gần ký túc xá" },
        ],
        note: "Chúc mừng ngày Quốc tế Phụ nữ của em. <span class=\"highlight\">Anh mong em lúc nào cũng xinh đẹp, vui vẻ và ngày càng thành công trong công việc nhaaa.</span><br><br>Hôm ấy buổi trưa em từ quê lên. Anh đi xe bus lên gặp em, mang theo một bó cẩm tú cầu và cả chiếc sạc dự phòng đôi anh mua cho em.<br><br>Hai đứa ăn Long Wang, sau đó lại đi uống matcha ở quán gần ký túc xá của em. Cuối ngày anh lại lóc cóc bắt bus về.<br><br>Đi một quãng đường dài chỉ để gặp em vài tiếng, ăn với nhau một bữa, uống với nhau một cốc nước. Nhưng hồi đó anh chưa bao giờ thấy những chuyến đi như thế là phiền cả.",
        signature: "8/3 của riêng em ❤️",
    },
    {
        id: "2026-03-10",
        date: "Mar 10, 2026",
        title: "The first night",
        layout: 1,
        photos: [
            { src: "image/100301.JPEG", alt: "Bữa tối", caption: "Bữa tối" },
            { src: "image/100302.JPEG", alt: "Highlands", caption: "Highlands" },
        ],
        note: "Lại là một ngày đi làm bình thường.<br><br>Buổi tối mình gặp nhau, đi ăn rồi ghé Highlands ngồi chơi. Ban đầu anh định về, nhưng lúc ấy cũng khuya rồi nên cuối cùng em giữ anh ở lại.<br><br><span class=\"highlight\">Đó cũng là lần đầu tiên hai đứa ở cạnh nhau suốt một đêm.</span><br><br>Anh nghĩ đó là một trong những cột mốc mà có lẽ cả hai sẽ còn nhớ rất lâu — vừa ngại ngùng, vừa vui, vừa có rất nhiều cảm xúc khó diễn tả thành lời.",
        signature: "Đêm đầu tiên có em bên cạnh ❤️",
    },
    {
        id: "2026-03-15",
        date: "Mar 15, 2026",
        title: "Tulip season",
        layout: 2,
        photos: [
            { src: "image/150301.JPEG", alt: "Công viên Hoàng Hoa Thám", caption: "Công viên Hoàng Hoa Thám" },
            { src: "image/150302.JPEG", alt: "Tulip của em", caption: "Tulip của em" },
            { src: "image/150303.JPEG", alt: "Chậu tulip sáng 16/3", caption: "Chậu tulip sáng 16/3" },
        ],
        note: "Hôm ấy mình đi chơi ở công viên Hoàng Hoa Thám.<br><br>Sau đó anh dẫn em đi mua tulip. <span class=\"highlight\">Nhìn thấy em vui vẻ khi ôm hoa trên tay, tự nhiên anh cũng thấy hạnh phúc theo.</span> Có lẽ một trong những điều anh thích nhất là nhìn thấy em vui vì những thứ bé xíu như vậy.<br><br>Buổi tối hai đứa ăn Don Chicken gần ký túc xá của em.<br><br>Sáng hôm sau, ngày 16/3, anh lại mua thêm cho em một chậu tulip nữa. Tối hôm ấy mình đi ăn bún chả Sinh Từ gần ký túc xá.<br><br>Tiếc là bữa đó anh lại quên không chụp hình :v Nhưng thôi, có những kỷ niệm không có ảnh thì mình giữ trong đầu vậy.",
        signature: "Mùa tulip của em ❤️",
    },
    {
        id: "2026-03-21",
        date: "Mar 21, 2026",
        title: "Valley of flowers",
        layout: 3,
        photos: [
            { src: "image/210301.JPEG", alt: "Thung lũng hoa Hồ Tây", caption: "Thung lũng hoa Hồ Tây" },
            { src: "image/210302.JPEG", alt: "Anh chụp cho em", caption: "Anh chụp cho em" },
            { src: "image/210303.JPEG", alt: "Chợ hoa Quảng Bá", caption: "Chợ hoa Quảng Bá" },
        ],
        note: "Hôm đó hai đứa đi Thung lũng hoa Hồ Tây.<br><br>Mình đi qua từng khu vườn, ngắm hoa, ngắm đèn rồi cứ thong thả đi cạnh nhau. Có lúc em còn gọi điện về cho gia đình nữa.<br><br>Anh thì đảm nhận nhiệm vụ chụp ảnh cho em. Hôm ấy thấy một đôi khác đang chụp ảnh cho nhau đẹp quá, thế là em quay sang bảo anh: \"Anh học tập người ta cách chụp ảnh cho người yêu đi.\" :)))<br><br>Sau đó hai đứa lại kéo nhau sang chợ hoa Quảng Bá.<br><br>Thật ra mình chẳng nhất thiết phải mua gì. <span class=\"highlight\">Chỉ cần cùng nhau đi giữa một nơi đầy hoa thôi cũng đã thấy vui rồi, đúng không em?</span>",
        signature: "Thung lũng hoa hồ Tây ❤️",
    },
    {
        id: "2026-03-25",
        date: "Mar 25, 2026",
        title: "Two cups of Highlands",
        layout: 4,
        photos: [
            { src: "image/250301.JPEG", alt: "Hai cốc Highlands", caption: "Hai cốc Highlands" },
            { src: "image/250302.JPEG", alt: "Quán Thái ở Nhân Chính", caption: "Quán Thái ở Nhân Chính" },
        ],
        note: "Hôm ấy cũng là một ngày đi làm bình thường.<br><br>Anh nhớ em đi cùng công ty cũ xuống Thái Nguyên thì phải. Trên đường về em còn mua hai cốc Highlands cho anh.<br><br>Buổi tối mình gặp nhau rồi đi ăn ở một quán Thái bên Nhân Chính. Sau đó anh lại đưa em về ký túc xá.<br><br>Những ngày bình thường như thế xuất hiện rất nhiều trong câu chuyện của hai đứa mình. Nhưng nghĩ lại, <span class=\"highlight\">chính chúng mới là phần lớn tình yêu — không phải những dịp thật đặc biệt, mà là việc giữa một ngày bận rộn vẫn nhớ đến nhau.</span>",
        signature: "Cảm ơn em vì luôn nghĩ tới anh ❤️",
    },
    {
        id: "2026-04-01",
        date: "Apr 1, 2026",
        title: "Grill night",
        layout: 5,
        photos: [
            { src: "image/010401.JPEG", alt: "Nướng Huỳnh Thúc Kháng", caption: "Nướng Huỳnh Thúc Kháng" },
            { src: "image/010402.JPEG", alt: "Tai nạn nhỏ", caption: "Tai nạn nhỏ" },
        ],
        note: "Hôm đó em bắt bus ra chỗ anh.<br><br>Anh dẫn em đi ăn nướng ở Huỳnh Thúc Kháng. Em còn nhớ không, hôm ấy anh đang ngồi yên lành thì bà chị bàn đằng sau làm đổ cả thịt sang chỗ anh :)))))<br><br><span class=\"highlight\">Một tai nạn nhỏ nhưng nhờ thế lại thành chuyện để sau này nhắc lại vẫn buồn cười.</span>",
        signature: "Kỷ niệm dở khóc dở cười ❤️",
    },
    {
        id: "2026-04-03",
        date: "Apr 3, 2026",
        title: "Ốc, round two",
        layout: 6,
        photos: [
            { src: "image/030401.JPEG", alt: "Ốc Bếp Mẹ Đăng", caption: "Ốc Bếp Mẹ Đăng" },
            { src: "image/030402.JPEG", alt: "Quán tủ của anh", caption: "Quán tủ của anh" },
        ],
        note: "Hai đứa đi ăn ốc lần thứ hai ở Bếp Mẹ Đăng.<br><br>Quán tủ của anh rồi nên cứ nghĩ đến ăn ốc là anh chẳng muốn mất công tìm quán khác nữa :)))<br><br><span class=\"highlight\">Có một vài nơi tự nhiên dần trở thành \"quán của hai đứa mình\" như thế.</span>",
        signature: "Vẫn là Bếp Mẹ Đăng ❤️",
    },
    {
        id: "2026-04-05",
        date: "Apr 5, 2026",
        title: "Indian food",
        layout: 7,
        photos: [
            { src: "image/050401.JPEG", alt: "Quán Ấn Độ toà S2.10", caption: "Quán Ấn Độ toà S2.10" },
            { src: "image/050402.JPEG", alt: "Thử một lần cho biết", caption: "Thử một lần cho biết" },
        ],
        note: "Hôm ấy em lên nhà anh chơi.<br><br>Em bảo muốn ăn đồ Ấn Độ nên anh dẫn em đến quán ở tòa S2.10.<br><br>Hai đứa háo hức thử cho biết…<br><br><span class=\"highlight\">Và sau khi ăn xong thì có lẽ thống nhất rằng trải nghiệm một lần trong đời là đủ rồi ha :)))</span>",
        signature: "Thử một lần cho biết ❤️",
    },
    {
        id: "2026-04-06",
        date: "Apr 6, 2026",
        title: "Our first photobooth",
        layout: 1,
        photos: [
            { src: "image/060401.JPEG", alt: "Quán Onjeong", caption: "Quán Onjeong" },
            { src: "image/060402.JPEG", alt: "Photobooth đầu tiên", caption: "Photobooth đầu tiên" },
            { src: "image/060403.JPEG", alt: "Quà ngày đàn ông", caption: "Quà ngày đàn ông" },
        ],
        note: "Một ngày đi làm bình thường khác.<br><br>Buổi tối em mời anh đi ăn và anh chọn quán Onjeong gần công ty.<br><br>Ăn xong hai đứa rủ nhau đi chụp photobooth. Với anh hôm ấy khá đặc biệt, vì đó là lần đầu tiên trong đời anh chụp photobooth.<br><br><span class=\"highlight\">Một việc rất bình thường với nhiều người nhưng lại trở thành một kỷ niệm đáng nhớ của anh chỉ vì người đứng cạnh anh trong những tấm ảnh ấy là em.</span><br><br>À, em còn tặng anh dung dịch vệ sinh nam nhân ngày đàn ông nữa chứ :))) Đúng là quà của em lúc nào cũng rất… thực tế.",
        signature: "Tấm hình đầu tiên của chúng mình ❤️",
    },
    {
        id: "2026-04-09",
        date: "Apr 9, 2026",
        title: "Sườn Mười",
        layout: 2,
        photos: [
            { src: "image/090401.JPEG", alt: "Sườn Mười", caption: "Sườn Mười" },
            { src: "image/090402.JPEG", alt: "Miếng sườn to đùng", caption: "Miếng sườn to đùng" },
        ],
        note: "Hôm ấy anh hỏi: \"Em muốn ăn gì?\"<br><br>Em bảo muốn ăn Sườn Mười.<br><br>Anh cũng chưa ăn ở đó bao giờ nên cuối cùng hai đứa cùng nhau đi thử. Ngồi ngoạm mấy miếng sườn to đùng mà thấy cũng ngon phết hehehe.<br><br><span class=\"highlight\">Lại thêm một quán mới được hai đứa cùng nhau khám phá.</span>",
        signature: "Em thích gì anh chiều đó ❤️",
    },
    {
        id: "2026-04-12",
        date: "Apr 12, 2026",
        title: "Cake and stories",
        layout: 3,
        photos: [
            { src: "image/120401.JPEG", alt: "Quán nước gần chỗ em", caption: "Quán nước gần chỗ em" },
            { src: "image/120402.JPEG", alt: "Bánh ngọt", caption: "Bánh ngọt" },
            { src: "image/120403.JPEG", alt: "Ngồi kể chuyện", caption: "Ngồi kể chuyện" },
        ],
        note: "Hôm ấy anh đến chỗ em và hai đứa hẹn nhau ở một quán nước gần đó.<br><br>Quán khá xinh, có cả bánh nên hai đứa ngồi chọn nước, chọn bánh rồi kiếm một góc ngồi cạnh nhau.<br><br>Sau đó chẳng làm gì cả, chỉ kể cho nhau nghe những chuyện đang xảy ra trong cuộc sống của mình.<br><br>Anh luôn thích những buổi như vậy. Không cần đi đâu xa, không cần phải nghĩ xem hôm nay chơi gì. <span class=\"highlight\">Chỉ cần hai đứa ngồi trước mặt nhau và vẫn còn thật nhiều chuyện muốn kể cho nhau nghe là được.</span>",
        signature: "Chỉ cần ngồi cạnh em ❤️",
    },
    {
        id: "2026-04-15",
        date: "Apr 15, 2026",
        title: "Bingsu",
        layout: 4,
        photos: [
            { src: "image/150401.JPEG", alt: "Bingsu Mễ Trì", caption: "Bingsu Mễ Trì" },
            { src: "image/150402.JPEG", alt: "Lựa chọn của em", caption: "Lựa chọn của em" },
        ],
        note: "Hôm ấy hai đứa hẹn nhau đi ăn bingsu ở Mễ Trì.<br><br>Trong tình trạng anh đang ho, còn em thì cũng đang không được khỏe lắm :))) Ấy thế mà cuối cùng vẫn quyết định ăn bingsu.<br><br>Mà quan trọng nhất là… <span class=\"highlight\">bingsu do em chọn nhé. Vậy nên nếu anh ho nặng thêm thì lỗi tại em hết :)))</span><br><br>Em chẳng thương anhhh.",
        signature: "Ốm cũng chiều em ❤️",
    },
    {
        id: "2026-04-16",
        date: "Apr 16, 2026",
        title: "Painting by the lake",
        layout: 5,
        photos: [
            { src: "image/160401.JPEG", alt: "Cuốn Deli", caption: "Cuốn Deli" },
            { src: "image/160402.JPEG", alt: "Tô tượng Hồ Tây", caption: "Tô tượng Hồ Tây" },
            { src: "image/160403.JPEG", alt: "Chú mèo loè loẹt", caption: "Chú mèo loè loẹt" },
        ],
        note: "Tối hôm ấy mình đi ăn bánh tráng cuộn ở Cuốn Deli.<br><br>Ăn xong hai đứa lại rủ nhau ra Hồ Tây tô tượng. Không hiểu bằng một cách thần kỳ nào đó mà hai đứa đã biến một chú mèo vô tội thành một tác phẩm đầy màu sắc, loè loẹt hết mức có thể :))) Khổ thân nó thật.<br><br>Nhưng đến giờ anh vẫn giữ chú mèo ấy trên bàn làm việc. Có lẽ bởi vì nhìn nó, anh không chỉ nhìn thấy một món đồ trang trí. Anh nhớ lại buổi tối hôm đó, nhớ hai đứa ngồi cạnh nhau hí hoáy tô từng chút một, nhớ những câu chuyện linh tinh, những lần cười ngớ ngẩn.<br><br>Và rồi anh nhận ra rằng tình yêu của mình được tạo nên từ rất nhiều ngày như thế. Có những ngày đặc biệt, có những ngày chẳng có gì đặc biệt. Có những bó hoa, những bữa ăn, những chuyến xe bus, những quán nước, những lần cãi nhau rồi làm hòa, những món quà ngốc nghếch và cả những buổi tối chỉ đơn giản là ngồi cạnh nhau.<br><br>Từng chuyện khi xảy ra có vẻ rất nhỏ. Nhưng khi đặt tất cả chúng cạnh nhau, anh mới thấy đó chính là một đoạn thanh xuân rất đẹp của anh.<br><br><span class=\"highlight\">Và điều làm cho những ngày ấy trở nên đáng nhớ nhất, vẫn luôn là vì trong những ngày đó có em.</span> ❤️",
        signature: "Một đoạn thanh xuân rất đẹp của anh ❤️",
    }
];

if (typeof window !== 'undefined') window.STORY_PAGES = STORY_PAGES;
if (typeof module !== 'undefined') module.exports = STORY_PAGES;
