---
title: Bản chất (danh mục)
route: /essentials
area: essentials
reviewed: 2026-11-17
---

Route: `/essentials`. Danh mục Bản chất cho học viên Premium: 16 nhóm kiến thức, mỗi nhóm một danh sách topic, kèm tìm kiếm, bộ lọc độ khó và aside điều hướng nhóm. Ảnh chụp ở 1440, 1920 và 390; khung (sidebar, thanh trên) thuộc lane khác, trang cuộn trong từng pane nên ảnh dài. Vòng tròn "N" ở góc là lớp phủ của Next dev, không phải UI. Code: `fe/apps/app/src/components/blocks/EssentialsCatalog/component.tsx`, composite `CatalogToolbar`, `CatalogSection`, `CatalogAside` trong `fe/packages/starci-next-ui/src/composites/`.

## Dải tiêu đề (title, chip số liệu, dòng phụ)

Vì sao: dải trắng sát lề trái, ngăn với thân trang bằng một đường kẻ 1px, không breadcrumb vì đây là trang gốc của mục. Tiêu đề 18/600; ba số liệu (bài đã mở, số nhóm, số bài nguồn đang chuyển) là chip xám 12 cạnh tiêu đề; dòng 12 muted dưới tiêu đề là loại kiến thức. Ở 390 các chip xuống dòng dưới tiêu đề. CHƯA RÕ: dòng phụ "KIẾN THỨC NGÀNH · HỌC TƯƠNG TÁC" vẫn in hoa vì nằm in hoa trong file thông điệp (`app.essentials.catalog.eyebrow`, ngoài phạm vi lane), cần đổi sang chữ thường.
Luật: `surface-layering` (luật 5: dải đầu sát trái, tiêu đề 18/600, mô tả 12 muted), `theme-and-type` (cỡ chữ 14 và 12, chip xám).
Grammar: `Page chrome="panes" header={{ breadcrumbs: "root", title, meta, status }}` (`frame/Page/index.d.ts`, `frame/PageHeader/index.d.ts`), `Badge tone="neutral"` (`leaf/Badge/index.d.ts`). Code: `EssentialsCatalog/component.tsx` (`bandOf`, `FactChips`).

## Khung tìm kiếm và bộ lọc

Vì sao: một khung viền hairline làm một việc là lọc, gồm hai vùng ngăn nhau bằng một đường kẻ: tab độ khó "Tất cả / Nền tảng / Trung cấp / Nâng cao" (tab đang chọn có gạch chân màu chữ, không phải màu tím), rồi ô tìm kiếm (trắng, viền 1px, icon kính lúp) cùng hai ô chọn "Ngôn ngữ" và "Cloud" ở cuối hàng. Không có nút chính ở trang này. Lọc xong, danh sách đổi từ hàng topic sang hàng bài học. Ở 390 ô tìm kiếm chiếm cả hàng, hai ô chọn xuống dòng dưới.
Luật: `theme-and-type` (luật 2: tab underline là màu foreground; luật 3: ô trắng viền 1px), `surface-layering` (luật 1: không thẻ trong thẻ; khung lọc là một vùng, không có thân).
Grammar: `SurfaceCard kind="list" items={[]} headers=[{ kind: "filter", … }, { kind: "search", …, filters: SelectZoneField[] }]` (`frame/SurfaceCard/index.d.ts`, `surfaceCardData.d.ts` `HeaderZone`, `SearchZoneFields`). Code: `CatalogToolbar/index.tsx`.

## Nhóm "Bài toán thực chiến" (4 bài toán, chưa mở)

Vì sao: head của Section nằm trên mặt trắng: nhãn 14/500 "Bài toán thực chiến" kèm mô tả "Bộ sưu tập · mỗi bài toán ghép từ nhiều bài" cùng dòng. Thân là danh sách bốn hàng, mỗi hàng một bài toán (tên 500, dòng muted "Cần trước: ..."), cuối hàng chip "BÀI TOÁN" và chữ "Sắp có"; hàng chưa mở nên không có đích bấm và không chevron. Dòng 12 muted dưới danh sách ghi còn 12 bài toán từ khoá System Design. Ở 390 nhãn bị cắt thành "Bài toán thực c..." và mô tả xuống hai dòng (xem lỗi hình). Danh sách vẫn nằm trong khung viền hairline bo góc, không bóng.
Luật: `surface-layering` (luật 1 và 3: danh sách là thân của Section, block label là head trên mặt trắng).
Grammar: `SurfaceCard kind="list" label items[{ title, description, badges }]` (`frame/SurfaceCard/index.d.ts`). Code: `EssentialsCatalog/component.tsx` (`casesNodeOf`).

