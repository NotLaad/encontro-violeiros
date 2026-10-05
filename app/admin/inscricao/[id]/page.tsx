import QRCode from 'qrcode';
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DetalheInscricao, type PedidoDetalhe } from '@/components/admin/DetalheInscricao';

export default async function PaginaDetalhe({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: papel } = await supabase.rpc('papel_atual');
  if (papel !== 'admin') redirect('/admin/checkin');

  const { data } = await supabase
    .from('pedidos')
    .select('*, participantes(id, numero, nome, tipo, codigo, checkin_em), confirmador:admins!pedidos_confirmado_por_fkey(nome), cancelador:admins!pedidos_cancelado_por_fkey(nome)')
    .eq('id', id)
    .maybeSingle();
  if (!data) notFound();

  const pedido = data as PedidoDetalhe;
  pedido.participantes.sort((a, b) => a.numero - b.numero);
  const qrs =
    pedido.status === 'pago'
      ? await Promise.all(pedido.participantes.map((p) => QRCode.toDataURL(p.codigo, { margin: 1, width: 240, errorCorrectionLevel: 'M' })))
      : [];

  return <DetalheInscricao pedido={pedido} qrs={qrs} />;
}
