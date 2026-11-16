---
title: Dự án / Tạo dự án
route: /projects/new
area: projects
---

Route: `/projects/new`. Trang tạo dự án: chọn loại, điền thông tin, xem cách bắt đầu. Mã: `fe/apps/app/src/components/blocks/ProjectNew/component.tsx`. Biểu mẫu và danh sách nằm phẳng trên mặt trắng dưới đầu mục Section, không thẻ.

## Băng đầu trang (đường dẫn Dự án / Tạo dự án, tiêu đề)

Vì sao: băng trắng sát trái, đường dẫn "Dự án / Tạo dự án" vì đây là trang con; tiêu đề 18/600; không có mô tả. Lệnh chính nằm ở chân biểu mẫu, không ở băng.
Luật: `page-header-left-sublabel-xs.md`, `surface-layering`.
Grammar: `Page header={{ title, breadcrumbs }}`.

## Loại dự án (nhóm chọn)

Vì sao: đầu mục "Loại dự án", dưới là hai lựa chọn loại trừ (Ứng dụng, Agent), mỗi cái là một hàng có vòng radio, tiêu đề danh từ và phụ đề 12 muted. Hàng chọn có nền xám nhạt và viền đậm, radio chọn tô accent; hàng chưa chọn trắng viền 1px. Mỗi hàng là một ô viền bấm được nên vẫn còn dáng ô nhỏ. Khi chọn Agent có thêm nhóm "Công cụ agent" cùng kiểu.
Luật: `theme-and-type` (chọn là gray, accent chỉ cho radio đã chọn), `surface-layering`.
Grammar: `Section` + `RadioGroup` với `Radio description`. Ghi chú: lựa chọn concept lúc tạo CHƯA CÓ vì API không nhận danh sách concept.

## Thông tin dự án (biểu mẫu phẳng)

Vì sao: đầu mục "Thông tin dự án", dưới là biểu mẫu hai cột (một cột ở 390): tên dự án, địa chỉ repo, công nghệ, đề tài, ngôn ngữ chính. Ô trắng viền 1px bo pill, nhãn 14 trên ô. Lỗi (ví dụ "Dự án thứ hai cần Premium.") hiện bằng Alert ngay trong khối.
Luật: `surface-layering` (biểu mẫu là Section, không thẻ), `theme-and-type` (field một kiểu).
Grammar: `Section` + `Grid kind="form"` + `Input kind="text"`, `Alert tone="negative"`.

## Chân biểu mẫu: Huỷ và Tạo dự án

Vì sao: bên phải: Huỷ (nút pill trung tính, chữ, về /projects) và "Tạo dự án" (nút chính duy nhất, có icon dấu cộng). Ảnh chụp lúc biểu mẫu còn rỗng nên nút chính mờ (vô hiệu) tới khi điền đủ.
Luật: `surface-layering` (một nút chính, chỉ CTA chính có icon).
Grammar: `Button intent="neutral"`, `Button intent="commit" startGlyph="plus"`.

## Cách bắt đầu (danh sách đánh số)

Vì sao: đầu mục "Cách bắt đầu", ba bước (thư mục starci/, CLI StarCi, bí mật CI) là hàng phẳng ngăn bằng đường kẻ: số thứ tự chữ mono, tiêu đề, mô tả 12 muted. Ở 390 mô tả bị cắt bằng dấu "…". Lệnh cài CLI cụ thể CHƯA RÕ (chưa có trong thông điệp của app).
Luật: `surface-layering`, `type-scale-14-12.md`.
Grammar: `Section kind="list"` với `ListRowData.leading: { position }`.

## "Dự án đã tạo" (sau khi tạo)

Vì sao: không có trong ảnh. Sau khi tạo, đầu mục "Dự án đã tạo": bí mật CI chỉ hiện một lần trong ô sao chép được, một Alert thông tin và nút chính "Mở dự án".
Luật: `surface-layering`.
Grammar: `Section`, `Input isCopyable`, `Alert tone="informative"`, `Button intent="commit"`.
