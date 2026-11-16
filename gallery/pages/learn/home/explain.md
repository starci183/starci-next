---
title: Học (khung ứng dụng)
route: /
area: learn
---

Route: `/` (starci-next). File này giải thích KHUNG chung của mọi trang đã đăng nhập (thanh bên và thanh trên). Các vùng thân trang do trang viết ở mục tương ứng. Đường dẫn Grammar nằm dưới `node_modules/@starci/grammar/dist/core/`. Toàn trang trắng: thanh trên, thanh bên, thân và cột phụ chỉ ngăn nhau bằng đường kẻ 1px, không bóng, không giếng tô màu.

## Shell

Vì sao: khung của starci-next là CÙNG MỘT khung với console NIVO: `WorkspaceShell viewport="fixed" align="stretch"` với `header` = thanh trên, `navigation` = sidebar cao dưới thanh trên, `navigationTrack="intrinsic"`, `navigationVisibility="wide"` và `navigationDrawer` của Grammar dưới bề ngang rộng. Các trang khác trỏ về mục này cho phần khung. Ở 390 sidebar ẩn, Grammar vẽ hàng "Mở menu" dưới thanh trên; cột phụ thành các khối đầu tiên của thân.
Luật: `app-shell`, `surface-layering` (chrome trắng, phẳng, chỉ đường kẻ), `theme-and-type`; chuỗi ngày ở cột phụ trang Học, không có chuông (owner 2026-11-10).
Grammar: `WorkspaceShell` {header, navigation, navigationTrack, navigationVisibility, navigationDrawer} (`frame/WorkspaceShell/index.d.ts`); code `fe/packages/starci-next-ui/src/frames/SiteShell`, `fe/apps/app/src/features/layouts/AppLayout/index.tsx`.

## Thanh bên (Sidebar)

Vì sao: nút tròn « thu gọn ở góc, nhóm đầu không tiêu đề (Học, Bản chất, Ôn tập, Phỏng vấn thử, Luyện code, Sự cố, Dự án, Agent và AI) với icon outline, đường kẻ, nhãn nhóm 12 mờ "Kinh nghiệm" rồi "Kinh nghiệm đã xác minh", "Kết nối AI", "Hồ sơ". Mục đang xem nền xám với thanh accent 2px ở đầu (accent không tô cả mục). Không có chip đếm và không có chân sidebar: gói hiện ở dòng lockup trên thanh trên và trong menu avatar.
Luật: `surface-layering`, `theme-and-type` (chọn là xám, thanh accent 2px), `type-scale-14-12.md`; plan in the lockup line and the avatar menu, no sidebar footer (owner 2026-11-10).
Grammar: `Sidebar` {groups, selectedKey, isCollapsed, onCollapsedChange, header, onAction} (`composite/Sidebar/index.d.ts`); code `fe/apps/app/src/components/blocks/AppSidebar`.

## Thanh trên (TopBar)

Vì sao: bên trái `IdentityLockup` (logo, "StarCi Next" và dòng 12 mờ "Học viên · Premium", bấm về trang chủ); bên phải nút tròn đổi ngôn ngữ có dropdown, công tắc sáng/tối và avatar tài khoản (khách: "Đăng nhập" mở hộp thoại tại chỗ; đã đăng nhập: menu tài khoản, xem `learn/home-account-menu`). Ngôn ngữ và giao diện chỉ hiện từ 70rem; dưới đó vào Drawer. Chuông CHƯA có: `AppHeader` đã nối `customButtons` rỗng nhưng ứng dụng chưa có trang thông báo.
Luật: `surface-layering`, `locale-switch-round-dropdown.md`, `signed-out-header-avatar-modal.md`.
Grammar: `TopBar position="sticky" brand actions`, `IdentityLockup size="control"`, `DropdownMenu`, `IconButton`, `Switch kind="toggle"`, `AvatarButton`; code `fe/apps/app/src/components/blocks/AppHeader`.

## Giao diện và phông

Vì sao: bộ màu trắng với accent tím riêng của StarCi Next và phông IBM Plex Sans (latin, vietnamese) nằm ở một tệp thương hiệu duy nhất; accent chỉ là tín hiệu (nút chính, focus, điều khiển đã chọn).
Luật: `theme-and-type`.
Grammar: token trong `fe/apps/app/src/modules/brand/brand.css`; phông `next/font/google` `--font-brand`.

## Dải tiêu đề (trang Học)

