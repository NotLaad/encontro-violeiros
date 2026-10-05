import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { GerenciarPatrocinadores } from '@/components/admin/GerenciarPatrocinadores';
import type { Patrocinador } from '@/components/CartaoPatrocinador';

export default async function PaginaPatrocinadores() {
  const supabase = await createClient();
  const { data: papel } = await supabase.rpc('papel_atual');
  if (papel !== 'admin') redirect('/admin/checkin');
  const { data } = await supabase.from('patrocinadores').select('*').order('ordem').order('nome');
  return <GerenciarPatrocinadores lista={(data ?? []) as (Patrocinador & { ordem: number; ativo: boolean })[]} />;
}
