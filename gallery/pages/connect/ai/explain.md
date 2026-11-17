---
title: Kết nối Claude / ChatGPT
route: /connect
area: connect
reviewed: 2026-11-17
---

Route: `/connect` (ảnh chụp 1440, 1920, 390 đã có; phần "Mã truy cập của bạn" chụp ở trạng thái lỗi tải vì stack chạy không trả danh sách mã). Grammar ở `node_modules/@starci/grammar/dist/core/`. Mã: `fe/apps/app/src/components/blocks/ConnectAi/` (`component.tsx` trang, `index.tsx` nối dữ liệu), dữ liệu từ `fe/apps/app/src/hooks/mcpConnect/`.

## Băng đầu trang (Kết nối Claude / ChatGPT, dòng phụ)

Vì sao: băng trắng, đường kẻ dưới, sát trái, tiêu đề 18/600 và dòng phụ nói AI của học viên làm được gì (đọc bài, đọc source, xem kết quả chạy, nhờ máy chạy lại kịch bản). Trang là gốc của mục nên không có đường dẫn và không có lệnh chính ở băng: "Tạo mã" nằm trong phần địa chỉ. Ghi chú lỗi ảnh: dòng phụ hiện chữ nhỏ ngả màu, không phải xám trung tính 12.
Luật: `page-header-left-sublabel-xs.md`, `surface-layering`.
Grammar: `Page chrome="panes" header={{ breadcrumbs: "root", title, meta }}` (`frame/Page/index.d.ts`).

## Phần "Địa chỉ MCP của StarCi", ô tên mã và nút Tạo mã

Vì sao: một phần phẳng dưới đầu phần, không thẻ: địa chỉ để dán vào Claude hoặc ChatGPT (khối mã một dòng nền xám nhạt), ô "Tên mã" (trắng, viền 1px), nút "Tạo mã" có icon dấu cộng, đang nhạt (tắt) vì tải mã lỗi. Mã mới chỉ hiện một lần trong thông báo ngay dưới nút, kèm nút "Tôi đã lưu mã"; sau đó chỉ còn bốn ký tự cuối.
Luật: `surface-layering` (một nút chính, chỉ nút chính có icon), `theme-and-type` (ô trắng viền 1px).
Grammar: `Section title headingLevel={2}`, `FencedCodeBlock`, `Input`, `Button intent="commit" startGlyph="plus"`, `Alert tone`.

## Phần "Mã truy cập của bạn" và trạng thái lỗi hoặc rỗng

Vì sao: ảnh chỉ thấy trạng thái lỗi và không thấy đầu phần "Mã truy cập của bạn" (thanh lỗi nằm thẳng dưới nút "Tạo mã"): thanh thông báo "Không tải được phần này." với nút "Thử lại" (cặp màu mềm của danger; nút "Thử lại" vẽ nền đỏ cam đặc, ở 390 rộng suốt hàng). Khi có dữ liệu, viết từ mã: danh sách phẳng, mỗi hàng tên mã (500), 12 muted đuôi mã và lần dùng cuối, nút "Thu hồi" chỉ chữ; chưa có mã thì trạng thái rỗng nằm trong phần; ghi chú giới hạn năm mã là dòng muted nhỏ dưới phần. Ghi chú lỗi ảnh: nút "Thử lại" đặc màu đỏ cam là nút nhấn mạnh thứ hai, luật là nút trung tính.
Luật: `surface-layering` (trạng thái lỗi và rỗng nằm trong phần, "Thử lại" trung tính), `grammar-slot-interface`.
Grammar: `Section kind="list" title count`, `SlotView` cho tải, lỗi và thử lại.

## Các bước thêm connector cho Claude và ChatGPT

Vì sao: dưới đầu phần "Cách thêm connector", hai nhóm bước đánh số, mỗi bước một tiêu đề, lệnh trong khối mã khi có và một dòng muted giải thích. Claude: mở Connectors, dán địa chỉ, hoặc thêm vào Claude Code kèm tiêu đề Bearer. ChatGPT: bật chế độ nhà phát triển, tạo connector từ địa chỉ, dùng trong cuộc trò chuyện. Lời giải thích nói thật điều chưa có: đăng nhập OAuth cho Claude web và ChatGPT sẽ đến ở bước sau. Văn bản có hai ngôn ngữ vi và en. Ghi chú lỗi ảnh: lệnh `claude mcp add ...` dài bị cắt ngang khối mã ở 1440 và 390 (có thanh cuộn ngang nhưng không có dấu hiệu).
Luật: `surface-layering`, `type-scale-14-12.md`.
Grammar: `StepRows` (`@starci-next/ui`), `FencedCodeBlock`, `Text isStrong`, `Divider`.