## Nhóm kiến thức: head + chip đếm ("Backend nền tảng 3 topic") và danh sách topic

Vì sao: mỗi nhóm có nhãn 14/500 kèm đếm "n topic" 12 muted ngay trên mặt trắng, rồi một danh sách topic; nhóm không có bài nào khớp bộ lọc thì không hiện. Hàng topic là `<a>` thật (mở tab mới, sao chép liên kết được): ảnh bìa 3D vuông bo mềm (khoảng 40px, trang trí, không chữ thay thế) làm ảnh nhỏ đầu hàng, tên topic (500), dòng muted "Nguồn: ...", cuối hàng "1/5 bài đã mở" và "0/5 đã hiểu" (chữ 12, số đã hiểu đậm hơn), chevron dẫn vào topic. Hàng ngăn nhau bằng hairline; hàng được chọn không có nền màu. Danh sách nằm trong khung viền hairline bo góc, không bóng. Dưới danh sách là dòng 12 muted "Còn N bài nguồn trong nhóm này đang được chuyển...". Ở 390 hàng xuống dòng: số bài và số hiểu nằm dưới tên, chevron cuối hàng. CHƯA RÕ: ảnh nhỏ nên chi tiết 3D khó đọc; cần Grammar một `leading.image` lớn hơn nếu chủ muốn.
Luật: `surface-layering` (luật 1: danh sách trên mặt trắng; luật 8: link điều hướng kết thúc bằng mũi tên/chevron, không ↗), `theme-and-type` (cỡ 14/12, hairline thay nền tô).
Grammar: `SurfaceCard kind="list" label fact note items[ListRowData { title, description, badges, meta, href, leading.avatar { src, shape: "rounded" } }]` (`surfaceCardData.d.ts`). Code: `CatalogSection/index.tsx` (`rowsOf`).

## Aside phải "Nhóm kiến thức" (Tất cả 11, 16 nhóm với số bài đã mở)

Vì sao: aside trắng, ngăn với thân bằng đường kẻ trái, là điều hướng nhóm: head "Nhóm kiến thức" rồi mục "Tất cả" và 16 nhóm, mỗi mục một hàng ngăn hairline, số bài đã mở bằng chữ 12 muted và chevron ở cuối; chọn một nhóm thì thân chỉ còn nhóm đó. Cuộn riêng khi dài (ở 1440 một số tên nhóm xuống hai dòng, ở 1920 vừa một dòng). Dưới lg aside xuống thành khối đầu tiên của trang, trước khung lọc (ở 390 sidebar thu thành nút "Mở menu"). Trong ảnh không mục nào được đánh dấu chọn (chưa có nhóm đang lọc); khi chọn sẽ là nền xám, không tím. Khung của danh sách này là khung viền hairline bo góc, khác các aside phẳng thuần: CHƯA RÕ, cần xem lại với luật "aside không làm bằng thẻ".
Luật: `surface-layering` (luật 4: aside là section và hàng có divider; dưới lg các khối aside là khối đầu trang), `theme-and-type` (luật 2: mục chọn là xám, không tím).
Grammar: `Pane area="aside" surface scroll` + `PaneGrid areas={{ base: ["aside","main"], wide: ["main aside"] }}` (`frame/PaneGrid/index.d.ts`), `Section kind="list" items[{ meta, state, onPress }]` (`frame/Section/index.d.ts`). Code: `CatalogAside/index.tsx`.

## Thân giữa (trắng, tối đa 80rem)

Vì sao: thân là mặt trắng của trang, nội dung cuộn trong pane và bị chặn ở 80rem, căn trái; các nhóm cách nhau một khoảng đều, ngăn bằng khoảng trắng chứ không bằng nền tô. Ở 1920 thân giãn rộng hơn 1440 nhưng danh sách vẫn là các hàng cùng cấu trúc, aside giữ nguyên bề rộng.
Luật: `surface-layering` (Terms: Surface trắng, nội dung capped ở `--grammar-content-max`), `theme-and-type` (luật 1: mọi bề mặt trắng).
Grammar: `Pane area="main" scroll` (`frame/PaneGrid/index.d.ts`), `Stack gap="region"`. Code: `EssentialsCatalog/component.tsx`.
