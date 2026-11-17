---
title: Giải một bài (đề, bài làm, gợi ý)
route: /practice/[slug]
area: practice
reviewed: 2026-11-17
---

Route: `/practice/[slug]` (ảnh chụp: bài "Chèn Khoảng", bài miễn phí của pattern Mảng, ngôn ngữ Python). Mã: `fe/apps/app/src/components/blocks/PracticeSolve/component.tsx`. Khung chung giải thích ở `learn/home`.

## Dải đầu trang: đường dẫn "Luyện code / Mảng / Chèn Khoảng" và tiêu đề

Vì sao: dải trắng phẳng, viền dưới, sát trái: đường dẫn ba mục (Luyện code về `practice/list`, Mảng về `practice/pattern`, mục cuối đậm) và tiêu đề 18/600. Đường dẫn cho học viên lùi đúng một cấp.
Luật: `page-header-left-sublabel-xs.md`, `type-scale-14-12.md`.
Grammar: `Page header={{ breadcrumbs, title }}` (`frame/Page/index.d.ts`).

## Thẻ đề bài

Vì sao: một thẻ trắng nổi: tên pattern muted, hàng chip (độ khó "Trung bình" tông cảnh báo, các nhãn kỹ thuật, giới hạn "2 s · 256 MB"), tên bài đậm, rồi đề viết bằng markdown: đoạn mô tả, mục Đầu vào, Đầu ra, "Ví dụ" với hai khối mã (vào và ra). Khối mã xám là đúng phông đơn cách của Grammar. SAI: đề hiện nguyên các dấu ":::muted Đầu vào :::" và ":::muted Đầu ra :::" thành chữ giữa các đoạn; đó là chỉ thị markdown (`:::muted`) mà bộ vẽ markdown của Grammar chưa hiểu hoặc đề viết sai cú pháp, nên ba nhãn ấy lẽ ra là nhãn phụ muted. Không sửa được gọn trong fe vì đề đến từ bộ bài của thầy (dữ liệu), cần Grammar `MarkdownArticle` hỗ trợ chỉ thị hoặc đổi dữ liệu.
Luật: `pink-page-surface-rule.md`, `type-scale-14-12.md`.
Grammar: `MarkdownArticle` và `FencedCodeBlock` (`node_modules/@starci/grammar/dist/core/frame/MarkdownArticle/index.d.ts`), `Badge`; code `PracticeSolve/component.tsx`.

## Khối "Bài làm của bạn"

Vì sao: nhãn khối trên một thẻ: ô chọn "Ngôn ngữ" (Python...), dòng muted "Chấm trên máy chấm của StarCi, test ẩn.", ô "Mã nguồn" nhiều dòng với mã khởi đầu có chỗ TODO và hàng lệnh: "Chạy thử" (trung tính, chạy ví dụ), "Nộp bài" là nút chính (chấm thật, tính Accepted), "Về mã khởi đầu" trung tính, và dòng muted nói bản nháp từng ngôn ngữ được giữ trên trình duyệt này. Ô mã cao cố định, tự cuộn bên trong, chữ đơn cách.
Luật: `verify-against-visualize.md` (một nút chính), `type-scale-14-12.md`.
Grammar: `Select` (`composite/Select`), `Textarea` (`composite/Textarea`), `Button intent="commit"` và `Button intent="neutral"`. CHƯA RÕ: ô mã là `Textarea` thường, chưa có soạn thảo mã (tô màu, thụt dòng) của Grammar.

## Khối "Gợi ý"

Vì sao: nhãn khối trên một thẻ: câu muted nói AI chỉ gợi ý, không viết code hộ, có ba bậc mở lần lượt, và nút trung tính "Mở gợi ý tiếp" (mỗi lần mở một bậc, có thể bị trừ điểm nên không phải nút chính).
Luật: `verify-against-visualize.md`, `pink-page-surface-rule.md`.
Grammar: `SurfaceCard label`, `Button intent="neutral"`, `Alert` khi bị từ chối (`composite/Alert`).

## Cột phải "Các bài trong pattern"

Vì sao: cột phụ liệt kê năm bài cùng pattern để chuyển bài mà không về danh sách: số thứ tự, tên, dòng 12 muted nhãn (cắt bằng dấu "…" khi dài), chip trạng thái ("Chưa làm" hoặc "Premium") và nút "Giải bài". Dưới lg cột này xếp xuống dưới cột chính.
Luật: `pink-page-surface-rule.md` (cột phụ), `type-scale-14-12.md`.
Grammar: `PracticeList` (`fe/packages/starci-next-ui/src/composites/PracticeList`) trong `Page layout="workspace"` có cột phụ. CHƯA RÕ: nhãn kỹ thuật bị cắt giữa chừng ("t…", "dynamicProgramm…") nên mất nghĩa; nên cho xuống dòng hoặc chỉ giữ hai nhãn đầu.
