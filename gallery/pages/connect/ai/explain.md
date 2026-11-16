---
title: Kết nối Claude / ChatGPT
route: /connect
area: connect
---

Route: `/connect` (chưa có ảnh chụp 1440, 1920, 390: màn hình mới, chưa chụp với stack chạy). Grammar ở `node_modules/@starci/grammar/dist/core/`. Mã: `fe/apps/app/src/components/blocks/ConnectAi/` (`component.tsx` trang, `index.tsx` nối dữ liệu), dữ liệu từ `fe/apps/app/src/hooks/mcpConnect/`.

## Băng đầu trang (Kết nối Claude / ChatGPT, dòng phụ)

Vì sao: băng trắng, sát trái, tiêu đề 18/600 và dòng phụ 12 muted nói AI của học viên làm được gì (đọc bài, đọc source, xem kết quả chạy, nhờ máy chạy lại kịch bản). Trang là gốc của mục nên không có đường dẫn và không có lệnh chính ở băng: lệnh "Tạo mã" nằm trong thẻ địa chỉ để chỉ có MỘT nút chính.
Luật: `page-header-left-sublabel-xs.md`.
Grammar: `Page chrome="panes" header={{ breadcrumbs: "root", title, meta }}` (`frame/Page/index.d.ts`).

## Thẻ "Địa chỉ MCP của StarCi", ô tên mã và nút Tạo mã

Vì sao: một thẻ, một việc: địa chỉ để dán vào Claude hoặc ChatGPT (khối mã một dòng có nút Sao chép), ô đặt tên mã, nút "Tạo mã". Mã mới chỉ hiện một lần trong thông báo ngay dưới nút, kèm lời dặn lưu lại và nút "Tôi đã lưu mã"; sau đó chỉ còn bốn ký tự cuối trong danh sách.
Luật: `table-heroui-native-section-head.md`, `verify-against-visualize.md` (chỉ CTA chính có icon).
Grammar: `SurfaceCard label`, `FencedCodeBlock`, `Input`, `Button intent="commit" startGlyph="plus"`, `Alert tone`.

## Thẻ "Mã truy cập của bạn" và trạng thái rỗng

Vì sao: một thẻ danh sách, mỗi hàng là tên mã (500), 12 muted đuôi mã và lần dùng cuối, nút "Thu hồi" chỉ chữ. Chưa có mã: trạng thái rỗng nằm TRONG thẻ với một dòng giải thích. Ghi chú giới hạn năm mã là dòng muted nhỏ dưới thẻ.
Luật: `table-heroui-native-section-head.md` (empty trong thẻ).
Grammar: `SurfaceCard kind="list" label count note`, `SlotView` cho tải, lỗi và thử lại.

## Các bước thêm connector cho Claude và ChatGPT

Vì sao: hai nhóm bước đánh số, mỗi bước một tiêu đề, lệnh trong khối mã khi có và một dòng muted giải thích. Claude: mở Connectors, dán địa chỉ, hoặc thêm vào Claude Code kèm tiêu đề Bearer. ChatGPT: bật chế độ nhà phát triển, tạo connector từ địa chỉ, dùng trong cuộc trò chuyện. Lời giải thích nói thật điều chưa có: đăng nhập OAuth cho Claude web và ChatGPT sẽ đến ở bước sau. Văn bản có hai ngôn ngữ vi và en.
Luật: `type-scale-14-12.md`.
Grammar: `StepRows` (`@starci-next/ui`), `Text isStrong`, `Divider`.

## Cột phụ bên phải: "AI đọc và làm được gì" và "AI không bao giờ thấy"

Vì sao: cột trắng phẳng; hai hàng nói rõ AI đọc phần bài đã mở khóa, source đúng commit, kịch bản, kết quả chạy của chính học viên và luật đã mở, nhờ máy chạy lại với xác nhận trên máy; và không bao giờ thấy bài test ẩn, bài nộp mẫu, đáp án rubric, bằng chứng mong đợi. Dưới gạch ngăn là ghi chú về mã truy cập cá nhân và OAuth.
Luật: `pink-page-surface-rule.md`, `type-scale-14-12.md`.
Grammar: `Pane area="aside" surface scroll`, `Section kind="list"` (`frame/Section/index.d.ts`), `Divider`.
