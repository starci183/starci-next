---
title: Dự án (danh sách)
route: /projects
area: projects
reviewed: 2026-11-17
---

Route: `/projects`. Học viên thử nghiệm (ảnh chụp: chưa có dự án nào nên thấy trạng thái rỗng, không phải lỗi). Mã: `fe/apps/app/src/components/blocks/ProjectsList/`. Trang trắng, các lớp ngăn bằng đường kẻ 1px, danh sách phẳng dưới đầu mục, không thẻ.

## Băng đầu trang (Dự án, mô tả, Tạo dự án)

Vì sao: băng trắng, tiêu đề 18/600 sát trái, một dòng mô tả 12 muted nói cách dùng ("đặt thư mục starci/ trong mỗi dự án"); lệnh chính duy nhất của trang là nút pill "Tạo dự án" có icon dấu cộng, màu accent. Ở 390 nút nằm cạnh mô tả, mô tả xuống hai dòng.
Luật: `surface-layering` (một nút chính, chỉ CTA chính có icon), `page-header-left-sublabel-xs.md`.
Grammar: `Page header={{ title, description, actions }}` và `Button intent="commit" startGlyph="plus"`.

## Đầu mục "Dự án của bạn" + chip đếm

Vì sao: nhãn khối là đầu mục Section nằm thẳng trên mặt trắng, kèm chip đếm xám (0); không còn thẻ bao quanh.
Luật: `surface-layering` (danh sách là Section, không thẻ), `type-scale-14-12.md`.
Grammar: `Section title count` (`frame/Section`).

## Thanh lọc (tab + tìm kiếm)

Vì sao: ba tab Tất cả / Đang luyện / Đã chứng minh, mỗi tab có chip đếm xám, tab chọn có gạch chân màu foreground (không phải accent); dưới là ô tìm kiếm trắng viền 1px, bo pill. Lọc và tìm cùng một danh sách. Đang luyện = còn concept chưa chứng minh; Đã chứng minh = mọi concept đã chứng minh.
Luật: `theme-and-type` (tab chọn là gray/foreground, field trắng viền 1px).
Grammar: `Tabs` và `Input kind="search"` trong thân `Section`.

## Hàng dự án (khi có dữ liệu)

Vì sao: không có trong ảnh (danh sách rỗng). Khi có, mỗi hàng phẳng, ngăn bằng đường kẻ: ô icon, tên (500), dòng 12 muted "repo · công nghệ", "n/m concept đã chứng minh", thanh tiến độ nhỏ ở cuối hàng, chip trạng thái và mũi tên; cả hàng là `<a href>`.
Luật: `surface-layering`, `type-scale-14-12.md`.
Grammar: `Section kind="list"` với `ListRowData { leading.icon, description, badges, meta, control, href }`, `Progress` qua `RowProgress` (`fe/packages/starci-next-ui/src/composites/RowProgress`). CHƯA RÕ: control của hàng không có bề rộng riêng nên `Progress` phải bọc 7rem.

## Trạng thái rỗng "Bạn chưa có dự án nào"

Vì sao: nằm ngay dưới thanh lọc, không khung: ô icon hộp thư xám nhạt, tiêu đề, một dòng mô tả muted và liên kết "Tạo dự án →" (liên kết điều hướng nên có mũi tên). Lỗi đọc dùng cùng chỗ với nút trung tính "Thử lại"; đang tải là skeleton cùng hình hàng.
Luật: `surface-layering` (rỗng, tải, lỗi nằm trong section), `grammar-slot-interface`.
Grammar: `EmptyNotice frame="frameless"`, `SlotView`, `Link`.

## Aside "Máy của bạn"

Vì sao: cột aside trắng, ngăn với phần giữa bằng đường kẻ; đầu mục, chip "Chưa kết nối" có chấm vòng rỗng, một đoạn 12 muted và nút trung tính sm "Kết nối máy" (không icon) tới /devices.
Luật: `surface-layering` (aside không phải thẻ; nút sm không icon).
Grammar: `Pane area="aside" surface scroll`, `Section`, `Badge isDot`, `Button intent="neutral" size="sm"`.

## Aside "Mức chứng minh"

Vì sao: hai hàng Đang luyện / Đã chứng minh, mỗi hàng có phụ đề 12 muted, ngăn nhau bằng đường kẻ. CHƯA RÕ: ảnh vẽ hai hàng này trong một khung bo viền như thẻ, trái luật "aside không phải thẻ"; cần bỏ khung, chỉ giữ đường kẻ.
Luật: `surface-layering`.
Grammar: `Section kind="list"`.

## Bố cục điện thoại (390)

Vì sao: dưới lg aside xếp thành các khối đầu của trang (Máy của bạn, Mức chứng minh), rồi mới tới "Dự án của bạn"; trang cuộn một lần, các khối ngăn bằng đường kẻ ngang.
Luật: `surface-layering` (dưới lg aside thành khối đầu của trang).
Grammar: `PaneGrid areas={{ base: ["aside","main"], wide: ["main aside"] }}`.
