---
title: CV công khai, đang tải
route: /cv/{slug}
area: cv
---

Route: `/cv/{slug}` (ảnh chụp: đang đọc). Mã: `fe/apps/app/src/components/blocks/PublicCv/`.

## Chủ CV

Vì sao: khung xương đúng chỗ avatar, tên, dòng sự kiện và nút, để trang không nhảy khi dữ liệu tới. Nút Chia sẻ chưa bấm được cho tới khi biết CV có thật, để không chia sẻ một liên kết không có CV.
Luật: một vùng đang tải đi qua `SlotView`, chỉ nó rẽ nhánh; lá và vùng ghép chỉ nhận `isLoading`.
Grammar: `Avatar`, `Heading`, `Text`, `Button` với `isLoading`.

## Dòng CV đã ký

Vì sao: ba dòng xương với ba vạch (câu, nguồn, vết tin cậy), giữ tiêu đề "Dòng CV đã ký" thật.
Luật: như trên.
Grammar: `Section kind="list" isLoading` + `ListRow`.

## Vì sao tin được CV này

Vì sao: khối giải thích cũng là khung xương vì nó đi cùng CV; không vẽ khi kết quả là không có CV.
Luật: như trên.
Grammar: `Section isLoading`, `Stepper isLoading`.
