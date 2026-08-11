begin;

revoke all on public.stable_senders from anon;
revoke all on public.stable_operation_documents from anon;

commit;
