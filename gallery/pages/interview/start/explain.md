---
title: Phỏng vấn thử (bắt đầu một buổi)
route: /interview
area: interview
---

Route: `/interview` (ảnh chụp: học viên Premium, đang còn một buổi dở). Mã: `fe/apps/app/src/components/blocks/InterviewHome/component.tsx` (vẽ), `index.tsx` (đọc, bắt đầu, bỏ buổi). Khung chung giải thích ở `learn/home`.

## Phần mở đầu "Phỏng vấn thử với AI"

Vì sao: phần mở đầu phẳng trên nền trắng, không thẻ: nhãn nhỏ viết hoa "Phỏng vấn thử · AI hỏi, chấm một lượt khi kết thúc", tiêu đề, đoạn nói luật buổi (trả lời bằng chữ, không nhận xét giữa buổi, không tra nội dung bài, chấm một lượt theo đáp án và tiêu chí của thầy) và một chip xám "5 câu, trộn kỹ thuật và hành vi". CHƯA RÕ: không có dải tiêu đề `Page header` như các trang con, và chip "5 câu" lặp lại dòng muted "5 câu, trộn kỹ thuật và hành vi" ngay trên nút bắt đầu.
Luật: `surface-layering`, `theme-and-type`.
Grammar: `Page` bọc `CatalogIntro` (`fe/packages/starci-next-ui/src/composites/CatalogIntro`).

## Khối "Bạn đang có một buổi dở dang"

Vì sao: chỉ hiện khi học viên còn một buổi chưa nộp: một `Section` phẳng, một dòng nói ngày bắt đầu và rằng "Tiếp tục" quay lại đúng câu đang hỏi. Hai nút pill: "Tiếp tục" là nút chính duy nhất của cả màn (tím), "Bỏ buổi này" trung tính xám đặc (bỏ thì buổi không được chấm).
Luật: `surface-layering` (một nút chính mỗi màn), `theme-and-type`.
Grammar: `Section`, `Button intent="commit"` và `Button intent="alternative"` (`leaf/Button`).

## Khối "Hết buổi miễn phí tháng này"

Vì sao: không có trong ảnh (học viên Premium). Chỉ hiện khi quota miễn phí hết và chưa có Premium (`LockedNotice`): một câu nói Premium mở khoá phỏng vấn không giới hạn, kèm lệnh tới gói Premium. CHƯA RÕ: khi cùng lúc có buổi dở dang, chỉ một trong hai lệnh được là nút chính và nút còn lại phải trung tính; chưa có ảnh của trạng thái này để xác nhận.
Luật: `surface-layering` (một nút chính mỗi màn).
Grammar: `LockedNotice` (`fe/packages/starci-next-ui/src/composites/LockedNotice`), `Button href`.

## Biểu mẫu "Thiết lập buổi phỏng vấn"

Vì sao: một `Section` phẳng: ba ô chọn trắng viền 1px (Lộ trình, Cấp độ, Ngôn ngữ code; hai cột ở 1440, một cột ở 390), hai dòng muted nói buổi gồm mấy câu và có bao nhiêu bộ câu hỏi đã xuất bản cho lộ trình đó ("15 bộ"), rồi nút "Bắt đầu phỏng vấn" kèm dòng muted "Premium: phỏng vấn không giới hạn trong mức dùng hợp lý." Nút này là pill trung tính (viền mảnh) vì nút chính của màn đã thuộc "Tiếp tục". CHƯA RÕ: hai dòng muted đứng cách nhau và cách ô chọn khá xa, làm biểu mẫu thưa.
Luật: `surface-layering` (form là Section, một nút chính), `theme-and-type` (ô trắng viền 1px).
Grammar: `Section`, `Grid kind="form"`, `Choice`/`Select` (`composite/Select`), `Button intent="neutral" href` (`leaf/Button`), `Text tone="muted"`.

## Danh sách "Lịch sử"

Vì sao: một `Section` danh sách phẳng các buổi gần đây: tên lộ trình và cấp ("Backend / Fullstack · Junior"), dòng 12 muted ngày và trạng thái ("17 thg 11, 2026 · Đang làm"), bên phải nút pill trung tính "Tiếp tục" hoặc "Xem kết quả" tuỳ trạng thái. Biểu đồ xu hướng điểm không có trong ảnh (chưa buổi nào chấm).
Luật: `surface-layering` (danh sách là Section, không thẻ), `theme-and-type`.
Grammar: `PracticeList` (`fe/packages/starci-next-ui/src/composites/PracticeList`) trong `Section`.

## Trạng thái đang tải và lỗi

Vì sao: không có trong ảnh. Khi đọc, mỗi khối hiện khung xương cùng hình học; khi lỗi, `Alert` có nút "Thử lại" trung tính; khi bắt đầu bị từ chối, lý do hiện ngay trên nút.
Luật: `grammar-slot-interface`, `surface-layering` (trạng thái nằm trong vùng).
Grammar: `SlotView`, `Alert` (`composite/Alert`).
