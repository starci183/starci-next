---
title: Bản chất / Bài học · phần 4 Tự áp dụng
route: /essentials/[topic]/[lesson]?part=apply
area: essentials
---

Route: `/essentials/[topic]/[lesson]?part=apply`. Phần 4: thang thử thách 4 bậc của thầy. Mỗi bậc chấm bằng kịch bản ẩn (CLI chạy, relay gửi về: "Đang luyện"), phần kiểm tra bản chất (trắc nghiệm, chấm tất định) và thang điểm 100 có một tiêu chí trọng yếu; CI GitHub có OIDC mới lên "Đã chứng minh". Bậc trên mở khi mọi kịch bản ẩn của bậc dưới đã xanh. Cần Premium. Code: `EssentialApply` trong `fe/packages/starci-next-ui/src/composites/EssentialParts/index.tsx`, `applyOf` trong `fe/apps/app/src/hooks/essentialLesson/essentialLesson.shared.ts`.

## Thang 4 bậc

Vì sao: danh sách phẳng Dễ · Vừa · Khó · Siêu khó, mỗi hàng chip trạng thái Khóa / Đang luyện / Đã xanh; bấm để xem bậc; mặc định là bậc cao nhất đang mở.
Luật: COOK 2026-11-17 phần 4 ("challenge ladder easy/medium/hard/insane"); white-theme BRIEF "LIMIT CARDS".
Grammar: `Section kind="list" items[{ title, badges, onPress, state }]` (`frame/Section/index.d.ts`).

## Bậc đang xem: đề bài và thang điểm

Vì sao: tiêu đề "Mức · tên", đề bài markdown; thang điểm là danh sách phẳng mỗi tiêu chí một chip điểm, tiêu chí trọng yếu có chip accent "Trọng yếu".
Luật: COOK 2026-11-17 ("rubric scoring (100, one critical 40-pt item)").
Grammar: `Markdown` (`frame/Markdown/index.d.ts`), `Section kind="list" badges` (`surfaceCardData.d.ts` `BadgeData`).

## Kiểm tra bản chất, kịch bản ẩn, đường tới Đã chứng minh

Vì sao: các câu trắc nghiệm/quyết định thiết kế (attempt `challenge.<bậc>.<id>`, chấm ngay, giải thích sau khi nộp); mục "Kịch bản ẩn" có chip "x/y kịch bản ẩn xanh" và lệnh `starci-next run <bài> --challenge <bậc>`; dòng muted nói đường Đang luyện → push GitHub, CI ký OIDC → Đã chứng minh. Bậc chưa mở chỉ hiện đề và thang điểm cùng một dòng nói điều kiện mở.
Luật: owner pivot 2026-11-17 ("hidden scenarios + an essence check … graded deterministically … proof still needs CI OIDC"); concept `learner-cli-relay` rule 3.
Grammar: `ChoiceCard` + `Alert` (`EssentialQuestion`), `Section fact` (`frame/Section/head.d.ts`), `FencedCodeBlock`, `Text tone="muted"`.

## Bài viết bậc thang: Luật chơi, Thang bốn bậc, 2.1 đến 2.4, Cách nộp

Vì sao: dưới đường tới Đã chứng minh là thân markdown của thầy: "1. Luật chơi" (hai cách chấm: kịch bản ẩn và câu hỏi bản chất), "2. Thang bốn bậc" (bảng Bậc · Thử thách · Mục trọng yếu 40 điểm), bốn mục 2.1 Dễ, 2.2 Vừa, 2.3 Khó, 2.4 Siêu khó (mỗi mục một đoạn đề, dòng "Kịch bản ẩn: `h-...`" và bảng Mục · Điểm tổng 100), rồi "3. Cách nộp" với khối lệnh `starci-next run <bài> --challenge easy` có nút "Sao chép". Danh sách bậc ở trên chỉ chọn bậc đang xem; phần này luôn hiện cả bốn bậc.
Luật: COOK 2026-11-17 phần 4 ("rubric scoring (100, one critical 40-pt item)"); `surface-layering` (bảng phẳng, không thẻ).
Grammar: `Markdown source labels renderCode` (`frame/Markdown/index.d.ts`), `DataTable` (`branch/DataTable/index.d.ts`), `FencedCodeBlock` (`frame/MarkdownArticle/index.d.ts`).

## Phản biện

- 1440, "Kiểm tra bản chất": hai câu hỏi mỗi câu nằm trong một khung bo góc viền (vừa khung đáp án vừa khung nút), nút "Nộp đáp án" tím nhạt khoá với chữ và icon gần như mờ, hai nút "Nộp đáp án" trên một màn hình (mỗi câu một nút) cùng kiểu nút chính khoá; luật một nút chính mỗi màn hình bị vi phạm, và icon trước chữ trên nút cỡ nhỏ. Đáp án là radio trong khung dày, khoảng cách hàng hơi hẹp.
- 1440, thang chấm: chip điểm ("40đ", "25đ"...) và chip "Trọng yếu" tím nhạt nền tô; tiêu chí đầu cắt dài nhưng không bị cắt, mã `(h-easy-key-reuse-409 xanh)` lẫn vào tên tiêu chí làm dòng dài và khó đọc.
- 1440, "Kịch bản ẩn": chip "Chưa chạy" nền xám; khối lệnh nền xám; dòng "Từ Đang luyện tới Đã chứng minh" 12 muted rất nhạt; hai khối nền tô và một đoạn chữ mờ nối tiếp nhau, không có hairline giữa các mục.
- 1440, nội dung lặp: thang bốn bậc xuất hiện hai lần (danh sách chọn bậc ở đầu và bảng "2. Thang bốn bậc"), mỗi bậc có thang điểm hai lần (mục "Thang chấm · 100 điểm" của bậc đang chọn và bảng Điểm ở 2.1), và lệnh `--challenge easy` hai lần (Kịch bản ẩn và "3. Cách nộp"). Trang dài và nói lại cùng thông tin.
- 1440, bảng trong bài viết: hàng tiêu đề nền xám tô; bốn bảng điểm giống hệt cấu trúc, cột "Điểm" căn trái không thẳng số. Code inline (`order.paid`, `refunded`) nền xám nhiều chỗ trong đoạn văn.
- 1440, danh sách bậc: ba bậc "Khóa" nhưng vẫn là hàng có chevron như bấm được; chip "Đang luyện" và "Khóa" cùng cỡ 12 xám/tím nhạt, trạng thái chỉ khác nhau bằng nền chip.
- 1920: Không thấy lỗi mới ở 1920; các lỗi 1440 giữ nguyên, cột nội dung ở giữa với lề trắng rộng, nút "Nộp đáp án" và chip cách xa đề ở lề phải.
- 390: tên tiêu chí thang chấm dài xuống ba dòng và chip "40đ" cùng "Trọng yếu" nằm chồng cạnh nhau sát lề; đề câu hỏi bản chất bị cắt "…" ("Vì sao không trả lại kết quả cũ khi cùng khóa đến với nội dung kh..."); khối lệnh `starci-next run ... --challenge` bị cắt ở mép phải thay vì xuống dòng; bảng "2. Thang bốn bậc" và các bảng điểm bị ép, chữ code ngắt giữa từ ("order.paid" thành "order. paid", "order.refunded" xuống nhiều dòng) làm cột "Mục trọng yếu" cao và khó đọc. Các hàng danh sách bậc có chip "Khóa" xuống dòng riêng khi tên dài.
