-- Essentials (owner 2026-11-28): a case's "Sửa thế nào / Trước–Sau / Ca này chứng minh" block opens once the case was green, or once the
-- learner pressed its "Kẹt quá? Xem lời giải" disclosure. Opening every hint level no longer counts, so the server keeps the press on the
-- learner's mark of the case. It never goes back to false (`openCourseSolution` is idempotent).
-- Idempotent: a second run finds the column and changes nothing; every existing mark starts unopened.
alter table public.course_case_marks add column if not exists solution_opened boolean not null default false;
