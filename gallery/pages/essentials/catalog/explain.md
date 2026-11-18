---
title: Essentials (danh mục)
route: /essentials
area: essentials
reviewed: 2026-11-18
---

Route: `/essentials`. Danh mục các bài cụm theo chủ đề: thấy mình đang ở đâu, vào đúng bài đang dở hoặc chọn bài theo bài toán. Ảnh chụp ở 1440, 1920 và 390; khung (thanh trên, thanh bên) thuộc lane khác. Bản vẽ được duyệt: `design/starci-next/pages/02-essentials.html` (essentials-catalog). Code: `fe/apps/app/src/components/blocks/EssentialsCatalog/component.tsx`, mapper `fe/apps/app/src/hooks/catalog/catalog.shared.ts`, composite `CatalogToolbar`, `CatalogGroup`, `LessonList` trong `fe/packages/starci-next-ui/src/composites/`. Các trạng thái có thư mục riêng: `catalog-first-visit`, `catalog-no-match`, `catalog-loading`, `catalog-error`, `catalog-free`. Mã nguồn màn hình nay nằm trong nhóm tuyến `(pages)`; giao diện không đổi.

## Dải đầu: tên trang, dòng sự kiện, nút chính

Vì sao: trang gốc của mục nên không có breadcrumb. Dưới tên là một dòng muted "5 chủ đề · 28 bài cụm · bạn đã xong 6"; lần đầu dòng ghi "bạn chưa học bài nào". Nút chính duy nhất là "Học tiếp: <bài> · phần N" trỏ thẳng tới phần đang dở của bài đang học; chưa học gì thì "Bắt đầu: <bài đầu>"; tài khoản miễn phí đổi thành "Nâng cấp Premium". Ở 390 nút xuống dưới tên và rộng cả hàng.
Luật: ui/components/page-header (một nút chính ở cuối hàng tiêu đề), ui/components/button (một nút chính mỗi vùng), `surface-layering`.
Grammar: `Page header { title, breadcrumbs: "root", meta, actions }` với `Button intent="commit"` (`frame/PageHeader`).

## Tab trạng thái có đếm

Vì sao: bốn tab Tất cả, Đang học, Chưa học, Đã xong lọc một danh sách đứng yên, mỗi tab có chip đếm; ba trạng thái cộng lại bằng tổng "Tất cả" vì đếm trên mọi bài, không theo ô tìm. Số đếm và thanh "2/6 bài xong" của từng nhóm cùng đọc một danh sách trạng thái nên không lệch.
Luật: ui/components/tabs (filter tabs có count, không "· N" trong nhãn), ui/composition-sections (bộ lọc của vùng).
Grammar: `Tabs kind="filter" items[{ id, label, count }]` trong `filter` của `Section kind="region"` (`composites/CatalogToolbar`).

## Thanh công cụ phẳng: ô tìm, chủ đề, gói

Vì sao: một hàng phẳng trên mặt trắng, không thẻ. Ô tìm lọc theo tên bài và dòng bài toán; chọn chủ đề thu danh sách về một nhóm; chọn gói đặt "Phần 1 miễn phí" (bài chưa xong phần 1) hoặc "Cần Premium" (đã xong phần 1, các phần sau thuộc Premium). Mỗi ô chọn có tiền tố "Chủ đề:", "Gói:" để nói mình lọc gì.
Luật: ui/components/field (ô chọn có tiền tố thay nhãn), ui/composition-sections (toolbar phẳng, không thẻ).
Grammar: `SearchField`, `Select prefix` (`composites/CatalogToolbar`).

## Nhóm chủ đề: tên, "2/6 bài xong", thanh tiến độ, "Xem chủ đề"

Vì sao: mỗi chủ đề là một nhóm phẳng cách nhau bằng khoảng trắng. Head: tên nhóm, chip sự kiện "2/6 bài xong", liên kết "Xem chủ đề" ở cuối hàng; ngay dưới là thanh tiến độ màu chữ (đo lường không dùng tím). Nhóm không còn bài nào khớp bộ lọc thì ẩn.
Luật: ui/composition-sections (Section region có title, fact, action), `theme-and-type` (số đo dùng foreground, tím chỉ là tín hiệu).
Grammar: `Section kind="region" title fact action={<Link variant="head">}` + `Progress tone="foreground"` (`composites/CatalogGroup`).

