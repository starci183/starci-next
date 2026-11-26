-- Essentials, one course per concept (owner 2026-11-26): the Saga course of the seed standard is now `saga`; the course that held the
-- Saga lesson before, `shop-giay`, is no longer named by the standard. The seed's essentials-courses set only adds and supersedes
-- versions by course id, so it never takes a course the standard stopped naming off the catalog: its live version is retired here.
-- The stored versions stay (rule 4 of essentials: a stored version is never edited or deleted); only the live flag goes off. The lesson
-- `saga-compensation` keeps its id, its lab record and every learner's runs and marks, and is served from the course `saga`.
-- A database that never held `shop-giay` (a fresh start, staging, production) changes nothing.
update public.course_courses set published = false where course_id = 'shop-giay' and published;
