---
title: Bản chất (danh mục)
route: /essentials
area: essentials
---
Route: `/essentials`. Danh mục Bản chất: 16 nhóm kiến thức, mỗi nhóm một thẻ danh sách các topic, kèm tiếp tục học, tìm kiếm và bộ lọc. Đường dẫn Grammar nằm dưới `node_modules/@starci/grammar/dist/core/` (0.37.12). Khung (sidebar, thanh trên) thuộc lane S1; ảnh chụp chỉ thấy phần viewport vì trang cuộn trong từng pane. Vòng tròn "N" và "1 Issue" là lớp phủ của Next dev, không phải UI của app.

## Dải tiêu đề (title, chip số liệu, dòng phụ)
Vì sao: dải trắng sát lề trái, không có breadcrumb vì đây là trang gốc của mục. Tiêu đề 18/600, các số liệu của danh mục (số bài đã mở, số nhóm, số bài nguồn đang chuyển) là chip xám 12 cạnh tiêu đề thay cho một thẻ giới thiệu; dòng 12 muted là loại kiến thức. Không còn thẻ mô tả một câu. CHƯA RÕ: chữ "KIẾN THỨC NGÀNH · HỌC TƯƠNG TÁC" nằm in hoa ngay trong file thông điệp (`app.essentials.catalog.eyebrow`, ngoài phạm vi lane), cần đổi thành chữ thường.
Luật: `page-header-left-sublabel-xs.md`, `type-scale-14-12.md`, `pink-page-surface-rule.md`.
Grammar: `Page chrome="panes" header={{ breadcrumbs: "root", title, meta, status }}` (`frame/Page/index.d.ts`, `frame/PageHeader/index.d.ts`), `Badge tone="neutral"` (`leaf/Badge/index.d.ts`). Code: `fe/apps/app/src/components/blocks/EssentialsCatalog/component.tsx` (`bandOf`, `FactChips`).

## Lệnh chính "Tiếp tục học" (chỉ khi học viên Premium đang học dở)
Vì sao: nút chính duy nhất của trang, nằm bên phải dải, có biểu tượng đứng đầu. Không hiện khi chưa có bài dang dở, và không dùng nút nâng cấp Premium ở đây (đường vào Premium đã có ở sidebar và aside). Icon đứng đầu là `PlayGlyph` (Tabler outline "player-play", định nghĩa ở leaf Icon của starci-next-ui như các glyph khác); không còn mũi tên cuối.
Luật: `verify-against-visualize.md` (chỉ nút chính `commit` md/lg có icon), `page-header-left-sublabel-xs.md`.
Grammar: `Button intent="commit" startContent={<Icon source={PlayGlyph} />} href` (`leaf/Button/index.d.ts`, `startContent` chỉ cho nút chính md). Code: `fe/packages/starci-next-ui/src/leaves/Icon/index.tsx` (`PlayGlyph`), `fe/packages/starci-next-ui/src/composites/CatalogContinue/index.tsx` (`variant="command"`).

## Thẻ "Tiếp tục học" trên well (chỉ khi có bài dang dở)
Vì sao: bài đang học là một hàng của thẻ danh sách (tên bài, dòng 12 muted chỉ pha đã tới), cả hàng là đích bấm. Không phải thẻ một câu lẻ. Nhãn nằm trên well, phía trên thẻ.
Luật: `table-heroui-native-section-head.md` (một câu lẻ không phải là thẻ; làm thành hàng của thẻ danh sách), `pink-page-surface-rule.md` (nhãn khối nằm trên well, trên thẻ).
Grammar: `SurfaceCard kind="list" label items[{ title, description, onPress }]` (`frame/SurfaceCard/index.d.ts`). Code: `CatalogContinue/index.tsx` (`variant="card"`).

## Thẻ tìm kiếm và bộ lọc
Vì sao: một thẻ làm một việc là lọc, chỉ gồm hai vùng header và không có thân: vùng `filter` (tab độ khó "Tất cả / Nền tảng / Trung cấp / Nâng cao") rồi vùng `search` (ô tìm kiếm, kèm hai ô chọn Ngôn ngữ và Cloud ở mép cuối cùng hàng, đúng `filters` của vùng). Lọc xong, danh sách chuyển từ hàng topic sang hàng bài học. Thẻ không còn thân thừa; Grammar vẽ một đường kẻ duy nhất giữa hai vùng.
Luật: `surfacecard-zones-api.md` (filter, search, toolbar là vùng header của thẻ), `pink-page-surface-rule.md` (thẻ nổi trắng, bóng, không viền, trên well).
Grammar: `SurfaceCard kind="list" items={[]} headers=[{ kind: "filter", … }, { kind: "search", …, filters: SelectZoneField[] }]` (`frame/SurfaceCard/index.d.ts`, `surfaceCardData.d.ts` `HeaderZone`, `SearchZoneFields`, `SelectZoneField`). Code: `fe/packages/starci-next-ui/src/composites/CatalogToolbar/index.tsx`.

