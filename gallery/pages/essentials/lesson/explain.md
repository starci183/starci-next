---
title: Bản chất / Bài học · phần 1 Bản chất
route: /essentials/[topic]/[lesson]
area: essentials
reviewed: 2026-11-17
---

Route: `/essentials/[topic]/[lesson]` (không có `?phase=`; `?part=essence` là mặc định). Một bài có bốn phần (owner, COOK 2026-11-17): Bản chất, Source, Kịch bản, Tự áp dụng. Đây là phần 1: mở bằng 5 câu trắc nghiệm phỏng vấn, rồi bài viết, cuối bài làm lại 5 câu. Mockup: `D:/starci-tmp/claude-20261117/essentials-clusters/mockup/essential-4-parts.html` (artboard 1). Code: `fe/apps/app/src/components/blocks/EssentialLesson/component.tsx`, hook `fe/apps/app/src/hooks/essentialLesson/`, composite `fe/packages/starci-next-ui/src/composites/EssentialParts/index.tsx`. Grammar dưới `node_modules/@starci/grammar/dist/core/`. Liên kết `?phase=` cũ vẫn mở trang sáu pha (`LessonStudy`).

## Band (breadcrumbs, tiêu đề, chip mức độ, facts, bốn tab phần)

Vì sao: breadcrumbs Bản chất / topic / bài; tiêu đề; chip mức độ; dòng 12 muted "90 phút đọc · TypeScript" (bài chỉ có TypeScript, không còn chọn ngôn ngữ). Bốn phần là tab trang (underline) trên đường kẻ đáy band, `?part=` giữ phần đang mở để chia sẻ link.
Luật: COOK 2026-11-17 "Lesson = 4 parts"; owner pivot "REPO H TRÒ VIẾT TS THÔI" (không có language picker); `page-header-left-sublabel-xs.md`.
Grammar: `Page header { breadcrumbs, title, status, meta, tabs: { kind: "views", items, selectedKey, onSelect } }` (`frame/PageHeader/index.d.ts` `PageHeaderTabs`), `Badge` (`leaf/Badge/index.d.ts`).

## Mở bài · 5 câu trắc nghiệm phỏng vấn

Vì sao: mỗi lần một câu, head Section "Mở bài · 5 câu trắc nghiệm phỏng vấn" với "Câu 1 / 5" ở bên phải (thanh 5 bước chưa thấy rõ trong ảnh); câu hỏi nằm trên mặt trắng, bốn đáp án là các hàng radio trong một khung viền hairline, nút "Nộp đáp án" là pill tím nhạt (chưa chọn đáp án nên bị khoá) và "Câu tiếp" là nút trung tính chữ nhỏ bên dưới; câu hỏi dài bị cắt bằng dấu "…" ở 1440 và 1920 (xem lỗi hình); chọn một đáp án rồi gửi, server chấm ngay (attempt `opener.<id>`, loại choice, không lộ đáp án trước khi gửi). Đúng: hộp affirmative với lời giải thích. Sai: hộp negative với lời giải thích và link "Đọc kỹ mục n" (neo `#section-…`) cùng "Thấy tận mắt ở kịch bản …" (`?part=scenarios&scenario=…`). Không có ô trả lời tự do. Xong 5 câu hiện "Đúng x/5".
Luật: COOK 2026-11-17 phần 1 (5 câu trắc nghiệm, chấm tất định, sai thì giải thích + "đọc §n / xem kịch bản"); concept `conventions` rule 4 (đáp án không rời server trước khi nộp).
Grammar: `Section title meta` (`frame/Section/index.d.ts`), `Progress steps` (`leaf/Progress/index.d.ts`), `SurfaceCard kind="select"` qua `ChoiceCard` (`fe/packages/starci-next-ui/src/composites/ChoiceCard/index.tsx`), `Alert tone="affirmative"|"negative"` (`composite/Alert/index.d.ts`), `Link` (`leaf/Link/index.d.ts`), `Button intent="neutral"` (`leaf/Button/index.d.ts`).

## Mục lục (chip "Nên đọc kỹ")

Vì sao: danh sách phẳng các mục của bài viết, mỗi hàng là link neo tới mục; mục mà một câu mở bài trả lời sai trỏ tới mang chip vàng "Nên đọc kỹ". Danh sách nằm thẳng trên mặt trang dưới head "Mục lục", chỉ có một hàng ("1. Bản chất: tin nhắn đi ra...") kèm chevron, ngăn hairline; chưa có chip vì chưa trả lời câu nào.
Luật: COOK 2026-11-17 ("sai câu nào, mục đó được đánh dấu nên đọc kỹ"); white-theme BRIEF "LIMIT CARDS" (danh sách nằm phẳng trên bề mặt).
Grammar: `Section kind="list" items[{ title, href, badges }]` (`frame/Section/index.d.ts`, `surfaceCardData.d.ts` `ListRowData`).

## Bài viết (các mục lý thuyết)

