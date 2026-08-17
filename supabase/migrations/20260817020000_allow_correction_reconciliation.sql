begin;

create or replace function public.admin_reconcile_stable_operation(
  p_operation_id uuid,
  p_bank_received_amount numeric
)
returns public.stable_operations
language plpgsql
security definer
set search_path = ''
as $$
declare
  selected_operation public.stable_operations%rowtype;
  reconciled_operation public.stable_operations%rowtype;
  normalized_amount numeric(18, 2) := round(p_bank_received_amount, 2);
begin
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Admin access required';
  end if;

  select * into selected_operation
  from public.stable_operations
  where id = p_operation_id
  for update;

  if selected_operation.id is null then
    raise exception 'Operación no encontrada';
  end if;
  if selected_operation.status not in ('proof_submitted', 'verifying', 'payment_received', 'correction_requested') then
    raise exception 'Solo puedes conciliar una operación antes de preparar la entrega Stable';
  end if;
  if selected_operation.proof_path is null then
    raise exception 'La operación no tiene comprobante';
  end if;
  if selected_operation.sender_id is null then
    raise exception 'La operación no tiene remitente identificado';
  end if;
  if normalized_amount is null or normalized_amount <= 0 then
    raise exception 'Introduce el monto que realmente llegó al banco';
  end if;
  if normalized_amount > selected_operation.usd_amount then
    raise exception 'El monto recibido no puede superar el monto enviado';
  end if;

  update public.stable_operations
  set bank_received_amount = normalized_amount,
      status = case
        when selected_operation.status in ('proof_submitted', 'verifying') then 'payment_received'
        else selected_operation.status
      end
  where id = p_operation_id
  returning * into reconciled_operation;

  return reconciled_operation;
end;
$$;

revoke all on function public.admin_reconcile_stable_operation(uuid, numeric) from public, anon;
grant execute on function public.admin_reconcile_stable_operation(uuid, numeric) to authenticated;

commit;
