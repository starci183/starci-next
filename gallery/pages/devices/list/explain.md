---
title: Máy của bạn
route: /devices
area: devices
reviewed: 2026-11-17
---

Route: `/devices` (ảnh chụp: học viên chưa nối máy nào, nên trạng thái rỗng hiện ngay dưới đầu phần). Grammar ở `node_modules/@starci/grammar/dist/core/`. Mã: `fe/apps/app/src/components/blocks/DevicesPair/` (`component.tsx` trang, `connect.tsx` ngăn kéo nối máy, `steps.tsx` các bước).

## Băng đầu trang (Máy của bạn, dòng phụ, lệnh Kết nối máy)

Vì sao: băng trắng, đường kẻ dưới, sát trái, tiêu đề 18/600, dòng phụ 12 muted "Chạy bài có code trên máy của bạn, kết quả về đây". Trang là gốc của mục nên không có đường dẫn. Khi đã có máy, lệnh chính "Kết nối máy" (có icon dấu cộng) nằm bên phải băng; khi chưa có máy (như ảnh), lệnh nằm ở cuối trạng thái rỗng để màn chỉ có MỘT nút chính. Ghi chú lỗi ảnh: dòng phụ hiện bằng chữ nhỏ ngả màu (không phải xám trung tính) và nhỏ hơn 12.
Luật: `page-header-left-sublabel-xs.md`, `surface-layering` (một nút chính, chỉ nút chính có icon).
Grammar: `Page chrome="panes" header={{ breadcrumbs: "root", title, meta, actions }}` (`frame/Page/index.d.ts`), `Button intent="commit" startGlyph="plus"`.

## Phần "Máy đã nối" + chip đếm

Vì sao: đầu phần trên nền, chip xám đếm số máy (0 như ảnh); ghi chú giới hạn máy (Premium 2 máy, miễn phí 1 máy) là dòng muted nhỏ dưới phần khi có dữ liệu.
Luật: `surface-layering` (nhãn khối là đầu phần trên nền).
Grammar: `Section title headingLevel={2} count` (`frame/Section/index.d.ts`).

## Danh sách máy và trạng thái rỗng

Vì sao: không thẻ; nội dung nằm phẳng dưới đầu phần. Có máy: mỗi hàng là tên máy (500), 12 muted hệ điều hành và lần thấy cuối, chip chấm "Đang kết nối" (xanh) hoặc "Ngoại tuyến" (xám) và nút "Thu hồi" chỉ chữ. Chưa có máy: trạng thái rỗng gồm "Chưa có máy nào được nối", dòng giải thích, ba bước đánh số (cài CLI, đăng nhập trên máy, nhập mã và xác nhận), lệnh trong khối mã nền xám nhạt (một dòng, không nhãn ngôn ngữ) và nút chính "Kết nối máy". Bấm nút mở ngăn kéo có các bước, ô nhập mã 8 ký tự, xem trước máy sẽ được nối và nút xác nhận (không có trong ảnh). Ở 390 cột phụ đứng trước phần này, nút chính nằm cuối trang.
Luật: `surface-layering` (empty trong phần, danh sách phẳng không thẻ, một nút chính).
Grammar: `Section title count`, `StepRows` (`@starci-next/ui`), `FencedCodeBlock`, `Button intent="commit" startGlyph="plus"`, `Drawer` (`frame/Drawer/index.d.ts`), `Input`, `Badge isDot`.

## Cột phụ bên phải: "Mức chứng minh" và "CLI được phép làm gì"

Vì sao: hai hàng Đang luyện (kết quả chạy trên máy qua CLI, chưa tính vào milestone) và Đã chứng minh (CI có chữ ký hoặc server chạy lại), gạch ngăn, rồi năm quy tắc của CLI, mỗi hàng có chip "Được" (xanh mềm) hoặc "Không" (đỏ mềm). Ghi chú lỗi ảnh: mỗi danh sách được bọc trong một khung viền bo góc như thẻ, trái luật aside không làm bằng thẻ (nên là hàng phẳng ngăn bằng đường kẻ); dòng phụ "Đang luyện" bị cắt bằng dấu ba chấm ở 1440 và 390.
Luật: `verified-experience-per-part.md`, `surface-layering` (aside không thẻ), `type-scale-14-12.md`.
Grammar: `Pane area="aside" surface scroll`, `Section kind="list"` (`frame/Section/index.d.ts`), `Divider`.
