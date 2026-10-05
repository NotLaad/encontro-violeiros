// =====================================================================
// Dados do evento — edite aqui
// =====================================================================
export const evento = {
  nome: 'Encontro de Violeiros',
  cidade: 'Pindamonhangaba',
  chamada: 'Prepare-se para uma tarde muito especial, com muita alegria, comunhão e momentos incríveis!',
  data: 'Sábado, 7 de novembro de 2026',
  dataCurta: '07/11/2026',
  horario: '13h',
  horarioLongo: 'a partir das 13h',
  valorTexto: 'R$ 40',
  local: 'Salão Flor de Abóbora',
  endereco: '', // ex.: 'Rua Tal, 123 – Bairro'. Se ficar vazio, não aparece.
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Sal%C3%A3o+Flor+de+Ab%C3%B3bora+Pindamonhangaba',
  instagram: 'encontropinda_',
  sobre: [
    'Prepare-se para uma tarde muito especial, com muita alegria, comunhão e momentos incríveis!',
    'Garanta já o seu ingresso! Não deixe para a última hora: chame seus amigos e familiares e venha participar com a gente.',
  ],
  // Deixe vazio [] para esconder a programação no site
  programacao: [] as { hora: string; titulo: string }[],
  pix: {
    chave: '49119636890', // CPF (só números). Pode trocar por uma chave aleatória
    favorecido: 'Ana Beatriz Silva Tavares Nascimento',
    banco: 'Nubank',
    cidade: 'Pindamonhangaba',
  },
  // WhatsApp da organização (55 + DDD + número): recebe comprovantes e contatos de parceiros
  whatsappOrganizacao: '5512992465318',
  whatsappTexto: '(12) 99246-5318',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
};
