---
title: Bản chất (danh mục)
route: /essentials
area: essentials
reviewed: 2026-11-17
---

Route: `/essentials`. Danh mục Bản chất cho học viên Premium: 16 nhóm kiến thức, mỗi nhóm một danh sách topic, kèm tìm kiếm, bộ lọc độ khó và aside điều hướng nhóm. Ảnh chụp ở 1440, 1920 và 390; khung (sidebar, thanh trên) thuộc lane khác, trang cuộn trong từng pane nên ảnh dài. Code: `fe/apps/app/src/components/blocks/EssentialsCatalog/component.tsx`, composite `CatalogToolbar`, `CatalogSection`, `CatalogAside` trong `fe/packages/starci-next-ui/src/composites/`.

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

## Phản biện

Vì sao: tự phản biện của lần chụp này; liệt kê điều còn sai trên màn hình, không sửa trong lần chụp (chủ duyệt rồi mới sửa).
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- 1440, dải tiêu đề: Ba chip nền xám (11 bài đã mở, 16 nhóm, 343 bài...) là nền tô; chip thứ ba dài và đọc như một câu, không phải một số liệu.
- 1440, khung lọc (CatalogToolbar) vẫn là một thẻ bo góc, và aside "Nhóm kiến thức" là danh sách có khung viền bo góc do Grammar vẽ cho Section kind="list"; các danh sách nhóm đã là Section trên mặt trắng, không còn thẻ bao quanh.
- 1440, "Bài toán thực chiến": bốn hàng đều mang chip "BÀI TOÁN" nền xám và chữ "Sắp có" 12 muted rất nhạt, độ tương phản thấp; chip lặp lại thông tin của cả nhóm trên mỗi hàng. Bốn hàng không bấm được nhưng trông giống hàng danh sách bình thường.
- 1440, hàng topic: ảnh bìa 3D màu sắc rực (đỏ, tím, cam) cỡ 40px lệch hẳn với trang trắng trung tính và khó đọc chi tiết; ảnh nằm trong một ô tím nhạt, tức nền tô.
- 1440, số liệu cuối hàng: "1/5 bài đã mở" và "0/5 đã hiểu" cùng 12 muted, "0/5 đã hiểu" đậm hơn chút; hai số gần nhau, dễ đọc nhầm, và không căn cột giữa các hàng (hàng Kubernetes "1/15 bài đã mở" lệch trái so với các hàng khác).
- 1440, aside: số đếm không nhãn ("Backend nền tảng 5") trong khi thân ghi "3 topic" cho cùng nhóm; hai đơn vị khác nhau (bài và topic) nhưng không ghi rõ. Tên nhóm dài xuống hai dòng ("Cloud (AWS, GCP, Azure, DigitalOcean)", "Tích hợp dịch vụ...") làm hàng cao không đều. Mục "Tất cả" không có dấu hiệu đang chọn.
- 1440, lặp: dòng "Còn N bài nguồn trong nhóm này đang được chuyển..." xuất hiện bảy lần với cùng một câu, nhiễu thị giác.
- 1920: Không thấy lỗi mới ở 1920; các lỗi ở 1440 vẫn còn (khung bo góc, chip xám, ảnh bìa, eyebrow in hoa), thêm hàng topic kéo rất rộng nên số liệu cuối hàng cách xa tên.
- 390, "Bài toán thực chiến": nhãn bị cắt thành "Bài toán thực c..." và mô tả xuống hai dòng; dòng "Cần trước: Request lifecycle,..." và "Cần trước: CQRS, Kiến trúc &..." bị cắt; "Distributed transactions — ví điện tử" xuống hai dòng và chip "BÀI TOÁN" cùng "Sắp có" chiếm nửa hàng. Hàng Kubernetes cắt "Nguồn: System Design module 2 và DevOp...", LLM & agent cắt "...module 0" thành "mo...".
- 390, thứ tự: aside "Nhóm kiến thức" (16 hàng) đứng trước khung lọc, đẩy danh sách thật xuống dưới một màn rưỡi; khối này là khung bo góc. Ba chip tiêu đề xuống dòng và chip dài sát lề.
- 390, hàng topic: ảnh bìa, tên, số bài và chevron xếp chồng không thẳng cột; số "1/5 bài đã mở" nằm dưới nguồn, tách khỏi chevron ở cuối.
- Sau Grammar 0.43.0 (2026-11-17), 1440 và 390: khung lọc đã thành dải phẳng dưới tiêu đề vùng "Tìm bài" (không còn thẻ), nhưng tìm kiếm và hai ô chọn "Ngôn ngữ", "Cloud" xếp dọc, mỗi ô rộng cả cột thay vì một hàng ngang; chiếm khoảng 130px trước danh sách. Cần cho phép `measure="compact"` hoặc bố cục hàng của Cluster; chưa sửa, theo yêu cầu chỉ liệt kê.
- Sau 0.43.0, 1440: tiêu đề vùng "Tìm bài" là chữ thừa vì các tab và ô tìm đã tự nói; Section region bắt buộc có `title`, nên cần quyết định sản phẩm (đổi chữ thành tên danh sách hay bỏ).
- Sau 0.43.0, các nhóm "Bài toán thực chiến" và "Backend nền tảng" là danh sách phẳng chia bằng đường kẻ, không còn khung bo góc; đã đọc ở 1440 và 390, hàng cắt chữ ở 390 vẫn còn như trên.
- Sau Grammar 0.43.1 và alpha.147 (2026-11-17, đã đọc ở 1440 và 390 trên dev): tiêu đề "Tìm bài" đã bỏ (vùng chỉ còn `ariaLabel`), tab, ô tìm và hai ô chọn nằm thẳng trong `filter` thành một dải phẳng; ở 1440 gọn một hàng, không còn xếp dọc. Ba ô chọn/tìm có bề rộng tự nhiên, nhãn "Ngôn ngữ Tất cả" và "Cloud Tất cả" đọc rõ. Khung lọc cách danh sách khoảng 40px, hợp lý.
- Sau 0.43.1, 390: các ô tìm và chọn xuống dòng xếp dọc, mỗi ô rộng cả hàng (đúng với dải bao dòng ở màn hẹp), nhưng thứ tự vẫn là aside "Nhóm kiến thức" (16 hàng) trước khung lọc, nên khung lọc nằm sau gần một màn rưỡi; cần quyết định sản phẩm (đưa aside xuống dưới hoặc gập nó).
- Sau 0.43.1, 1440: aside vẫn dùng "Tất cả" mà không có dấu hiệu đang chọn, và vẫn lặp số đếm bài/topic khác đơn vị; chưa sửa.
- Sau Grammar 0.44.0 và alpha.148 (2026-11-17, đã đọc ở 1440, 1920 và 390 trên dev): hai ô chọn của khung lọc dùng `appearance="compact"`, thành hai viên thuốc 32px giữ bề rộng theo nội dung, ở 1440 và 1920 nằm cuối hàng, ở 390 xuống dòng dưới ô tìm nhưng vẫn là hai viên nhỏ cạnh nhau, không còn kéo cả hàng. Mất: compact không có chỗ cho tiền tố, nên cả hai viên chỉ ghi "Tất cả" và không nói đâu là Ngôn ngữ, đâu là Cloud (nhãn chỉ còn cho trình đọc màn hình); cần quyết định sản phẩm (đặt placeholder hoặc nhãn lựa chọn rỗng thành "Mọi ngôn ngữ", "Mọi cloud") hoặc một API Grammar cho compact có tiền tố.
- Sau 0.44.0, 390: aside "Nhóm kiến thức" vẫn đứng trước khung lọc, đẩy khung lọc xuống gần một màn rưỡi; chưa sửa.
- Sau 0.44.0, thanh trên (1440, 1920): nút đổi ngôn ngữ, công tắc sáng/tối kind="toggle" (không size) và avatar nằm gọn bên phải; công tắc compact chỉ còn ở hàng trong trang. Ở 390 thanh trên là logo và avatar, nút "Mở menu" nằm ở hàng riêng bên dưới.
- Sau sửa "Mọi ngôn ngữ" / "Mọi cloud" (2026-11-17, dev c112a6c, đã đọc ở 1440 và 390 với học viên dùng một lần): hai viên thuốc compact giờ tự nói mình lọc gì ("Mọi ngôn ngữ", "Mọi cloud"), lỗi "cả hai chỉ ghi Tất cả" của mục 0.44.0 đã hết; nhãn cho trình đọc màn hình giữ nguyên ("Ngôn ngữ", "Cloud") và bố cục không đổi: một hàng cuối dải lọc ở 1440, xuống dòng dưới ô tìm ở 390, hai viên cạnh nhau. Còn lại: khi đã chọn một giá trị (ví dụ "Python") viên chỉ ghi giá trị, không còn tiền tố, nhưng vị trí và biểu tượng mũi tên đủ để đoán; chưa thấy cần sửa. Các lỗi khác ở trên (aside trước khung lọc ở 390, "Tất cả" của aside không có dấu chọn) vẫn còn.
