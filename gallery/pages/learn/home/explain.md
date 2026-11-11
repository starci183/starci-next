---
title: Học (khung ứng dụng)
route: /
area: learn
---
Route: `/` (starci-next). File này giải thích KHUNG chung của mọi trang đã đăng nhập (thanh bên và thanh trên). Các vùng thân trang (dải tiêu đề, giếng, cột phụ) do lane của trang viết ở mục tương ứng. Đường dẫn Grammar nằm dưới `node_modules/@starci/grammar/dist/core/`. Vòng "N" tròn là lớp phủ của Next dev, không phải UI.

## Shell
Vì sao: khung của starci-next là CÙNG MỘT khung với console NIVO: `WorkspaceShell viewport="fixed" align="stretch"` với `header` = thanh trên, `navigation` = sidebar cao dưới thanh trên (không còn sidebar cao hết màn hình), `navigationTrack="intrinsic"`, `navigationVisibility="wide"` và `navigationDrawer` của Grammar bên dưới bề ngang rộng. Chủ sở hữu muốn đồng bộ kiểu điều hướng giữa NIVO và starci-next. Các trang khác trỏ về mục này cho phần khung.
Luật: nav parity with NIVO console; streak in the Học aside, no bell (owner 2026-11-10); `pink-page-surface-rule.md`, `nivo-surface-layering.md` (chrome = `--surface`, phẳng, chỉ viền).
Grammar: `WorkspaceShell` {header, headerLandmark="slot", navigation, navigationLabel, navigationTrack, navigationVisibility, navigationDrawer} (`node_modules/@starci/grammar/dist/core/frame/WorkspaceShell/index.d.ts`); phản chiếu `D:/starci-lanes/nivo-auth-ux/fe/apps/web/src/features/layouts/ConsoleLayout/component.tsx`; code `fe/packages/starci-next-ui/src/frames/SiteShell`, `fe/apps/app/src/features/layouts/AppLayout/index.tsx`.

## Thanh bên (Sidebar)
Vì sao: dựng như `ConsoleSidebar` của NIVO: nút tròn « thu gọn ở góc (nhớ lựa chọn trong trình duyệt), nhóm đầu không tiêu đề (Học, Bản chất, Ôn tập, Phỏng vấn thử, Luyện code, Sự cố, Dự án, Agent và AI) với icon outline, đường kẻ, nhãn nhóm 12 mờ "Kinh nghiệm" rồi "Kinh nghiệm đã xác minh", "Hồ sơ". Mục đang xem tô nền accent nhạt. Không có chip đếm vì khung chưa có số việc chờ học viên (Ôn tập đến hạn sẽ là chip khi dữ liệu có ở khung). Thương hiệu không còn ở sidebar mà ở thanh trên, như NIVO. Sidebar chỉ có điều hướng, không có chân (chủ sở hữu 2026-11-10, bản vẽ "B", "B đi"): gói hiện ở dòng lockup trên thanh trên và trong menu avatar. Ở 390 sidebar ẩn, Grammar vẽ hàng "Mở menu" dưới thanh trên giữ nút mở Drawer; trong Drawer, ngôn ngữ và giao diện nằm ở `header` của Sidebar phía trên các mục.
Luật: nav parity with NIVO console; plan in the lockup line and the avatar menu, no sidebar footer (owner 2026-11-10, 'B đi'); `nivo-surface-layering.md`, `type-scale-14-12.md`, `table-heroui-native-section-head.md` (mục điều hướng không ↗).
Grammar: `Sidebar` {groups, selectedKey, presentation, isCollapsed, collapseLabel, expandLabel, toggleSource, onCollapsedChange, header, onAction} (`node_modules/@starci/grammar/dist/core/composite/Sidebar/index.d.ts`); phản chiếu `D:/starci-lanes/nivo-auth-ux/fe/apps/web/src/components/composites/ConsoleSidebar/index.tsx`, `ConsoleNavigation`, `ConsoleDrawerContent`; code `fe/apps/app/src/components/blocks/AppSidebar`.

