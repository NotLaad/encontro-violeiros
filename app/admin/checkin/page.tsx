import { PainelEntrada } from '@/components/admin/PainelEntrada';

export const metadata = { title: 'Entrada' };

export default function PaginaCheckin() {
  return (
    <>
      <span className="eyebrow" style={{ marginBottom: '.25rem' }}>Área da equipe</span>
      <h1 className="adm-titulo">Entrada</h1>
      <PainelEntrada />
    </>
  );
}
