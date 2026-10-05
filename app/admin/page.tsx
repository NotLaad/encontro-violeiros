import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PainelPedidos, type Pedido } from '@/components/admin/PainelPedidos';

export default async function Admin() {
  const supabase = await createClient();
  const { data: papel } = await supabase.rpc('papel_atual');
  if (papel !== 'admin') redirect('/admin/checkin');

  const { data } = await supabase
    .from('pedidos')
    .select('id, numero, responsavel, whatsapp, valor_total, valor_pix, status, cortesia, criado_em, ingressos_enviados_em, participantes(id, numero, nome, tipo, checkin_em)')
    .order('numero', { ascending: false });

  return <PainelPedidos pedidos={(data ?? []) as Pedido[]} />;
}
