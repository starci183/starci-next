---
title: Giải một bài (đề, bài làm, gợi ý)
route: /practice/[slug]
area: practice
reviewed: 2026-11-17
---

Route: `/practice/[slug]` (ảnh chụp: bài "Chèn Khoảng", bài của pattern Mảng, ngôn ngữ Python, học viên Premium). Mã: `fe/apps/app/src/components/blocks/PracticeSolve/component.tsx`. Khung chung giải thích ở `learn/home`.

## Dải đầu trang: đường dẫn "Luyện code / Mảng / Chèn Khoảng" và tiêu đề

Vì sao: dải trắng phẳng, viền dưới, sát trái: đường dẫn ba mục (Luyện code về `practice/list`, Mảng về `practice/pattern`, mục cuối đậm) và tiêu đề 18/600. Đường dẫn cho học viên lùi đúng một cấp.
Luật: `surface-layering`, `theme-and-type`.
Grammar: `Page header={{ breadcrumbs, title }}` (`frame/Page/index.d.ts`).

## Đề bài

Vì sao: đề là một vật thật nên vẫn là một thẻ viền mảnh, không bóng: tên pattern muted, hàng chip (độ khó "Trung bình", các nhãn kỹ thuật, giới hạn "2 s · 256 MB"), tên bài đậm, rồi đề viết bằng markdown: đoạn mô tả, mục Đầu vào, Đầu ra, "Ví dụ" với hai khối mã (vào và ra), phông đơn cách của Grammar. SAI: đề vẫn hiện nguyên các dấu ":::muted Đầu vào :::" và ":::muted Đầu ra :::" thành chữ giữa các đoạn; đó là chỉ thị markdown (`:::muted`) mà bộ vẽ markdown chưa hiểu hoặc dữ liệu đề viết sai; không sửa gọn được trong fe vì đề là dữ liệu của thầy. CHƯA RÕ: hai khối mã và mã nội dòng vẫn có nền xám nhạt trong thẻ trắng, trái luật không có giếng tô nền; ở 390 các mã nội dòng (`N`, "start end") bị bẻ thành ô rộng làm dòng chữ lệch.
Luật: `surface-layering` (thẻ chỉ cho vật thật), `theme-and-type`.
Grammar: `PracticeProblemPanel`, `MarkdownArticle` và `FencedCodeBlock` (`node_modules/@starci/grammar/dist/core/frame/MarkdownArticle/index.d.ts`), `SurfaceCard`, `Badge`; code `PracticeSolve/component.tsx`.

## Khối "Bài làm của bạn"

Vì sao: một `Section` phẳng: ô chọn "Ngôn ngữ" (Python...) trắng viền 1px, dòng muted "Chấm trên máy chấm của StarCi, test ẩn.", ô "Mã nguồn" nhiều dòng trắng viền 1px với mã khởi đầu có chỗ TODO và hàng lệnh pill: "Chạy thử" (trung tính, chạy ví dụ), "Nộp bài" là nút chính duy nhất của màn (chấm thật, tính Accepted), "Về mã khởi đầu" trung tính, và dòng muted nói bản nháp từng ngôn ngữ được giữ trên trình duyệt này. Ô mã cao cố định, tự cuộn bên trong. CHƯA RÕ: ô mã là `Textarea` thường, chưa có soạn thảo mã (tô màu, thụt dòng) và mã hiện bằng phông không đơn cách nên thụt dòng khó đọc; "Chạy thử" viền mảnh còn "Về mã khởi đầu" xám đặc là hai kiểu nút trung tính khác nhau.
Luật: `surface-layering` (form là Section, một nút chính), `theme-and-type`.
Grammar: `PracticeEditor`, `Section`, `Select` (`composite/Select`), `Textarea` (`composite/Textarea`), `Button intent="commit"` và `Button` neutral.

## Khối "Gợi ý"