## Nhãn nhóm trên well + chip đếm ("Backend nền tảng  1 topic")
Vì sao: mỗi trong 16 nhóm có nhãn 14/500 và chip xám 12 ở bên trái, nằm trên well ngay phía trên thẻ của nó, đúng luật "nhãn khối nằm trên well". Mỗi nhóm một thẻ riêng, không thẻ trong thẻ. Nhóm không có bài nào khớp bộ lọc thì không hiện.
Luật: `table-heroui-native-section-head.md` (nhãn 14/500 + chip đếm trái, không có mô tả dưới nhãn), `pink-page-surface-rule.md`.
Grammar: `SurfaceCard kind="list" label fact` (`frame/SurfaceCard/index.d.ts` `CardHead.fact`). Code: `fe/packages/starci-next-ui/src/composites/CatalogSection/index.tsx`.

## Hàng topic (tên topic, nguồn, "1/5 bài đã mở", chip trạng thái, mũi tên)
Vì sao: một topic là một hàng: tên danh từ (500), dòng muted là nguồn bài, số bài đã mở ở cuối hàng, chip muted là trạng thái (Miễn phí: tổng quan + Bị hỏi cho học viên chưa Premium), mũi tên dẫn vào topic. Hàng là `<a>` thật (`href`; mở tab mới, sao chép liên kết được) và từ Grammar 0.37.14 vẽ chevron, không ↗ ở tên. Hàng thay cho thẻ topic cũ có ba dòng xem trước lặp lại.
Luật: `table-heroui-native-section-head.md` (một nội dung mỗi thẻ: danh sách), `type-scale-14-12.md`, memory `verify-against-visualize.md` (không ↗ cho mục điều hướng).
Grammar: `ListRowData { title, description, badges, meta, href }` (Grammar 0.37.14 (`node_modules/@starci/grammar/dist/core/surfaceCardData.d.ts` ListRowDestination, `node_modules/@starci/grammar/dist/core/leaf/Link/index.d.ts` variant="plain")). Đã rõ. Code: `CatalogSection/index.tsx` (`rowsOf`); điều hướng client đi qua `RouterProvider` ở `components/providers/AppProviders`. SAI ở 390: nhãn nhóm ("Backend nền tảng") co chiều cao về 0, chỉ còn chip đếm.

## Ghi chú dưới thẻ ("Còn 12 bài nguồn trong nhóm này đang được chuyển...")
Vì sao: thông tin phụ của nhóm (còn bao nhiêu bài đang chuyển sang dạng tương tác) là dòng 12 muted dưới thẻ, không phải thẻ riêng.
Luật: `type-scale-14-12.md`, `table-heroui-native-section-head.md`.
Grammar: `SurfaceCard note` (`frame/SurfaceCard/index.d.ts`). Code: `CatalogSection/index.tsx`.

## Nhóm "Bài toán thực chiến" (4 bài toán, chưa mở)
Vì sao: bộ sưu tập bài toán ghép nhiều bài là một nhóm như các nhóm khác: nhãn trên well, một thẻ danh sách, mỗi hàng là một bài toán (tên, dòng "Cần trước: ...", chip "BÀI TOÁN" và "Sắp có"). Hàng chưa mở nên không có đích bấm. Thay thế khối thẻ lưới CaseStudyBlock cũ.
Luật: `table-heroui-native-section-head.md`, `pink-page-surface-rule.md`.
Grammar: `SurfaceCard kind="list"` như trên. Code: `EssentialsCatalog/component.tsx` (`casesNodeOf`).

## Trạng thái rỗng khi không có kết quả
Vì sao: bộ lọc không khớp gì thì một thẻ danh sách rỗng chứa EmptyNotice với nút trung tính "Xóa bộ lọc" (chữ, không icon), không để trống well.
Luật: ghi chú brief (trạng thái rỗng sống TRONG thẻ), `verify-against-visualize.md`.
Grammar: `SurfaceCard kind="list" empty={<EmptyNotice actionIntent="neutral">}` (`composite/EmptyNotice/index.d.ts`). Code: `component.tsx` (`NoResult`).