Vì sao: dải trắng, đường kẻ dưới, tiêu đề "Học" 18/600 dính lề trái, dòng phụ 12 mờ "Sáu phần học, một chuỗi ngày" và một lệnh bên phải là "Xem hướng dẫn" (nút trung tính dạng viên thuốc, không icon) mở hộp thoại tại chỗ. Trang không có nút chính ở dải.
Luật: `page-header-left-sublabel-xs.md`, `surface-layering` (chỉ nút chính mới có icon).
Grammar: `Page chrome="panes" layout="workspace" header={{ title, description, actions }}`, `Dialog trigger` + `Button intent="neutral"`; code `fe/apps/app/src/components/blocks/LearnHub/component.tsx`.

## Phần: "Lộ trình đang theo"

Vì sao: một phần phẳng trên nền trắng dưới đầu phần "Lộ trình đang theo", không thẻ. Bên trái hình minh hoạ (Mascot md, tranh ngang 160px), bên phải câu hỏi "Bạn học để làm được gì?" (500), một dòng mờ và nút chính "Chọn mục tiêu" có icon (md): đây là MỘT nút chính của màn. Khi đã theo lộ trình: tên lộ trình, "Bước tiếp theo", nút "Làm tiếp" và nút trung tính "Đổi mục tiêu". Ghi chú lỗi ảnh: giữa đầu phần và nội dung còn một khoảng trống cao khoảng 50px ở 1440 và 1920; ở 390 hình thu nhỏ, nằm lệch trái, bỏ trống bên phải.
Luật: `surface-layering` (một nút chính, nút chính md có icon, phần phẳng không thẻ).
Grammar: `Section title headingLevel={2}`, `Mascot size="md" assetSlot`, `Button intent="commit" startContent`; code `fe/packages/starci-next-ui/src/composites/HubPathCard`.

## Phần: "Hôm nay"

Vì sao: một danh sách phẳng dưới đầu phần: "Hôm nay" + chip đếm xám, câu 12 mờ "Còn n việc để giữ chuỗi" ở cuối đầu phần. Mỗi dòng là điều hướng: IconTile theo phần học + tiêu đề 500 + tên phần 12 mờ + mũi tên ›, ngăn nhau bằng đường kẻ 1px; dòng là `<a>` thật, không ↗. Hết việc: dòng trống nằm trong phần. CHƯA RÕ: câu tóm tắt đi qua `meta` của Section, Grammar chưa có chỗ chính thức cho nó. Đã rõ: ở 390 nhãn "Hôm nay" hiện đủ cùng chip.
Luật: `surface-layering` (danh sách là Section trên nền, không thẻ; icon đứng một mình là IconTile), `type-scale-14-12.md`.
Grammar: `Section kind="list" title count meta items[].leading.icon items[].href`; code `fe/packages/starci-next-ui/src/composites/HubTodayCard`.

## Cột phụ: "Chuỗi ngày học"

Vì sao: cột trắng 320px (1440; rộng hơn ở 1920), đường kẻ trái, các mục là phần ngăn bằng đường kẻ, không thẻ. Số lớn 20 "0" kèm "ngày liên tiếp" (mờ), dòng 12 mờ "Dài nhất n ngày · n lần nghỉ còn lại" và hàng bảy ngày T4..T3 với chấm rỗng; hôm nay có vòng echo. Ở 390 các phần của cột phụ đứng trước "Lộ trình đang theo".
Luật: `surface-layering` (aside là phần có đường kẻ, không thẻ), `type-scale-14-12.md`.
Grammar: `Section title headingLevel={2}`, `Text size="figure"`, `StatusDot tone size="lg" echo`; code `fe/packages/starci-next-ui/src/composites/HubStreakCard`.

## Cột phụ: "Mục tiêu tuần"

Vì sao: đầu phần + chip xám "0/4 ngày", thanh Progress (rãnh xám rất nhạt, 0%) và nút trung tính "Đổi mục tiêu tuần" (viên thuốc, không icon). Bấm nút mở lựa chọn 2 đến 7 ngày tại chỗ.
Luật: `surface-layering` (nút trung tính không icon), `type-scale-14-12.md`.
Grammar: `Section fact`, `Progress label value valueText`, `ChoiceChips`, `Button intent="neutral" size="sm"`; code `HubStreakCard`, `fe/packages/starci-next-ui/src/composites/HubGoalEditor`.

## Cột phụ: "Kinh nghiệm"

Vì sao: hai dòng "Đã xác minh" và "Chờ thầy duyệt", mỗi dòng một chip đếm xám, và liên kết điều hướng "Xem kinh nghiệm →" ở cuối đầu phần (màu foreground, mũi tên →).
Luật: `surface-layering` (liên kết điều hướng ở đầu phần kết bằng →), `red-budget-links-foreground`.
Grammar: `Section action={<Link variant="head">}`, `Badge tone="neutral"`; code `fe/packages/starci-next-ui/src/composites/HubExperience`.