Vì sao: một `Section` phẳng: câu muted nói AI chỉ gợi ý, không viết code hộ, có ba bậc mở lần lượt, và nút pill trung tính "Mở gợi ý tiếp" (mỗi lần mở một bậc, có thể bị trừ điểm nên không phải nút chính).
Luật: `surface-layering`, `theme-and-type`.
Grammar: `PracticeHints`, `Section`, `Button` neutral, `Alert` khi bị từ chối (`composite/Alert`).

## Cột phải "Các bài trong pattern"

Vì sao: cột phụ phẳng, không thẻ, đầu là `Section`: năm bài cùng pattern để chuyển bài mà không về danh sách: số thứ tự, tên, dòng 12 muted nhãn (cắt bằng "…" khi dài), chip xám "Chưa làm" và nút pill "Giải bài", hàng ngăn bằng đường kẻ. Dưới lg cột này xếp xuống dưới cột chính (ảnh 390, sau "Gợi ý"). CHƯA RÕ: nhãn kỹ thuật bị cắt giữa chừng ("tw…", "dynamicProgrammi…", "greed…") nên mất nghĩa; nên cho xuống dòng hoặc chỉ giữ hai nhãn đầu.
Luật: `surface-layering` (cột phụ không làm bằng thẻ), `theme-and-type`.
Grammar: `PracticeList` (`fe/packages/starci-next-ui/src/composites/PracticeList`) trong `Page layout="main-rail"` có cột phụ, `Section`.

## Phản biện

Vì sao: tự phản biện của lần chụp này; liệt kê điều còn sai trên màn hình, không sửa trong lần chụp (chủ duyệt rồi mới sửa).
Luật: `surface-layering`, `theme-and-type`.
Grammar: không phải vùng của màn hình; không có thành phần.

- 1440: đề bài hiện nguyên ":::muted Đầu vào :::" và ":::muted Đầu ra :::" thành chữ giữa các đoạn: chỉ thị markdown lộ ra.
- 1440: thẻ đề: chip "Trung bình" nền vàng nhạt (nền tô màu), các nhãn kỹ thuật và "2 s · 256 MB" không viền nên khác kiểu nhau; tiêu đề "Chèn Khoảng" lặp với tiêu đề trang.
- 1440: hai khối mã ví dụ và các mã nội dòng ([a, b], N) nền xám đặc trong thẻ trắng: giếng tô nền; hai khối vào và ra không có nhãn nên không biết cái nào là gì.
- 1440: ô "Mã nguồn" là Textarea phông không đơn cách nên thụt dòng khó đọc, không tô màu cú pháp; dòng cuối bị cắt ngang đáy ô.
- 1440: ba nút "Chạy thử", "Nộp bài", "Về mã khởi đầu" khác kiểu (viền mảnh, xám đặc).
- 1440: ô "Ngôn ngữ" rộng hết cột mà chỉ chứa "Python"; đầu mục "Bài làm của bạn" cùng cỡ với nhãn "Ngôn ngữ", "Mã nguồn" nên không phân cấp.
- 1440: cột phải "Các bài trong pattern": nhãn kỹ thuật bị cắt "tw…" và "in…" giữa chừng; chip "Chưa làm" và "Giải bài" xuống dòng riêng nên hàng rất cao; năm nút "Giải bài" lặp.
- 1920: cột chính bị co vào giữa (x=466) trong khi đường dẫn sát trái x=280; các lỗi ":::muted", giếng xám, cắt nhãn và nút khác kiểu giữ nguyên.
- 390: mã nội dòng ([a, b], "start end", [0, 10^9]) bị bẻ thành ô rộng làm các mục gạch đầu dòng bẻ từng chữ lệch; ":::muted" vẫn lộ.
- 390: ô mã cao khoảng 300px với dòng cuối bị cắt; ba nút trong một hàng khít; cột "Các bài trong pattern" nằm cuối trang với nhãn bị cắt "…" và nút "Giải bài" xuống dòng riêng.