## Thanh trên (TopBar)
Vì sao: dựng như `ConsoleHeader` của NIVO: bên trái `IdentityLockup` (logo, "StarCi Next" và dòng 12 mờ "Học viên · gói", bấm về trang chủ); bên phải nút tròn đổi ngôn ngữ có dropdown (giữ nguyên), công tắc sáng/tối và avatar tài khoản (khách: avatar khách, "Đăng nhập" mở hộp thoại tại chỗ; đã đăng nhập: hàng danh tính email + dòng gói, rồi "Nâng cấp Premium" (hoặc "Gói của bạn" khi đã Premium) trỏ trang Premium, "Hồ sơ", "Đăng xuất"; xem màn `learn/home-account-menu`). Dòng gói trong lockup ("Học viên · Chưa có Premium") là nơi đọc gói. Ngôn ngữ và giao diện chỉ hiện từ 70rem như NIVO; dưới đó nằm trong Drawer. Chip chuỗi ngày đã bỏ khỏi thanh trên (chuỗi ở cột phụ trang Học); chuông CHƯA có: Grammar 0.37.15 đã có `TopBar customButtons` ({ id, glyph: "bell", label, badge?, href | onPress }, `node_modules/@starci/grammar/dist/core/composite/TopBar/index.d.ts`) và `AppHeader` đã nối sẵn (`customButtons` rỗng; `useTopBarOverflowEntries()` được trải vào menu tài khoản để ở 390 các nút thừa vào menu), nhưng ứng dụng chưa có trang thông báo để chuông trỏ tới (chỉ có hook `hooks/notifications` chưa ai dùng), nên chuông bị bỏ; thêm `{ id: "bell", glyph: "bell", label: "Thông báo", href, badge: unreadCount > 0 }` khi có trang đó. CHƯA RÕ: chờ trang thông báo (ngoài phạm vi lane).
Luật: nav parity with NIVO console; plan in the lockup line and the avatar menu, no sidebar footer (owner 2026-11-10, 'B đi'); bell goes to TopBar customButtons once Grammar ships it (owner 2026-11-10); `locale-switch-round-dropdown.md`, `signed-out-header-avatar-modal.md`, `nivo-surface-layering.md`.
Grammar: `TopBar position="sticky" brand actions` (`node_modules/@starci/grammar/dist/core/composite/TopBar/index.d.ts`), `IdentityLockup size="control"` (`node_modules/@starci/grammar/dist/core/composite/IdentityLockup/index.d.ts`), `DropdownMenu`, `IconButton`, `Switch`, `AvatarButton`; phản chiếu `D:/starci-lanes/nivo-auth-ux/fe/apps/web/src/components/blocks/ConsoleHeader/component.tsx`; code `fe/apps/app/src/components/blocks/AppHeader`.

## Giao diện và phông
Vì sao: chủ sở hữu duyệt bộ màu và phông Inter (latin, vietnamese) nên bảng màu dán nguyên văn sau `@heroui/styles`; lớp thương hiệu cũ không còn được nạp.
Luật: `owner-colors-exact.md`.
Grammar: token HeroUI trong `fe/apps/app/src/app/globals.css`; phông `fe/apps/app/src/modules/brand/font.ts`.

## Dải tiêu đề (trang Học)
Vì sao: dải trắng phẳng, viền dưới, tiêu đề "Học" 18/600 dính lề trái, dòng phụ 12 mờ "Sáu phần học, một chuỗi ngày" và một lệnh duy nhất bên phải là "Xem hướng dẫn" (nút trung tính, không icon) mở hộp thoại hướng dẫn tại chỗ. Trang không có nút chính nên không có icon ở dải. Chuỗi ngày không nằm ở dải hay thanh trên mà chỉ ở cột phụ.
Luật: `page-header-left-sublabel-xs.md`, `verify-against-visualize.md` (chỉ nút chính mới có icon), `nivo-surface-layering.md`.
Grammar: `Page chrome="panes" layout="workspace" header={{ breadcrumbs, title, description, actions }}`, `Dialog trigger` + `Button intent="neutral"` (`node_modules/@starci/grammar/dist/core/frame/Page`, `leaf/Button/index.d.ts`); code `fe/apps/app/src/components/blocks/LearnHub/component.tsx`.

## Giếng: "Lộ trình đang theo"
Vì sao: một thẻ duy nhất, nhãn nằm trên giếng. Bên trái là hình minh hoạ lần đầu (Mascot cỡ md), bên phải câu hỏi "Bạn học để làm được gì?" (500) kèm một dòng mờ và nút chính "Chọn mục tiêu" có icon (md). Khối ảnh lớn tách riêng của bản cũ đã bỏ. Khi học viên đã theo một lộ trình, thẻ giữ chỗ cũ: tên lộ trình, "Bước tiếp theo", nút chính "Làm tiếp" và nút trung tính "Đổi mục tiêu".
Luật: `pink-page-surface-rule.md` (thẻ trắng nổi, bóng, không viền, một thẻ một việc), `verify-against-visualize.md` (một nút chính, có icon), `table-heroui-native-section-head.md`.
Grammar: `SurfaceCard label`, `Mascot size="md" assetSlot`, `Button intent="commit" startContent` (`leaf/Mascot/index.d.ts`, `frame/SurfaceCard/index.d.ts`); code `fe/packages/starci-next-ui/src/composites/HubPathCard`. CHƯA RÕ: Mascot là hộp vuông, ảnh `pro-learning-journey` là tranh ngang 16:9 nên bị co nhỏ trong hộp 160px; cần ảnh vuông cho khoảng này (xem "Grammar needs").

