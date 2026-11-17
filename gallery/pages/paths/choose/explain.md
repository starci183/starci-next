---
title: Chọn mục tiêu (lộ trình)
route: /paths/choose
area: paths
reviewed: 2026-11-17
---

Route: `/paths/choose` (ảnh chụp: học viên chưa theo lộ trình nào, đã đăng nhập). Mã: `fe/apps/app/src/components/blocks/PathsChoose/component.tsx` (vẽ) và `index.tsx` (đọc dữ liệu, chọn, đổi). Khung chung (thanh bên, thanh trên) giải thích ở `learn/home`.

## Thẻ mở đầu "Bạn học để làm được gì?"

Vì sao: thẻ trắng nổi mở đầu trang: nhãn nhỏ "Mục tiêu đầu ra", tiêu đề là câu hỏi, một đoạn nói lộ trình là gì và hàng chip xám liệt kê bảy chặng mọi lộ trình xâu lại (Hiểu, Nhớ, Giải bài, Xây, Xây cùng AI, Phỏng vấn, Chứng minh và kết nối). Bên phải là hình thầy giáo (`ART.teacher`). Trang không có dải tiêu đề riêng vì thẻ này đã là tiêu đề. CHƯA RÕ: hình thầy là tranh vuông cao khoảng 530px nên thẻ bị kéo cao, để trống giữa hàng chip và đáy thẻ ở 1440 và 1920; cần tỉ lệ hình ngang hoặc cho thẻ tự co theo chữ.
Luật: `pink-page-surface-rule.md` (thẻ trắng nổi, bóng, không viền, một thẻ một việc), `type-scale-14-12.md`, `table-heroui-native-section-head.md` (chip xám).
Grammar: `Page` (không header) bọc `CatalogIntro` của `@starci-next/ui` (`fe/packages/starci-next-ui/src/composites/CatalogIntro`) trên `SurfaceCard`, `Badge` chip, `ArtImage asset={ART.teacher}`.

## Dòng ghi chú dưới thẻ

Vì sao: một dòng muted nói mục tiêu không có chuỗi ngày và không tự cấp kinh nghiệm, các phần vẫn học riêng được. Nó là câu giải thích luật chứ không phải nội dung thẻ nên nằm ngoài thẻ, dưới phần mở đầu.
Luật: `type-scale-14-12.md`, `pink-page-surface-rule.md`.
Grammar: `Text tone="muted"` (`leaf/Text`).

## Lưới năm thẻ lộ trình

Vì sao: năm lộ trình là năm thẻ ngang hàng (Khởi nghiệp, AI Engineer, Backend / Fullstack, DevOps / SRE, Senior · System design), cùng khuôn: avatar nhỏ + nhãn loại ("Xây sản phẩm", "Việc làm") + tên, một câu hứa, khối "Đích" in đậm, chip các phần học và dòng "n bước · khoảng m tuần". Chân thẻ có hai nút: "Xem lộ trình" (trung tính) mở hộp thoại chi tiết, "Chọn lộ trình" (nút chính, một nút chính mỗi thẻ) chọn thẳng. Khi học viên đã theo một lộ trình thì chọn lộ trình khác phải qua hộp xác nhận đổi. Các thẻ cao thấp khác nhau theo độ dài chữ vì lưới xếp từng thẻ theo nội dung. Ở 390 các thẻ xếp một cột.
Luật: `pink-page-surface-rule.md`, `verify-against-visualize.md` (một nút chính mỗi vùng), `table-heroui-native-section-head.md`.
Grammar: `Grid kind="cards"` (`frame/Grid`), `OutcomePathCard` (`fe/packages/starci-next-ui/src/composites/OutcomePathCard`) trên `SurfaceCard`, `Button intent="commit"` và `Button intent="neutral"`.

## Hộp thoại chi tiết và hộp xác nhận đổi lộ trình

Vì sao: không có trong ảnh vì chỉ mở khi bấm. "Xem lộ trình" mở `OutcomePathDialog` với kết quả đạt được, các tiêu chí kiểm và các chặng; việc đổi từ lộ trình này sang lộ trình khác mở `AlertDialog` hỏi lại vì đổi làm lộ trình cũ ngừng được tính. Đây là vùng chưa có ảnh, nên viết từ mã chứ không từ ảnh.
Luật: `verify-against-visualize.md`, `table-heroui-native-section-head.md`.
Grammar: `AlertDialog` (`frame/AlertDialog`), `OutcomePathDialog` (`fe/packages/starci-next-ui/src/composites/OutcomePathDialog`).

## Trạng thái chưa đăng nhập, đang tải và lỗi

Vì sao: ba trạng thái của một khe dữ liệu (`SlotView`) thay cho lưới: khung xương cùng hình học khi đang đọc, thông báo lỗi có nút "Thử lại", và với khách là câu "cần đăng nhập" kèm nút chính "Đăng nhập". Chỉ `SlotView` rẽ nhánh trạng thái, các thẻ chỉ nhận `isLoading`.
Luật: `grammar-slot-interface` (DataSlot, chỉ SlotView rẽ nhánh), `pink-page-surface-rule.md`.
Grammar: `SlotView` (`fe/packages/starci-next-ui/src/branches/SlotView`), `Button intent="commit" href`.