## Cột phụ bên phải: "AI đọc và làm được gì" và "AI không bao giờ thấy"

Vì sao: hai hàng nói AI đọc phần bài đã mở khóa, source đúng commit, kịch bản, kết quả chạy của chính học viên và luật đã mở, nhờ máy chạy lại với xác nhận; và không bao giờ thấy bài test ẩn, bài nộp mẫu, đáp án rubric, bằng chứng mong đợi. Dưới gạch ngăn là ghi chú về mã truy cập cá nhân và OAuth. Ghi chú lỗi ảnh: hai hàng được bọc trong một khung viền bo góc như thẻ, trái luật aside không làm bằng thẻ; dòng phụ bị cắt bằng dấu ba chấm ở mọi độ rộng (nội dung quan trọng bị mất).
Luật: `surface-layering` (aside không thẻ), `type-scale-14-12.md`.
Grammar: `Pane area="aside" surface scroll`, `Section kind="list"` (`frame/Section/index.d.ts`), `Divider`.

## Phản biện

- 1440, 1920, 390, thanh lỗi "Không tải được phần này.": nền hồng tô kín chữ đỏ đậm và nút "Thử lại" đặc màu đỏ cam bão hoà, là điểm màu mạnh nhất trang và vượt cả nút chính; luật là "Thử lại" trung tính. Ở 390 nút rộng suốt hàng. Phần "Mã truy cập của bạn" không có đầu phần nên thanh lỗi trôi lơ lửng, không rõ lỗi của phần nào.
- 1440, 1920, 390, nút "Tạo mã": tím rất nhạt chữ xám (tắt), tương phản thấp, icon dấu cộng mờ; không có lý do hiển thị vì sao nút tắt (ô tên đã có chữ "Claude" nhạt như placeholder).
- 1440, 1920, 390, dòng phụ dưới tiêu đề: chữ nhỏ hơn 12 và ngả màu nâu cam, không phải xám trung tính; băng đầu trang cao với khoảng trống dưới dòng phụ.
- 1440, 1920, 390, khối mã (địa chỉ MCP lặp ba lần, lệnh `claude mcp add`): nền xám tô kín, không viền; địa chỉ `http://localhost:3280/mcp` lặp lại ở ba chỗ trên cùng một trang.
- 1440 và 390: lệnh `claude mcp add ... Bearer YOUR_` bị cắt ngang khối mã, phần "TOKEN" mất, không có dấu hiệu cuộn; ở 1920 hiện đủ.
- 1440, 1920, 390, cột phụ: hai hàng "AI đọc và làm được gì" và "AI không bao giờ thấy" vẫn nằm trong khung viền bo góc như thẻ, trái luật aside không thẻ; dòng phụ bị cắt bằng dấu ba chấm ở cả ba độ rộng ("đọc và tìm ...", "đáp án của rubr..."), nội dung quan trọng bị mất. Tiêu đề "AI đọc và làm được gì" lặp y hệt tên hàng đầu tiên.
- 1440, 1920, 390, đoạn ghi chú cuối cột phụ: xám nhạt cỡ 14, dài và dày chữ, tương phản thấp, không đầu phần.
- 1440, 1920, 390, phần "Cách thêm connector": tiêu đề phần, tiêu đề nhóm (Claude, ChatGPT) và tên bước đều cỡ 14 gần như cùng độ đậm, phân cấp yếu; dòng giải thích 14 xám nhạt, tương phản thấp; trang rất dài và đặc chữ, không tách được việc "tạo mã" khỏi phần hướng dẫn.
- 1440, 1920, 390, thanh trên: nút tròn tô xám, công tắc sáng tối tô xám, avatar đỏ bão hoà.
- 390, thứ tự: cột phụ nằm trước việc chính (địa chỉ và tạo mã).