## Hàng bài học: tên, bài toán, 4 vạch, nhãn, thời lượng

Vì sao: mỗi hàng là một bài cụm: tên (500), một dòng bài toán, bốn vạch là bốn phần (Bản chất, Source, Kịch bản, Tự áp dụng; vạch đã xong tô đậm), nhãn trạng thái ở cuối ("Đã xong", "Đang học · phần 3", "Xong phần 1", "Chưa học"; tài khoản miễn phí thấy "Phần 1 miễn phí"), rồi số phút. Bài đang học tô xám nhẹ, không tím. Mỗi nhóm hiện 3 bài, còn lại sau "Xem cả n bài trong chủ đề".
Luật: ui/components/list-table (hàng danh sách, không bảng), ui/components/chip (nhãn trạng thái là Badge có sắc), `surface-layering` (không thẻ trong thẻ).
Grammar: `Section kind="list" items[ListRow { description, detail: Meter segments={4}, badges, meta, state: "informative", href }]` (`composites/LessonList`).

## Trạng thái: lần đầu, không khớp, đang tải, lỗi, tài khoản miễn phí

Vì sao: mỗi trạng thái có khung riêng cùng cây cấu trúc. Lần đầu: các Meter trống, mọi bài "Chưa học", nút "Bắt đầu: …". Không khớp: thông báo "Không có bài nào khớp "…"" kèm "Xóa bộ lọc" thay danh sách, thanh công cụ giữ nguyên. Đang tải: cùng cây với dữ liệu giả cùng hình, vẽ thành khung xám. Lỗi: thông báo có "Thử lại". Miễn phí: nút "Nâng cấp Premium" và nhãn "Phần 1 miễn phí".
Luật: ui/loading (STATE-8: lá và hợp phần nhận `isLoading`, chỉ SlotView rẽ nhánh), ui/components/empty-state.
Grammar: `SlotView`, `EmptyNotice`, `Alert tone="negative"` với hành động thử lại (`composites/SlotView`).

## Phản biện

Vì sao: tự phản biện lần chụp này; chỉ liệt kê điều còn lệch bản vẽ, chưa sửa ngoài phạm vi.
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- Đã đọc 1440, 1920 (cùng cây) và 390 với dữ liệu mẫu của bản vẽ (5 chủ đề, 28 bài) qua core giả, vì stack dev chung chưa lên (CSDL và Keycloak tắt); hình chưa chụp trên dữ liệu thật hai bài.
- Meter bốn phần chưa có nấc "đang làm" (nửa đậm) như bản vẽ: phần đang dở vẽ như phần chưa làm; dùng Meter segments={4} gần nhất (xem GRAMMAR-GAPS #2).
- Thanh tiến độ của nhóm đứng dưới head, không nằm cùng dòng sau chip "2/6 bài xong" như bản vẽ: Section head không có chỗ cho một thanh.
- Hàng bài đang học chỉ có state informative, Grammar 0.44 chưa tô nền xám cho hàng đó; bản vẽ tô xám.
- Meter bốn phần và thanh nhóm bị giới hạn bề rộng bằng một span 6,5rem / 7,5rem (như RowProgress), vì Meter chia khổ theo cả hàng.
- 390: dải tab trạng thái gập "Đã xong" vào menu "+2" thay vì cuộn ngang như bản vẽ (hành vi của Tabs kind="filter").
- Lỗi tải dùng Alert của SlotView ("Không tải được phần này" và nút đỏ) thay vì thông báo "Không tải được danh mục, tiến độ của bạn vẫn được giữ" của bản vẽ; cần chữ riêng cho SlotView.
- Bộ lọc Gói là suy đoán của lane: "Phần 1 miễn phí" = bài chưa xong phần 1, "Cần Premium" = đã xong phần 1; chờ chủ sản phẩm chốt (QUESTIONS #2).
- Phần 2 đến 4 của tiến độ (vạch Source, Kịch bản, Tự áp dụng) đọc từ lessonPartsProgress; chưa kiểm trên dữ liệu thật.
