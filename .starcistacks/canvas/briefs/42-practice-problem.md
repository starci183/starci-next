# Giải bài  (gallery: practice/problem, route /practice/[slug])
Mục tiêu: đọc đề, viết mã, chạy thử rồi nộp, mở gợi ý khi kẹt, xem lời giải khi muốn.
Thao tác: practiceProblem (đề markdown, ví dụ, mã khởi đầu, giới hạn thời gian và bộ nhớ, hintsRevealed/hintsTotal, nextSlug); runPractice (chạy ví dụ); submitPractice (chấm đủ test, test ẩn chỉ hiện chỉ số); practiceSubmission (verdict queued, running, accepted, wrong-answer, time-limit, compile-error, runtime-error); revealPracticeHint (ba bậc, mở lần lượt). cần API: revealPracticeSolution (trả lời giải mẫu và ghi lại để bài không vào dòng kinh nghiệm).
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/42-practice-problem.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: practice/problem (Giải bài, đã nộp sai; 1440 và 390); practice/problem-grading (Giải bài, đang chấm; chỉ 390); practice/problem-accepted (Giải bài, Accepted; chỉ 390); practice/problem-compile-error (Giải bài, lỗi biên dịch; chỉ 390); practice/problem-confirm-view-solution (Giải bài, xem lời giải, xác nhận; chỉ 390); practice/problem-error (Giải bài, lỗi tải đề; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: empty, loading, no-match, detail, first-visit, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: học viên đã đăng nhập; không có phân quyền riêng ngoài cổng Premium của khu vực (concepts/premium.md).
Grammar: PageHeader, Tabs, MarkdownArticle, Select, Section kind="list", ListRow verdict, Badge, Alert, AlertDialog. cần Grammar: ô soạn mã có tô màu cú pháp và thụt dòng (hiện chỉ có Textarea).
Hành động chính: "Nộp bài" ("Chạy thử" trung tính); đang chấm thì xám kèm lý do; Accepted thì "Bài tiếp theo".
Lọc: không có.
Việc đổi: bỏ thẻ đề nền xám, ba kiểu nút và cột phải lặp "Giải bài"; thêm bậc gợi ý rõ ràng. Lỗi biên dịch hiện đầu ra trình biên dịch và không tính lần sai.
Xung đột: xem lời giải trước khi Accepted thì bài không tính vào kinh nghiệm (giả định).