## Giếng: "Hôm nay"
Vì sao: một thẻ danh sách duy nhất. Đầu hàng nhãn: "Hôm nay" + chip đếm xám (số việc) ở đầu, câu 12 mờ "Còn n việc để giữ chuỗi" ở cuối. Mỗi dòng là điều hướng: IconTile theo phần học (Bản chất, Luyện code, Dự án, Sự cố, Phỏng vấn thử, Ôn tập) + tiêu đề 500 (không màu liên kết, không ↗) + tên phần 12 mờ + mũi tên ›. Dòng là `<a>` thật (`href`; điều hướng client qua `RouterProvider` của ứng dụng nên không tải lại trang): từ Grammar 0.37.14 (`node_modules/@starci/grammar/dist/core/surfaceCardData.d.ts` ListRowDestination, `node_modules/@starci/grammar/dist/core/leaf/Link/index.d.ts` variant="plain") hàng `href` nội bộ vẽ chevron, không ↗. Hết việc: dòng trống nằm trong thẻ. Sáu thẻ phần học và ba thẻ lớp cũ đã bỏ (đã có ở thanh bên).
Luật: `table-heroui-native-section-head.md` (nhãn + chip xám, một nội dung một thẻ), `type-scale-14-12.md`, `verify-against-visualize.md` (ký hiệu outline, icon đứng một mình là IconTile), mục "Không ↗ cho mục điều hướng" của brief.
Grammar: `SurfaceCard kind="list" label count labelEnd items[].leading.icon items[].href` (`frame/SurfaceCard/index.d.ts`, `surfaceCardData.d.ts` ListRowData); code `fe/packages/starci-next-ui/src/composites/HubTodayCard`. CHƯA RÕ (còn lại): câu 12 mờ bên phải vẫn đi qua `labelEnd` với Text 12 mờ; Grammar ghi `labelEnd` là Link head hoặc IconButton thông tin, chưa có chỗ chính thức cho câu tóm tắt. Phần ↗ đã rõ. SAI ở 390: chữ nhãn "Hôm nay" co chiều cao về 0 (chỉ còn chip đếm), xem Grammar needs.

## Cột phụ: "Chuỗi ngày học"
Vì sao: cột trắng 320px, viền trái, các mục là phần có đường kẻ ngăn, không phải thẻ nổi. Số lớn 20 "0" kèm "ngày liên tiếp", dòng 12 mờ "Dài nhất n ngày · n lần nghỉ còn lại" và hàng bảy ngày với nhãn T4..T3. Các chấm do Grammar vẽ (`StatusDot`, ngày đã học màu accent, nghỉ màu cảnh báo, hôm nay có vòng echo), đúng như NIVO, không vẽ vòng rỗng riêng. Chuỗi chỉ sống ở đây (chủ sở hữu đã bỏ khỏi thanh trên). Dưới lg cột phụ thành các khối đầu tiên của giếng.
Luật: `pink-page-surface-rule.md` (aside = phần có đường kẻ), `nivo-surface-layering.md`, `type-scale-14-12.md` (số lớn 20, tên nhỏ 12), brief mục 1.
Grammar: `Section title headingLevel={2}`, `Text size="figure"`, `StatusDot tone size="lg" echo` (`frame/Section/index.d.ts`, `leaf/Text`, `leaf/StatusDot/index.d.ts`); code `fe/packages/starci-next-ui/src/composites/HubStreakCard`. CHƯA RÕ: luật `same-line-size` buộc "ngày liên tiếp" cùng cỡ 20 với số (mờ), trong bản vẽ nó là 14; cần Grammar cho một dòng số lớn + đơn vị.

## Cột phụ: "Mục tiêu tuần"
Vì sao: tiêu đề phần + chip xám "0/4 ngày" (chip `fact` của Section), thanh Progress của Grammar và nút trung tính cỡ sm "Đổi mục tiêu tuần" (không icon). Bấm nút mở các lựa chọn 2 đến 7 ngày tại chỗ; Lưu và Đóng cũng là nút trung tính sm.
Luật: `verify-against-visualize.md` (sm không icon), `type-scale-14-12.md`, `table-heroui-native-section-head.md` (chip xám).
Grammar: `Section fact`, `Progress label value valueText`, `ChoiceChips`, `Button intent="neutral" size="sm"` (`frame/Section/index.d.ts`, `leaf/Progress/index.d.ts`); code `HubStreakCard`, `fe/packages/starci-next-ui/src/composites/HubGoalEditor`.

## Cột phụ: "Kinh nghiệm"
Vì sao: hai dòng "Đã xác minh" và "Chờ thầy duyệt" mỗi dòng một chip đếm xám (tổng qua các phần học; chip hồng chỉ dành cho việc chờ chính học viên nên không dùng), và liên kết điều hướng "Xem kinh nghiệm →" ở cuối đầu phần (màu chính, gạch chân khi rê, mũi tên → chứ không ↗).
Luật: `table-heroui-native-section-head.md` (một liên kết "… →" bên phải đầu phần, chip xám), brief (link điều hướng dùng →), `red-budget-links-foreground` (owner 2026-11-10: link "→" ở đầu phần giữ nguyên màu accent, không đổi; chỉ link đứng một mình ngoài đầu phần mới chuyển sang foreground).
Grammar: `Section action={<Link variant="head">}`, `Badge tone="neutral"` (`frame/Section/head.d.ts`); code `fe/packages/starci-next-ui/src/composites/HubExperience`.
