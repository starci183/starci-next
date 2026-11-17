# Bản chất  (gallery: essentials/lesson, route /essentials/[topic]/[lesson])
Mục tiêu: biết mình đã hiểu gì bằng 5 câu hỏi mở bài chấm ngay, rồi đọc bài có chỗ nhấn đúng mục còn yếu.
Thao tác: lesson(id) trả essential.opener (prompt, choices, sectionId, sectionRef, scenarioId), sections, learningOutcomes; submitLessonAttempt(lessonId, version, activityId, revision, answer) chấm ở server (correct, options); lessonOpenerScores so điểm lần đầu và lần gần nhất; lessonProgress cho phần đã xong. cần API: ghi nhận mục đã đọc (markLessonSectionRead) nếu muốn bỏ nhãn "Nên đọc kỹ" khi đã đọc; còn lại đã có.
Dữ liệu: số liệu minh họa (tên, số tiền, ngày dd/mm/yyyy) nằm trong các khung của pages/20-essentials-lesson.html; trường thật theo các thao tác ở trên.
Trạng thái: các màn đã vẽ: essentials/lesson (Bản chất, câu 2 đã trả lời; 1440 và 390); essentials/lesson-question-1-unanswered (Bản chất, câu 1 chưa trả lời; chỉ 390); essentials/lesson-five-question-result (Bản chất, kết quả 5 câu; chỉ 390); essentials/lesson-reading (Bản chất, đang đọc bài viết; chỉ 390); essentials/lesson-free-end-of-part-1 (Bản chất, tài khoản miễn phí, cuối phần 1; chỉ 390). Trạng thái của bảng PROJECT-GALLERY-6 không vẽ: empty, loading, error, no-match, detail, first-visit, editing (trang không chạm tới, hoặc chưa được vẽ khi duyệt; thêm khi code nếu trang thật sự chạm tới).
Quyền: học viên đã đăng nhập; không có phân quyền riêng ngoài cổng Premium của khu vực (concepts/premium.md).
Grammar: Tabs có count, RadioGroup, ListRow verdict, MarkdownArticle, Alert, Meter segments={5}. cần Grammar: lựa chọn trắc nghiệm đã chấm (đúng/sai kèm lời giải) cho RadioGroup; Meter tô từng đoạn theo đúng/sai.
Hành động chính: "Câu tiếp theo"; xong 5 câu thì "Đọc bài viết".
Lọc: không có.
Việc đổi: mở bài bằng trắc nghiệm chấm ngay thay vì dự đoán tự do; bài viết xoay quanh một bài toán nghiệp vụ. Phần 1 miễn phí; tài khoản miễn phí đọc hết rồi thấy ghi chú phần 2–4 thuộc Premium.
Xung đột: đáp án không gửi xuống trình duyệt trước khi chọn (opener chỉ có choices).