## Trạng thái lỗi và đang tải
Vì sao: SAI — lần đọc đầu tải xong thì các thẻ vẽ khung xương trong chính thẻ (tốt), nhưng khi lỗi, `SlotView` (`fe/packages/starci-next-ui/src/composites/SlotView/index.tsx`, ngoài phạm vi lane) vẽ một `Alert` ngoài thẻ với nút thử lại, trái luật "lỗi nằm trong thẻ, nút Thử lại trung tính". Lint `slot-status-through-slotview` bắt buộc đi qua `SlotView`, nên cần sửa ở SlotView.
Luật: ghi chú brief (trạng thái rỗng, đang tải, lỗi sống TRONG thẻ với EmptyNotice).
Grammar: `SurfaceCard error={{ message, actionLabel, onAction }}` (`frame/SurfaceCard/index.d.ts`, `loadingState.d.ts`).

## Aside phải: "Nhóm kiến thức" (Tất cả 7, 16 nhóm với số bài đã mở)
Vì sao: aside trắng, viền trái, toàn chiều cao, là điều hướng nhóm: một mục "Tất cả" rồi 16 nhóm mỗi nhóm kèm số bài đã mở bằng chữ 12 muted; nhóm đang chọn được đánh dấu; chọn một nhóm thì well chỉ còn nhóm đó. Cuộn riêng khi dài. Dưới lg aside xuống thành khối đầu tiên của well (grid đổi sang một cột, aside trước). Đã rõ: Grammar 0.37.14: `Section kind="list"` trong `Pane surface` vẽ phẳng trên mặt trắng, không viền, không prop (`node_modules/@starci/grammar/dist/core/frame/Section/index.d.ts`); ảnh 1440 xác nhận.
Luật: `pink-page-surface-rule.md` (aside = section và hàng có divider, không thẻ nổi), `nivo-surface-layering.md`, `type-scale-14-12.md`.
Grammar: `Pane area="aside" surface scroll` + `PaneGrid areas={{ base: ["aside","main"], wide: ["main aside"] }}` (`frame/PaneGrid/index.d.ts`), `Section kind="list" items[{ meta, state, onPress }]` (`frame/Section/index.d.ts`). Code: `fe/packages/starci-next-ui/src/composites/CatalogAside/index.tsx`.

## Aside phải: hàng Premium (chỉ học viên chưa Premium, nằm dưới danh sách nhóm)
Vì sao: lời mời Premium ("Mở hết với Premium" cùng dòng ghi chú) là một hàng của section "Premium" dưới đường kẻ, thay cho hàng nâng cấp trong thẻ giới thiệu cũ. Hàng là `<a href>` tới trang gói (chevron, không ↗). Tên "Premium" là tên gói, cố định trong mã.
Luật: `pink-page-surface-rule.md` (aside = section có divider), `table-heroui-native-section-head.md` (một câu lẻ là một hàng của danh sách).
Grammar: `Divider` (`leaf/Divider/index.d.ts`), `Section kind="list"`. Code: `CatalogAside/index.tsx`.

## Well giữa (nền hồng, thẻ trắng nổi, tối đa 80rem)
Vì sao: chỉ phần giữa có `--background`, mọi nhóm là thẻ riêng cách nhau 24, nội dung cuộn trong pane và bị chặn ở 80rem, căn giữa.
Luật: `pink-page-surface-rule.md`, `nivo-surface-layering.md`, `page-header-left-sublabel-xs.md`.
Grammar: `Pane area="main" scroll content="cards"` (`frame/PaneGrid/index.d.ts`), `Stack gap="region"`. Code: `EssentialsCatalog/component.tsx`.

## Thẻ chương: ảnh bìa 3D thu nhỏ
Vì sao: mỗi dòng chương trong nhóm có ảnh bìa 3D của chương (`public/art/topics/<topicId>.webp`) làm ảnh nhỏ đầu dòng, trang trí (không chữ thay thế), cùng ảnh với hero trang chương. Ảnh bo vuông mềm, kích cỡ md.
Luật: `verify-against-visualize.md`, `pink-page-surface-rule.md`.
Grammar: `ListRowData.leading.avatar { src, shape: "rounded" }`, `size: "md"` (`surfaceCardData.d.ts` ItemLeading, AvatarData). Vì sao: CHƯA RÕ: ảnh nhỏ (khoảng 40px) nên chi tiết 3D khó đọc; cần Grammar một `leading.image` lớn hơn cho dòng danh sách nếu chủ muốn.
