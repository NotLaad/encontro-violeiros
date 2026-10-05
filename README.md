# Encontro dos Violeiros

Site do evento com inscrição, confirmação manual de pagamento via Pix, ingressos com QR Code e controle de entrada.

Feito com Next.js 15 + Supabase (login, banco e segurança).

## Como funciona

1. A pessoa se inscreve no site (ela + quem vai junto) e vê o valor e a chave Pix.
2. Paga e manda o comprovante no WhatsApp da organização (botão pronto na tela).
3. Um admin abre **Participantes**, confere e clica em **Confirmar pagamento**.
4. Clica em **Enviar ingressos no WhatsApp**: abre a conversa com a mensagem e o link já prontos.
5. No dia, a equipe usa a tela **Entrada**: lê o QR ou digita o número do ingresso.

Cada pessoa tem um número sequencial (#0001, #0002…) e um código secreto que vai no QR.
O Pix é gerado com o valor exato (QR Code + Copia e Cola) e o identificador da inscrição (ex.: VIOLEIROS0012).

## Papéis

| Papel      | Pode                                                                 |
|------------|----------------------------------------------------------------------|
| `admin`    | Ver todos os inscritos, confirmar, cancelar, criar cortesias, entrada |
| `portaria` | Só a tela de entrada                                                 |

Toda confirmação, cancelamento e entrada registra quem fez e quando.

## Configuração

### 1. Supabase

1. Crie um projeto em https://supabase.com (plano grátis serve).
2. Abra **SQL Editor**, cole o conteúdo de `supabase/schema.sql` e rode.
3. Rode também, na ordem: `supabase/002_patrocinadores.sql`, `supabase/003_seguranca_e_pix.sql` e `supabase/005_painel_patrocinadores.sql` e `supabase/006_lista_presenca.sql`.
4. Em **Authentication > Sign In / Providers**, **desligue** "Allow new users to sign up".
   Assim ninguém consegue criar conta sozinho, só vocês pelo painel.
5. Em **Authentication > Policies/Password**, coloque senha mínima de 12 caracteres.
### Segurança da área da equipe

- Login com e-mail e senha. Não existe cadastro público: só entra quem um admin criou no Supabase.
- Sem login, nenhuma tela da equipe abre, e o banco recusa qualquer leitura dos inscritos.
- Use senhas fortes (12+ caracteres), uma por pessoa, sem compartilhar.
- 5 tentativas erradas bloqueiam o formulário por 10 minutos; o Supabase também limita tentativas.
- Sai sozinho depois de 30 minutos sem uso; entradas e saídas ficam registradas na tabela `acessos`.

### 2. Cadastrar a equipe

Em **Authentication > Users > Add user**, crie cada pessoa com e-mail e senha
(marque "Auto confirm user"). Depois rode no SQL Editor:

```sql
insert into admins (user_id, nome, papel)
select id, 'Dalton', 'admin' from auth.users where email = 'seu@email.com';

insert into admins (user_id, nome, papel)
select id, 'Portaria 1', 'portaria' from auth.users where email = 'portaria1@email.com';
```

### 3. Rodar no computador

```bash
cp .env.example .env.local   # preencha com a URL e a anon key do Supabase
npm install
npm run dev
```

Site: http://localhost:3000. Área da equipe: http://localhost:3000/entrar

### 4. Publicar

Suba o projeto no GitHub e importe na Vercel (grátis). Cadastre as 3 variáveis do
`.env.example` em **Settings > Environment Variables**. `NEXT_PUBLIC_SITE_URL` precisa ser
o endereço final, porque vai no link do ingresso.

A câmera do check-in só funciona em HTTPS (a Vercel já entrega assim).

## O que editar

- **Textos, data, local, programação, chave Pix e WhatsApp**: `lib/evento.ts`
- **Fotos do topo**: troque `public/fotos/encontro-1.jpg` e `encontro-2.jpg` (mesmo nome)
- **Convite**: `public/convite.jpg` (também vira a imagem de prévia quando o link é compartilhado no WhatsApp)
- **Preços e tipos de ingresso**: no SQL Editor, por exemplo
  ```sql
  update tipos_ingresso set preco = 45 where id = 'adulto';
  ```
- **Patrocinadores**: pelo painel, na aba **Patrocinadores** (cadastrar, editar, esconder, ordenar e enviar logo). Alternativa manual: rode uma vez `supabase/002_patrocinadores.sql`. Depois cadastre em
  **Table Editor > patrocinadores** (nome, categoria, cidade, descrição, tags, endereço, cor de fundo,
  Instagram, WhatsApp). Logos: **Storage > patrocinadores > Upload**, clique no arquivo, **Get URL**
  e cole em `logo_url`. PNG com fundo transparente fica melhor. Use `ordem` para ordenar.

## Dia do evento

- Teste a internet no local antes. Se o sinal for fraco, leve um roteador 4G.
- Antes de abrir os portões, baixe a lista em **Participantes > Baixar lista** como plano B.
- Cada pessoa da portaria entra com o próprio login no celular, em **Entrada**.
- Digitando o número, o sistema mostra o nome: confira com a pessoa antes de confirmar.

## Segurança

- O navegador nunca lê a lista de inscritos: o banco só entrega esses dados para usuários da tabela `admins` (Row Level Security).
- O preço é calculado no banco. Mesmo alterando a página, ninguém consegue pagar menos.
- O link do ingresso usa um token de 36 caracteres e o QR só aparece depois do pagamento confirmado.
- Ingresso de inscrição cancelada ou não paga é recusado na entrada.

Melhorias recomendadas se o evento crescer: CAPTCHA no formulário (Cloudflare Turnstile)
contra inscrições em massa e verificação em duas etapas (MFA) no login dos admins.
