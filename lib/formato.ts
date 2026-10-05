export const brl = (v: number | string) =>
  Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const num = (n: number) => '#' + String(n).padStart(4, '0');

export const hora = (iso: string) =>
  new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });

export const dataHora = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' });

/** Monta link do WhatsApp. Aceita número com ou sem 55. */
export function linkWhats(numero: string, texto: string) {
  const d = numero.replace(/\D/g, '');
  const completo = d.length <= 11 ? '55' + d : d;
  return `https://wa.me/${completo}?text=${encodeURIComponent(texto)}`;
}
