---
title: Giải một bài (đề, bài làm, gợi ý)
route: /practice/[slug]
area: practice
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
