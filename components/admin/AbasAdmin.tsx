'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AbasAdmin({ papel }: { papel: string }) {
  const caminho = usePathname();
  const abas = [
    ...(papel === 'admin'
      ? [
          { href: '/admin', rotulo: 'Inscrições', ativa: caminho === '/admin' || caminho.startsWith('/admin/inscricao') },
          { href: '/admin/patrocinadores', rotulo: 'Patrocinadores', ativa: caminho.startsWith('/admin/patrocinadores') },
        ]
      : []),
    { href: '/admin/checkin', rotulo: 'Entrada', ativa: caminho.startsWith('/admin/checkin') },
  ];
  return (
    <div className="adm-abas" style={{ display: 'flex', gap: '.25rem' }}>
      {abas.map((a) => (
        <Link key={a.href} href={a.href} aria-current={a.ativa ? 'page' : undefined}>{a.rotulo}</Link>
      ))}
    </div>
  );
}
