---
title: Bản chất / Bài học · phần 2 Source
route: /essentials/[topic]/[lesson]?part=source
area: essentials
---

Route: `/essentials/[topic]/[lesson]?part=source`. Phần 2 của bài: tải source TypeScript của bài và chạy, sơ đồ kiến trúc với luật mỗi thành phần giữ, rồi đọc code: mỗi đoạn trùng byte với source, gắn bất biến và `file:dòng`. Cần Premium (thiếu thì hiện LockedNotice). Code: `EssentialSource` trong `fe/packages/starci-next-ui/src/composites/EssentialParts/index.tsx`, builder `sourceOf` trong `fe/apps/app/src/hooks/essentialLesson/essentialLesson.shared.ts`.

## Tải source và chạy

Vì sao: một khối lệnh có nút Copy: `npx @starci/next pull <bài>`, `cd <bài>`, `starci-next up`. Source nằm trong `starci-next-seed-standard` (`essentials/<topic>/<bài>/source/`), CLI tải tarball có ký sha256 qua relay; chỉ TypeScript.
Luật: COOK 2026-11-17 phần 2; SCENARIO-CONTRACT v3 §3–§4; owner pivot "TS only".
Grammar: `Section description` (`frame/Section/index.d.ts`), `FencedCodeBlock code language label` (`frame/MarkdownArticle/index.d.ts`).

## Kiến trúc (sơ đồ + bảng "Luật nó giữ")

Vì sao: mục "2. Kiến trúc" của bài viết: một đoạn dẫn, sơ đồ mermaid của thầy kèm chú thích "Hình 1" dưới sơ đồ, rồi bảng phẳng bốn cột Thành phần · Cổng · Vai trò · Luật nó giữ (mã bất biến và tên của nó). Bảng có hàng tiêu đề nền xám nhạt và ngăn hàng bằng hairline.
Luật: COOK 2026-11-17 phần 2 ("architecture diagram (mermaid) + components table with a Luật nó giữ column"); `surface-layering` (bảng phẳng trên bề mặt).
Grammar: `MermaidDiagram source label errorTitle` (`frame/MermaidDiagram/index.d.ts`), `DataTable` (`branch/DataTable/index.d.ts`).

## Đọc code (3.1 đến 3.5, mỗi đoạn một mục)

Vì sao: mục "3. Đọc code: mỗi lời hứa nằm ở đâu" mở bằng đoạn giải thích cách đọc, rồi năm mục con (3.1 Inbox, 3.2 Claim, 3.3 Gửi với khóa cố định, 3.4 Idempotent consumer, 3.5 Hai bảng chống trùng). Mỗi mục: tiêu đề, nhãn `file:dòng` (đường dẫn trong `source/`) trong một mã inline, khối code tô nền xám nhạt có nhãn ngôn ngữ "typescript" hoặc "sql" và nút "Sao chép" ở lề phải, các đoạn giải thích từng dòng, và một dòng "Luật ở đây: ..." chốt bất biến đoạn code giữ. Không còn chip accent cho bất biến; luật chỉ là một dòng chữ in đậm cuối mục. Đoạn code là bằng chứng để đọc, không phải để gõ lại.
Luật: COOK 2026-11-17 ("code explanation snippets diff=0 with the repo, each tagged with the invariant + file:line"); owner pivot "dạy bản chất, không dạy code".
Grammar: `Markdown source labels renderCode` (`frame/Markdown/index.d.ts`), `FencedCodeBlock code language label` (`frame/MarkdownArticle/index.d.ts`), `HighlightedCode` (`fe/packages/starci-next-ui/src/branches/HighlightedCode/index.tsx`).

## Chạy thử một vòng và dọn tài nguyên

Vì sao: hai mục cuối của bài: "4. Chạy thử một vòng" (`starci-next check <bài>` kèm chú thích "every scenario, all guards on" và `starci-next run ledger`, rồi dòng giải thích verdict) và "5. Dọn tài nguyên" (`starci-next down`), mỗi mục một khối lệnh có nút "Sao chép".
Luật: SCENARIO-CONTRACT v3 §3–§4; COOK 2026-11-17 phần 2.
Grammar: `FencedCodeBlock code language label` (`frame/MarkdownArticle/index.d.ts`).

## Phản biện

- 1440, "Tải source và chạy" và mọi khối code: nền xám nhạt tô (luật: hairline thay nền tô), chữ code mono nhỏ và mờ; nhãn "bash" và "typescript" ở góc trái cùng "Sao chép" ở góc phải chỉ 12 muted rất nhạt, khó thấy. Khối code gốc TypeScript ở 3.1 dài hơn 40 dòng không xuống dòng, ở 390 phải cuộn ngang hoặc bị cắt.
- 1440, bố cục: thân là một cột chữ liên tục, không có head Section hay hairline giữa năm mục lớn; tiêu đề mục (1., 2., 3.) chỉ đậm 14, hierarchy chỉ phân biệt bằng đậm nên mục 3.1 đến 3.5 khó quét. Có hai khối "Tải source và chạy" ở đầu và mục "1. Lấy source và khởi động" ngay dưới lặp cùng lệnh pull/up.
- 1440, sơ đồ kiến trúc: mermaid vẽ rất nhỏ trong khung hẹp, chữ trên các nút nhỏ hơn 12 px, gần như không đọc được; chú thích "Hình 1" ở dưới dài ba dòng xám nhạt.
- 1440, bảng "Luật nó giữ": hàng tiêu đề nền xám tô; cột "Cổng" và "Vai trò" chữ nhỏ, cột cuối xuống dòng nhiều; tên thành phần dùng code inline nền xám, nhiều nền tô nhỏ trong cùng một bảng.
- 1440, dải đầu: tab "Source" đang chọn gạch chân đúng, nhưng chip "Trung cấp" cạnh tiêu đề nền xám; không thấy chỉ báo premium hay trạng thái tải source.
- 1920: Không thấy lỗi mới ở 1920; lỗi 1440 giữ nguyên, cột nội dung hẹp ở giữa với lề trắng rất rộng hai bên, khối code vẫn có đuôi thừa trắng.
- 390: bảng "Luật nó giữ" bị ép bốn cột hẹp, chữ xuống từng từ hoặc ngắt giữa chữ ("scripts/ledger.ts" ngắt dòng, "api (2 replica)"), cột "Luật nó giữ" bị cắt; sơ đồ mermaid thu nhỏ còn lại các vệt không đọc được; code dài khó đọc và nút "Sao chép" cạnh nhãn ngôn ngữ nhỏ sát mép; trang dài hơn 8300 px.
