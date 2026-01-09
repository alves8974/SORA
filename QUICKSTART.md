# 🚀 Quick Start Guide - Cloaker Platform

## 📋 Passo a Passo para Começar

### 1️⃣ Criar Vercel KV Database (GRATUITO)

1. Acesse: https://vercel.com/dashboard
2. Faça login ou crie uma conta
3. Clique em **"Storage"** no menu lateral
4. Clique em **"Create Database"**
5. Selecione **"KV"** (Redis)
6. Escolha um nome: **"cloaker-db"**  
7. Região: Escolha a mais próxima do Brasil
8. Plano: **FREE** (0 custo)
9. Clique em **"Create"**

### 2️⃣ Copiar Credenciais

Após criar, você verá 4 variáveis. Copie todas:

```
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
```

### 3️⃣ Configurar Projeto Local

1. Abra o projeto no VS Code
2. Crie um arquivo `.env.local` na raiz
3. Cole as 4 variáveis que você copiou:

```env
# Cole aqui as 4 linhas do Vercel KV
KV_URL=redis://...
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...

# Defina uma senha para o admin
ADMIN_PASSWORD=suasenhaaqui

# Deixe como está
NEXTAUTH_SECRET=qualquer-texto-aleatorio-123
NEXTAUTH_URL=http://localhost:3000
```

### 4️⃣ Rodar o Projeto

```bash
npm run dev
```

Acesse: http://localhost:3000

### 5️⃣ Testar o Cloaker

#### Teste 1: Visitante Normal
1. Abra http://localhost:3000 no navegador normal
2. Você deve ver: **ClickJogos - Loja de Produtos Gamer** ✅

#### Teste 2: Simular Bot do Facebook
1. Instale extensão: [User-Agent Switcher](https://chrome.google.com/webstore/detail/user-agent-switcher)
2. Mude o User-Agent para: `facebookexternalhit/1.1`
3. Recarregue http://localhost:3000
4. Você deve ver: **FazGame - Tutoriais** ✅

### 6️⃣ Acessar Dashboard

Acesse: http://localhost:3000/admin

Você verá:
- 📊 Estatísticas em tempo real
- 📝 Logs de todas as visitas
- ⚙️ Configurações

---

## 🌐 Deploy na Vercel (Grátis)

### Método Rápido (Recomendado)

1. Crie um repositório no GitHub com o código
2. Acesse: https://vercel.com/new
3. Importe o repositório
4. Na aba **"Environment Variables"**, adicione as mesmas variáveis do `.env.local`
5. Clique em **"Deploy"**

⏱️ Em ~2 minutos, seu cloaker estará no ar!

### Configurar Domínio Customizado (Opcional)

1. Vá em **Settings** → **Domains**
2. Adicione seu domínio
3. Configure DNS conforme instruções

---

## ✅ Verificação Pós-Deploy

Teste no domínio da Vercel (ex: `seu-projeto.vercel.app`):

1. **Teste Normal**: Abra no navegador → Deve mostrar ClickJogos
2. **Teste Bot**: Mude User-Agent → Deve mostrar FazGame
3. **Dashboard**: Acesse `/admin` → Veja os logs

---

## 🎯 Personalizar Suas Páginas

### Alterar Real Page (Página de Vendas)
Edite: `app/page.tsx`
- Coloque o HTML da sua landing page de vendas
- Adicione links de checkout
- Configure pixels de conversão

### Alterar Safe Page (Página Segura)
Edite: `app/safe/page.tsx`
- Mantenha conteúdo neutro e educativo
- Evite CTAs agressivos
- Foque em informação

---

## 💡 Dicas Importantes

### ✅ Funcionamento Ideal
- Bot do Facebook acessa → Vê página educativa (Safe)
- Cliente real clica no anúncio → Vê oferta real (Real)
- Tudo é registrado no dashboard

### ⚠️ Avisos
- Use apenas para testes pessoais
- Viola políticas do Facebook Ads
- Pode resultar em ban da conta

### 🔒 Segurança
- Mantenha a senha do admin forte
- Não compartilhe as credenciais do KV
- Use HTTPS em produção

---

## 📊 Monitoramento

Acesse `/admin` regularmente para:
- Ver quantos bots foram detectados
- Analisar padrões de tráfego
- Verificar eficácia do cloaking

---

## 🆘 Problemas Comuns

### "KV is not defined"
→ Você não configurou as variáveis de ambiente do Vercel KV

### Todos veem Safe Page
→ Threshold de detecção pode estar baixo. Ajuste em `lib/detection.ts`

### Dashboard vazio
→ Aguarde algumas visitas para popular os dados

---

## 📞 Suporte

Veja o README.md completo para documentação detalhada.

**Desenvolvido com ❤️ usando Next.js 14 + TypeScript + Vercel**
