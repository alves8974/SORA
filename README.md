# 🎯 Cloaker Platform - Sistema de Detecção de Bots

Plataforma completa de cloaking server-side com dashboard administrativo, detecção avançada de bots do Facebook, sistema de logs e pronto para deploy gratuito na Vercel.

## ⚡ Características

- ✅ **Detecção Server-Side**: Middleware Next.js que detecta bots antes de servir a página
- ✅ **Dual-Page System**: Safe Page para bots, Real Page para visitantes reais
- ✅ **Dashboard Administrativo**: Interface inspirada no Sorafy para monitoramento
- ✅ **Logs em Tempo Real**: Histórico completo de todas as visitas
- ✅ **Vercel KV Integration**: Armazenamento gratuito de logs e estatísticas
- ✅ **Deploy Gratuito**: 100% compatível com o plano gratuito da Vercel

## 🚀 Como Começar

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Vercel KV

1. Acesse [Vercel Dashboard](https://vercel.com/dashboard)
2. Crie um novo KV Database:
   - Vá em "Storage" → "Create Database"
   - Selecione "KV" (Redis)
   - Escolha um nome (ex: "cloaker-db")
   - Selecione o plano FREE
3. Copie as credenciais geradas

### 3. Configurar Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```bash
cp .env.example .env.local
```

Edite `.env.local` e adicione suas credenciais do Vercel KV:

```env
KV_URL=your_kv_url_here
KV_REST_API_URL=your_kv_rest_api_url_here
KV_REST_API_TOKEN=your_kv_rest_api_token_here
KV_REST_API_READ_ONLY_TOKEN=your_kv_rest_api_read_only_token_here

ADMIN_PASSWORD=sua_senha_admin_aqui
NEXTAUTH_SECRET=sua_chave_secreta_aqui
NEXTAUTH_URL=http://localhost:3000
```

### 4. Rodar Localmente

```bash
npm run dev
```

Acesse:
- **Real Page**: http://localhost:3000 (visitantes reais veem isso)
- **Safe Page**: http://localhost:3000/safe (bots veem isso)
- **Dashboard**: http://localhost:3000/admin

## 🎨 Estrutura do Projeto

```
cloaker-platform/
├── app/
│   ├── page.tsx              # Real Page (ClickJogos)
│   ├── safe/page.tsx         # Safe Page (FazGame)
│   ├── admin/
│   │   ├── page.tsx          # Dashboard principal
│   │   ├── logs/page.tsx     # Visualização de logs
│   │   └── settings/page.tsx # Configurações
│   └── api/
│       ├── stats/route.ts    # API de estatísticas
│       └── logs/route.ts     # API de logs
├── lib/
│   ├── detection.ts          # Sistema de detecção de bots
│   └── database.ts           # Operações com Vercel KV
├── middleware.ts             # Middleware de cloaking
└── README.md
```

## 🔍 Como Funciona

### Sistema de Detecção

O sistema detecta bots através de múltiplas técnicas:

1. **🎯 Referer Analysis (PRIORIDADE MÁXIMA)**: Detecta acessos vindos da Biblioteca de Anúncios do Facebook
   - **Proteção contra Espionagem**: Bloqueia concorrentes que tentam ver sua oferta através da biblioteca de anúncios
   - Detecta todos os padrões de URL da biblioteca: `facebook.com/ads/library`, `transparency.fb.com`, etc.
   - **Confiança 100%**: Quando detectado, mostra a safe page imediatamente
2. **User-Agent Analysis**: Detecta strings como "facebookexternalhit", "Facebot"
3. **IP Range Verification**: Verifica se o IP pertence aos ranges do Facebook
4. **Header Analysis**: Analisa headers HTTP suspeitos
5. **Confidence Score**: Sistema de pontuação para determinar se é bot (threshold: 40%)

### Fluxo de Requisição

```
Visitante → Middleware → Detecção → Decisão
                                    ├─ Bot (>40%) → Safe Page
                                    └─ Real (<40%) → Real Page
```

Todas as visitas são logadas no Vercel KV com:
- Timestamp
- User-Agent
- IP
- Referer (para detectar biblioteca de anúncios)
- Resultado da detecção
- Confidence score
- Página mostrada

## 📊 Dashboard Administrativo

O dashboard oferece:

- **Estatísticas em tempo real**:
  - Total de visitas
  - Visitas de bots
  - Visitantes reais
  - Taxa de cloaking

- **Visualização de logs**:
  - Histórico completo
  - Filtros (bots/reais)
  - Detalhes expandidos

- **Configurações**:
  - Ativar/desativar detecção
  - Ajustar threshold
  - Gerenciar páginas

## 🌐 Deploy na Vercel

### Método 1: Via Dashboard

1. Acesse [Vercel](https://vercel.com)
2. Clique em "Add New Project"
3. Importe o repositório Git
4. Configure as variáveis de ambiente
5. Deploy!

### Método 2: Via CLI

```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

### Configurar Variáveis de Ambiente na Vercel

1. Vá em "Settings" → "Environment Variables"
2. Adicione todas as variáveis do `.env.local`
3. Redeploy o projeto

## 🔒 Segurança

> **⚠️ ATENÇÃO**: Cloaking viola as políticas do Facebook Ads e pode resultar em:
> - Ban permanente da conta de anúncios
> - Possíveis implicações legais
> - Perda de credibilidade

Este projeto é apenas para fins educacionais e testes pessoais.

## 💰 Custos

### Vercel (Plano Gratuito)
- ✅ 100 GB bandwidth/mês
- ✅ 100 GB-horas serverless/mês
- ✅ 1 milhão de invocações/mês
- ✅ KV Database (tier gratuito)

**Custo estimado**: R$ 0,00 para começar

Só haverá custos se ultrapassar os limites (milhares de visitas/dia).

## 🛠️ Personalização

### Alterar a Real Page

Edite `app/page.tsx` com o conteúdo da sua landing page de vendas.

### Alterar a Safe Page

Edite `app/safe/page.tsx` com o conteúdo "seguro" para mostrar aos bots.

### Ajustar Detecção

Edite `lib/detection.ts` para:
- Adicionar novos User-Agents
- Modificar ranges de IP
- Ajustar o threshold de confiança

## 📝 Logs e Monitoramento

Todos os logs são automáticos e incluem:
- Timestamp exato
- User-Agent completo
- IP do visitante
- Score de confiança
- Razões da detecção
- Página servida (safe/real)

Os logs expiram automaticamente após 30 dias.

## 🆘 Troubleshooting

### Erro: "KV is not defined"
- Verifique se as variáveis de ambiente do Vercel KV estão configuradas
- Reinicie o servidor de desenvolvimento

### Todos visitantes veem Safe Page
- Verifique o threshold de detecção (pode estar muito baixo)
- Limpe o cache do navegador
- Teste com diferentes User-Agents

### Dashboard não carrega
- Verifique se o Vercel KV está funcionando
- Verifique os logs do console

## 📚 Recursos

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel KV Documentation](https://vercel.com/docs/storage/vercel-kv)
- [Vercel Deployment](https://vercel.com/docs)

## 📄 Licença

Este projeto é fornecido "como está" apenas para fins educacionais. Use por sua conta e risco.

---

**🎯 Desenvolvido com Next.js + TypeScript + Vercel KV**
