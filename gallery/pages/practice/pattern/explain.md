---
title: Một pattern (các bài trong pattern)
route: /practice/patterns/[patternId]
area: practice
reviewed: 2026-11-17
---

Route: `/practice/patterns/[patternId]` (ảnh chụp: pattern Mảng, học viên Premium nên cả năm bài đều mở). Mã: `fe/apps/app/src/components/blocks/PracticePattern/component.tsx`. Khung chung giải thích ở `learn/home`.

## Dải đầu trang: đường dẫn "Luyện code / Mảng" và tiêu đề

Vì sao: dải trắng phẳng, viền dưới, sát trái: đường dẫn hai mục (mục đầu quay về `practice/list`, mục cuối đậm là trang hiện tại) và tiêu đề 18/600 "Mảng". Trang con có đường dẫn trong dải.
Luật: `surface-layering`, `theme-and-type`.
Grammar: `Page header={{ breadcrumbs, title }}` (`frame/Page/index.d.ts`).

## Phần tiến độ của pattern

Vì sao: một `Section` phẳng tên "Mảng" trên nền trắng: một dòng muted "0/5 bài Accepted · bản miễn phí mở 5 bài". Cùng khuôn với phần giới thiệu của `practice/list`. Không có hàng nâng cấp và không có nút chính vì học viên đã Premium; học viên miễn phí sẽ thấy hàng nâng cấp với nút chính "Mở toàn bộ bài" (không có trong ảnh). CHƯA RÕ: dòng "bản miễn phí mở 5 bài" vẫn hiện cho học viên Premium nên mất nghĩa.
Luật: `surface-layering` (Section thay thẻ), `theme-and-type`.
Grammar: `PracticeBrowse` (`fe/packages/starci-next-ui/src/composites/PracticeBrowse`), `Section`, `UpsellRow` (chỉ khi chưa Premium).

## Danh sách "Các bài trong pattern"

Vì sao: một `Section` danh sách phẳng năm bài, hàng ngăn bằng đường kẻ 1px: số thứ tự, tên bài 500, dòng 12 muted độ khó và các nhãn kỹ thuật (Trung bình · arrays · sorting...), bên phải chip xám "Chưa làm" và nút pill trung tính "Giải bài". Bài khoá (với học viên miễn phí) vẫn là liên kết và mang chip "Premium". Ở 390 nút "Giải bài" xuống dòng riêng dưới mỗi hàng và nhãn kỹ thuật bị cắt bằng "…".
Luật: `surface-layering` (danh sách là Section, không thẻ), `theme-and-type`.
Grammar: `PracticeList` (`fe/packages/starci-next-ui/src/composites/PracticeList`) trong `Section`, `Badge`, `Button` neutral cỡ sm.

## Phản biện

Vì sao: tự phản biện của lần chụp này; liệt kê điều còn sai trên màn hình, không sửa trong lần chụp (chủ duyệt rồi mới sửa).
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- 1440: độ khó "Trung bình" cùng màu muted nên không nổi.
- 1440: mỗi hàng có chip "Chưa làm" và nút "Giải bài" cạnh nhau ở mép phải; năm nút lặp, hàng vốn đã là liên kết; chip và nút cùng cỡ nhỏ nhìn như hai nút, viền nút gần như vô hình.
- 1920: nội dung co vào giữa (x=480) trong khi đường dẫn và tiêu đề sát trái x=288.
- 390: nút "Giải bài" xuống dòng riêng dưới mỗi hàng, lệch trái so với tên bài; nhãn kỹ thuật bị cắt "…" giữa chừng (greed…, sorti…, dynamicProgr…) nên mất nghĩa; chip "Chưa làm" đứng cao hơn dòng tên.
