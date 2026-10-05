// Gera o "Pix Copia e Cola" (BR Code estático, padrão EMV do Banco Central)
// com valor exato e um identificador da inscrição (txid). Sem custo e sem centavos extras.

function campo(id: string, valor: string) {
  return id + String(valor.length).padStart(2, '0') + valor;
}

function crc16(payload: string) {
  let crc = 0xffff;
  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8;
    for (let b = 0; b < 8; b++) crc = crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1;
    crc &= 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

const limpar = (s: string, max: number) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^A-Za-z0-9 ]/g, '').toUpperCase().trim().slice(0, max);

export function pixCopiaECola(o: { chave: string; nome: string; cidade: string; valor: number; txid: string }) {
  const conta = campo('00', 'br.gov.bcb.pix') + campo('01', o.chave.trim());
  const txid = o.txid.replace(/[^A-Za-z0-9]/g, '').slice(0, 25) || '***';
  const semCrc =
    campo('00', '01') +
    campo('26', conta) +
    campo('52', '0000') +
    campo('53', '986') +
    campo('54', o.valor.toFixed(2)) +
    campo('58', 'BR') +
    campo('59', limpar(o.nome, 25)) +
    campo('60', limpar(o.cidade, 15)) +
    campo('62', campo('05', txid)) +
    '6304';
  return semCrc + crc16(semCrc);
}

/** Identificador que aparece no Pix: VIOLEIROS0012 */
export const txidDaInscricao = (numero: number) => 'VIOLEIROS' + String(numero).padStart(4, '0');
