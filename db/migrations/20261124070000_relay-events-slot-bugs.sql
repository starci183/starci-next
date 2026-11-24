-- The relay accepts the slots of the Tìm sạn bug pack (`bugs`) and of the harness (`harness-stage`, `harness-doctor`, `harness-trial`) in code
-- (relay-feed.policy SLOTS), but the baseline check ck_relay_events_slot only knew the first five, so every `starci-relay run <lesson> --bugs`
-- upload failed its insert (RELAY_UNAVAILABLE) and stayed in the learner's queue. Widens the check; guarded, so a re-run does nothing.

do $$
begin
    if exists (select 1 from pg_constraint where conname = 'ck_relay_events_slot' and conrelid = 'public.relay_events'::regclass) then
        alter table public.relay_events drop constraint ck_relay_events_slot;
    end if;
    alter table public.relay_events add constraint ck_relay_events_slot check (
        slot is null or slot = any (array['test'::text, 'e2e'::text, 'probe'::text, 'scenario'::text, 'challenge'::text, 'bugs'::text,
                                          'harness-stage'::text, 'harness-doctor'::text, 'harness-trial'::text])
    );
end
$$;
