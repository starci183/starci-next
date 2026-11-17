---
title: Chọn mục tiêu (lộ trình)
route: /paths/choose
area: paths
reviewed: 2026-11-17
---

Route: `/paths/choose` (ảnh chụp: học viên chưa theo lộ trình nào, đã đăng nhập). Mã: `fe/apps/app/src/components/blocks/PathsChoose/component.tsx` (vẽ) và `index.tsx` (đọc dữ liệu, chọn, đổi). Khung chung giải thích ở `learn/home`. Ảnh dài: 1440 cao ~1590px, 1920 cao ~1630px, 390 cao ~2745px.

## Phần mở đầu "Bạn học để làm được gì?"

Vì sao: phần mở đầu phẳng trên nền trắng, không thẻ: nhãn nhỏ "MỤC TIÊU ĐẦU RA", tiêu đề là câu hỏi, một đoạn nói lộ trình là gì và hàng chip xám bảy chặng (Hiểu, Nhớ, Giải bài, Xây, Xây cùng AI, Phỏng vấn, Chứng minh và kết nối). Bên phải là hình thầy giáo (`ART.teacher`) trên nền tím nhạt, hình ở 1440 rộng ~550px nên cao khoảng 550px. Trang không có dải tiêu đề riêng vì phần này đã là tiêu đề. CHƯA RÕ: hình cao kéo hàng mở đầu, chữ và chip chỉ chiếm ~170px đầu nên có khoảng trống lớn bên dưới chip ở 1440 và 1920; cần ảnh tỉ lệ ngang hoặc cho hàng co theo chữ. Ở 390 hình nằm dưới chữ, vừa bề ngang.
Luật: `surface-layering` (phần phẳng, chip xám), `type-scale-14-12.md`.
Grammar: `Page` (không header) bọc `CatalogIntro` (`fe/packages/starci-next-ui/src/composites/CatalogIntro`) với `Heading`, `Text`, `Badge tone="neutral"` và `ArtImage asset={ART.teacher}`.

## Dòng ghi chú dưới phần mở đầu

Vì sao: một dòng muted nói mục tiêu không có chuỗi ngày và không tự cấp kinh nghiệm, các phần vẫn học riêng được. Là câu giải thích luật chứ không phải nội dung của phần mở đầu nên nằm ngoài nó.
Luật: `type-scale-14-12.md`, `surface-layering`.
Grammar: `Text tone="muted"` (`leaf/Text`).

## Lưới năm thẻ lộ trình

Vì sao: năm lộ trình là năm thẻ vì mỗi lộ trình là một vật thật có thể chọn (Khởi nghiệp, AI Engineer, Backend / Fullstack, DevOps / SRE, Senior · System design): viền 1px, không bóng, cùng khuôn: avatar nhỏ + nhãn loại ("XÂY SẢN PHẨM", "VIỆC LÀM") + tên, một câu hứa, khối "Đích:" có chữ đậm, chip các phần học và dòng "n bước · khoảng m tuần". Chân thẻ có đường kẻ và hai nút: "Xem lộ trình" (trung tính) và "Chọn lộ trình" (nút chính). Lưới 4 cột ở 1440 và 1920 (thẻ thứ năm xuống hàng riêng, để trống ba ô), một cột ở 390. Khi học viên đã theo một lộ trình thì chọn lộ trình khác phải qua hộp xác nhận đổi. Ghi chú lỗi ảnh: (1) mỗi thẻ có một nút chính nên màn có năm nút chính, trái luật một nút chính; (2) các thẻ cùng hàng cao thấp khác nhau theo độ dài chữ nên hàng nút ở chân thẻ lệch nhau.
Luật: `surface-layering` (thẻ cho vật thật, một nút chính mỗi màn, lệnh lặp theo hàng là nút trung tính nhỏ), `theme-and-type`.
Grammar: `Grid kind="cards"` (`frame/Grid`), `OutcomePathCard` (`fe/packages/starci-next-ui/src/composites/OutcomePathCard`) trên `SurfaceCard`, `Badge`, `Button intent="commit"` và `Button intent="neutral"`.

## Hộp thoại chi tiết và hộp xác nhận đổi lộ trình

Vì sao: không có trong ảnh vì chỉ mở khi bấm; viết từ mã. "Xem lộ trình" mở `OutcomePathDialog` với kết quả đạt được, tiêu chí kiểm và các chặng; đổi từ lộ trình này sang lộ trình khác mở `AlertDialog` hỏi lại vì đổi làm lộ trình cũ ngừng được tính.
Luật: `surface-layering` (lớp nổi mới có bóng), `verify-against-visualize.md`.
Grammar: `AlertDialog` (`frame/AlertDialog`), `OutcomePathDialog` (`fe/packages/starci-next-ui/src/composites/OutcomePathDialog`).

## Trạng thái chưa đăng nhập, đang tải và lỗi

Vì sao: không có trong ảnh, viết từ mã: ba trạng thái của một khe dữ liệu (`SlotView`) thay cho lưới: khung xương khi đang đọc, thông báo lỗi có nút "Thử lại", và với khách là câu "cần đăng nhập" kèm nút chính "Đăng nhập". Chỉ `SlotView` rẽ nhánh trạng thái, các thẻ chỉ nhận `isLoading`.
Luật: `grammar-slot-interface` (DataSlot, chỉ SlotView rẽ nhánh), `surface-layering` (trạng thái nằm trong vùng của nó).
Grammar: `SlotView` (`fe/packages/starci-next-ui/src/branches/SlotView`), `Button intent="commit" href`.
