---
title: Máy của bạn
route: /devices
area: devices
---

Route: `/devices` (ảnh chụp: học viên chưa nối máy nào, nên trạng thái rỗng hiện trong thẻ). Grammar ở `node_modules/@starci/grammar/dist/core/`. Mã: `fe/apps/app/src/components/blocks/DevicesPair/` (`component.tsx` trang, `connect.tsx` ngăn kéo nối máy, `steps.tsx` các bước).

## Băng đầu trang (Máy của bạn, dòng phụ, lệnh Kết nối máy)

Vì sao: băng trắng, sát trái, tiêu đề 18/600, dòng phụ 12 muted "Chạy bài có code trên máy của bạn, kết quả về đây". Trang là gốc của mục nên không có đường dẫn. Khi đã có máy, lệnh chính duy nhất "Kết nối máy" (có icon dấu cộng) nằm bên phải băng; khi chưa có máy, lệnh đó nằm trong trạng thái rỗng của thẻ để chỉ có MỘT nút chính trên màn hình.
Luật: `page-header-left-sublabel-xs.md`, `verify-against-visualize.md` (chỉ CTA chính có icon).
Grammar: `Page chrome="panes" header={{ breadcrumbs: "root", title, meta, actions }}` (`frame/Page/index.d.ts`), `Button intent="commit" startGlyph="plus"`.

## Nhãn "Máy đã nối" + chip đếm

Vì sao: nhãn khối trên thẻ, chip xám đếm số máy (0 hoặc 1 đến 2); ghi chú giới hạn máy (Premium 2 máy, miễn phí 1 máy) là dòng muted nhỏ dưới thẻ.
Luật: `table-heroui-native-section-head.md`.
Grammar: `SurfaceCard label count note` (`frame/SurfaceCard/index.d.ts`).

## Thẻ danh sách máy và trạng thái rỗng

Vì sao: một thẻ, một nội dung. Có máy: mỗi hàng là tên máy (500), 12 muted hệ điều hành và lần thấy cuối, chip chấm "Đang kết nối" (xanh) hoặc "Ngoại tuyến" (xám) và nút "Thu hồi" chỉ chữ. Chưa có máy: trạng thái rỗng nằm TRONG thẻ, gồm "Chưa có máy nào được nối", dòng giải thích, ba bước đánh số (cài CLI, đăng nhập trên máy, nhập mã và xác nhận) với lệnh trong khối mã, và nút chính "Kết nối máy". Bấm nút mở ngăn kéo có các bước, ô nhập mã 8 ký tự, xem trước máy sẽ được nối và nút xác nhận.
Luật: `table-heroui-native-section-head.md` (empty trong thẻ), `verify-against-visualize.md`.
Grammar: `SurfaceCard kind="body"` cho trạng thái rỗng và `kind="list"` cho danh sách (`SurfaceCard`), `Drawer` (`frame/Drawer/index.d.ts`), `Input`, `FencedCodeBlock`, `Badge isDot`.
Đã rõ: lệnh một dòng không còn nhãn "bash" (Grammar 0.37.15 `FencedCodeBlock showLanguage`, `node_modules/@starci/grammar/dist/core/frame/MarkdownArticle/index.d.ts`: nhãn tự ẩn với khối một dòng; nút Sao chép giữ nguyên); ảnh 1440 xác nhận.

## Cột phụ bên phải: "Mức chứng minh" và "CLI được phép làm gì"

Vì sao: cột trắng phẳng; hai hàng Đang luyện (kết quả chạy trên máy qua CLI, chưa tính vào milestone) và Đã chứng minh (CI có chữ ký hoặc server chạy lại) giải thích hai mức; gạch ngăn; rồi năm quy tắc của CLI, mỗi hàng có chip "Được" (xanh) hoặc "Không" (đỏ nhạt).
Luật: `verified-experience-per-part.md`, `pink-page-surface-rule.md`, `type-scale-14-12.md`.
Grammar: `Pane area="aside" surface scroll`, `Section kind="list"` (`frame/Section/index.d.ts`), `Divider`.
Đã rõ: Grammar 0.37.14: `Section kind="list"` trong `Pane surface` vẽ phẳng, không viền, không prop (`node_modules/@starci/grammar/dist/core/frame/Section/index.d.ts`); ảnh 1440 xác nhận. Phụ đề của hàng là chuỗi thường (hàng vẽ 12 muted).
Đã kiểm (390, Grammar 0.37.14, chụp lại với stack chạy): aside đứng trước và hiển thị đủ năm hàng "CLI được phép làm gì", không còn bị khối giữa đè; trang cuộn một lần. SAI còn lại: nhãn "Máy đã nối" co chiều cao về 0 (chỉ còn chip đếm); dòng phụ "Đang luyện" bị cắt bằng dấu ba chấm ở 390.
