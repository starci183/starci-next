---
title: Dự án (danh sách)
route: /projects
area: projects
---
Route: `/projects`. Học viên thử nghiệm (ảnh chụp có một dự án; khi chưa có dự án trạng thái rỗng hiện trong thẻ, không phải lỗi). Grammar ở `node_modules/@starci/grammar/dist/core/`. Mã: `fe/apps/app/src/components/blocks/ProjectsList/`.

## Băng đầu trang (Dự án, sublabel, Tạo dự án)
Vì sao: băng trắng, tiêu đề 18/600 sát trái, một dòng phụ nói cách dùng ("đặt thư mục starci/ trong mỗi dự án"); lệnh chính duy nhất "Tạo dự án" có icon dấu cộng ở bên phải.
Luật: `page-header-left-sublabel-xs.md`, `verify-against-visualize.md` (chỉ CTA chính có icon).
Grammar: `Page header={{ title, description, actions }}` và `Button intent="commit" startGlyph="plus"` (`frame/Page/index.d.ts`, `leaf/Button/index.d.ts`).

## Nhãn "Dự án của bạn" + chip đếm
Vì sao: nhãn khối nằm trên thẻ, chip xám đếm số dự án (hồng chỉ khi có việc đang chờ, ở đây thì không).
Luật: `table-heroui-native-section-head.md`.
Grammar: `SurfaceCard kind="list" label count` (`frame/SurfaceCard/index.d.ts`, `CardHead`).

## Thẻ danh sách duy nhất: toolbar (tab + tìm kiếm)
Vì sao: một thẻ, một nội dung (danh sách). Tab Tất cả / Đang luyện / Đã chứng minh có chip đếm xám, ô tìm kiếm bên phải; lọc và tìm cùng một danh sách. Đang luyện = còn concept chưa chứng minh; Đã chứng minh = mọi concept đã chứng minh.
Luật: `surfacecard-zones-api.md`.
Grammar: `SurfaceCard headers=[{ kind: "toolbar", filter, search }]` (`surfaceCardData.d.ts` HeaderZone).

## Hàng dự án (có dữ liệu)
Vì sao: IconTile outline + tên (500) + 12 muted "repo · công nghệ", dòng 12 muted "3/8 concept đã chứng minh" (`meta` của hàng), thanh tiến độ nhỏ ở cuối hàng là `control` (Grammar `Progress` rộng 7rem qua composite `RowProgress`), chip trạng thái, mũi tên của liên kết điều hướng. Danh từ là tên hàng, không có nút trong hàng. Ảnh chụp có một dự án thật ("Shop bán sách", 0/6 concept). Hàng là `<a href>` thật; từ Grammar 0.37.14 (`node_modules/@starci/grammar/dist/core/surfaceCardData.d.ts` ListRowDestination, `node_modules/@starci/grammar/dist/core/leaf/Link/index.d.ts` variant="plain") nó vẽ chevron, không ↗ (đã rõ).
Luật: `table-heroui-native-section-head.md`, `type-scale-14-12.md`.
Grammar: `ListRowData { leading.icon, description, badges, meta, control, href }`, `Progress` (`leaf/Progress/index.d.ts`). `Progress` không có nhãn hiển thị (chỉ nhãn truy cập), nên chữ "n/m" đi bằng `meta`. Code: `fe/packages/starci-next-ui/src/composites/RowProgress/index.tsx`. CHƯA RÕ: control của hàng không có bề rộng riêng nên phải bọc 7rem; cần Grammar cho `Progress` kích thước nội tại khi làm control.

## Trạng thái rỗng / lỗi / đang tải trong thẻ
Vì sao: rỗng = EmptyNotice không khung trong thẻ với "Bạn chưa có dự án nào" và liên kết "Tạo dự án →"; lỗi = `error` của thẻ ("Không tải được dự án", lý do, nút "Thử lại"); đang tải = skeleton cùng hình hàng. Đây là gốc lỗi cũ: câu "Không tải được dự án." từng là chữ của trạng thái RỖNG (key `app.projects.empty`), nên học viên chưa có dự án thấy báo lỗi dù API trả `[]`. Đã sửa chữ và tách trạng thái lỗi thật.
Luật: `unhandled-case-tells-customer.md` (không im lặng, không nói sai), brief: trạng thái nằm trong thẻ.
Grammar: `SurfaceCard error` (`loadingState.d.ts` ErrorData), `empty`, `isLoading`; `EmptyNotice frame="frameless"` (`composite/EmptyNotice/index.d.ts`).

## Aside "Máy của bạn"
Vì sao: mục của khung bên (chrome trắng, đường kẻ, không thẻ nổi): chấm trạng thái "Chưa kết nối", một dòng 12 muted, nút trung tính sm "Kết nối máy" (không icon) dẫn tới /devices.
Luật: `pink-page-surface-rule.md`, `nivo-surface-layering.md`, `suggestion-button-sm.md`.
Grammar: `Pane area="aside" surface scroll`, `Section`, `Badge isDot`, `Button intent="neutral" size="sm"`.
CHƯA RÕ: chấm là `Badge isDot` đặc, chưa phải vòng rỗng như bản vẽ; Grammar chưa có chấm vòng rỗng.

## Aside "Mức chứng minh"
Vì sao: hai hàng Đang luyện / Đã chứng minh, mỗi hàng có phụ đề 12 muted, ngăn bằng đường kẻ với mục trên.
Luật: `nivo-surface-layering.md`.
Grammar: `Section kind="list"` (`frame/Section/index.d.ts`).
Đã rõ: Grammar 0.37.14: `Section kind="list"` trong `Pane surface` vẽ phẳng trên mặt trắng, không viền, không prop (`node_modules/@starci/grammar/dist/core/frame/Section/index.d.ts`); ảnh 1440 xác nhận (hai hàng có đường kẻ, phụ đề 12 muted là `description` chuỗi thường).

## Bố cục điện thoại (390)
Vì sao: dưới lg aside xếp thành khối đầu tiên của giếng. Từ Grammar 0.37.14 PaneGrid xếp chồng giãn theo nội dung (`data-grammar-pane-stacked="grow"`, `node_modules/@starci/grammar/dist/core/frame/PaneGrid/index.d.ts`): trang cuộn một lần, aside đứng trước, không còn cắt hàng; ảnh chụp 390 không cần `CAPTURE_HEIGHT`. SAI còn lại: nhãn "Dự án của bạn" co chiều cao về 0 ở 390 (chỉ còn chip đếm), xem Grammar needs.
Luật: `pink-page-surface-rule.md`.
Grammar: `PaneGrid areas/rows` (`frame/PaneGrid/index.d.ts`).