Vì sao: mỗi mục lý thuyết là một Section có neo `section-<id>`, thân markdown của thầy (bảng, code, mermaid) vẽ bằng Markdown của Grammar (cùng font IBM Plex Sans, code và bảng tô nền xám nhạt trong bài, đáng xem lại với luật "không giếng tô màu"); mục cần Premium chỉ giữ tiêu đề.
Luật: concept `content` rule 5 (hiển thị đúng chữ của thầy); `grammar-generic-app-themed.md`.
Grammar: `Section id title` (`frame/Section/index.d.ts`), `Markdown source labels renderCode` (`frame/Markdown/index.d.ts`).

## Làm lại 5 câu (trước và sau)

Vì sao: cuối bài, bảng phẳng mỗi câu một hàng: "Lần đầu" (lần trả lời đầu tiên) và "Lần mới nhất" (đúng/sai/chưa làm), đọc từ `lessonOpenerScores`; nút nhỏ "Làm lại" đưa về câu 1 và mở lại 5 câu (revision mới, lần đầu vẫn giữ).
Luật: COOK 2026-11-17 ("the same 5 again at the end shows before/after"); Grammar 0.40 "DataTable surface none" (bảng phẳng, không thẻ).
Grammar: `Section action={<Button intent="neutral" size="sm">}` (`frame/Section/head.d.ts`), `DataTable columns rows renderCell` (`branch/DataTable/index.d.ts`), `Badge tone` (`leaf/Badge/index.d.ts`).

## Phản biện

- 1440, "Mở bài": câu hỏi 14/600 dài bị cắt bằng dấu "…" ở cuối dòng ("...Process bị kill ngay sau COMMIT. Cổng thanh toán gửi lại thông báo vì ..."), người học không đọc được hết đề; luật truncation vi phạm vì đề bài là nội dung chính. Nút "Nộp đáp án" tím nhạt khoá, chữ nhạt khó đọc (tương phản thấp), "Câu tiếp" chữ xám nhỏ lệch phải, hai nút không thẳng hàng và gần như vô hình. Bốn đáp án nằm trong khung bo góc viền (một khung bao cả bốn hàng); thanh 5 bước vẫn không thấy, chỉ có chữ "Câu 1 / 5" 12 muted ở lề phải xa tiêu đề.
- 1440, dải đầu: chip "Trung cấp" nền xám cạnh tiêu đề; tab phần ("Bản chất, Source, Kịch bản, Tự áp dụng") chữ 14 sát nhau; dải đầu không có nút nào, hợp lệ. Dòng "40 phút đọc · TypeScript" 12 muted mờ.
- 1440, mục lục: chỉ một hàng ("1. Bản chất: tin nhắn đi ra...") trong khung riêng, trong khi bài viết có bảy mục con 2.1 đến 2.7 cộng các mục 3, 4; mục lục không phản ánh cấu trúc bài. Nó trùng gần như nguyên văn tiêu đề h2 ngay dưới.
- 1440, bài viết: thân là một khối chữ dài 14 px liên tục, không có hairline hay head Section giữa các mục lớn; mục 1 đến 4 chỉ phân biệt bằng chữ đậm, rất khó quét. Code inline có nền xám tô, bảng "Bức tranh đầy đủ" có hàng tiêu đề nền xám tô (luật: hairline thay nền tô, không giếng tô màu) và cột "Thiếu nó thì" dài, chữ nhỏ. Câu hỏi phỏng vấn mục 4 là danh sách lồng bullet dày, không phân tách.
- 1440, "Làm lại 5 câu": bảng có cột "Câu hỏi" bị cắt "…" ở cuối mỗi dòng, hai cột trạng thái chỉ toàn "Chưa làm" lặp 10 lần; nút "Làm lại" nằm ở head và là nút thứ hai cạnh "Nộp đáp án" (ở trên) và "Câu tiếp", ba nút trung tính/phụ tranh nhau trên một trang. Dòng chú thích dưới bảng 12 muted rất nhạt.
- 1920: Không thấy lỗi mới ở 1920; lỗi 1440 vẫn còn, riêng đề câu hỏi bị cắt "…" dù còn thừa rất nhiều chỗ (đề chiếm gần hết chiều ngang rồi cắt), và cột nội dung bài hẹp ở giữa trang với lề trắng rất lớn hai bên.
- 390: trang dài hơn 8000 px; không thấy "Câu 1 / 5" cùng hàng với head, các đáp án và đề xuống dòng nhiều; bảng "Bức tranh đầy đủ" bốn cột bị ép hẹp làm chữ xuống từng từ ("INSERT outbox cùng transaction với đơn paid" thành nhiều dòng ngắn), cột đầu tiên dòng "Transactional outbox" ngắt giữa chữ. Bảng "Làm lại 5 câu" ép cột câu hỏi hẹp, ba cột khó đọc. Dải tab phần ở 390 sát mép phải. Không có điều hướng nhanh về đầu trang hay mục lục sau khi cuộn hơn tám nghìn px.
