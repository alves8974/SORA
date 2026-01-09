# Migração para Postgres - Guia de Implementação

## 🎯 Objetivo

Migrar logs de **Vercel KV (Redis)** para **Postgres** para resolver:
- ✅ Limite de 30k comandos/mês (atual limite real: 15k visitas)
- ✅ Custos que explodem em escala
- ✅ Melhor performance para queries analíticas

## 📦 Arquitetura Híbrida (Recomendada)

```
┌─────────────────────────────────────────┐
│           VERCEL KV (Redis)             │
│  ✅ Campaigns (hot data, low volume)    │
│  ✅ Domains (hot data, low volume)      │
│ ✅ Cache (domínio → campanha)          │
│  Custo: ~1k comandos/mês (grátis)      │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         VERCEL POSTGRES (SQL)           │
│  ✅ Visit Logs (append-only, alto vol)  │
│  ✅ Click Logs (médio volume)           │
│  ✅ Analytics (materialized views)      │
│  Custo: Grátis até 256MB (Hobby tier)  │
└─────────────────────────────────────────┘
```

## 🚀 Setup Vercel Postgres

### 1. Criar Database no Vercel Dashboard

```bash
# Via CLI (recomendado)
vercel postgres create cloaker-db

# Ou via Dashboard:
# 1. Acesse https://vercel.com/dashboard
# 2. Storage → Create Database
# 3. Selecione "Postgres"
# 4. Nome: "cloaker-db"
# 5. Região: Same as your app
# 6. Plan: Hobby (Free)
```

### 2. Conectar ao Projeto

```bash
# Link database ao projeto
vercel postgres connect cloaker-db

# Isso adiciona automaticamente:
# POSTGRES_URL
# POSTGRES_PRISMA_URL
# POSTGRES_URL_NON_POOLING
# ao .env.local
```

### 3. Configurar Variáveis de Ambiente

Adicione ao `.env.local`:

```bash
# Postgres (auto-gerado pelo Vercel)
POSTGRES_URL="postgres://..."
POSTGRES_PRISMA_URL="postgres://..."
POSTGRES_URL_NON_POOLING="postgres://..."

# Salt para hash de IPs (GDPR)
IP_HASH_SALT="your-random-salt-here-change-this"
```

### 4. Instalar Dependências

```bash
npm install
# Ou se preferir:
npm install @vercel/postgres --save
```

### 5. Executar Schema SQL

```bash
# Opção 1: Via Vercel CLI
vercel postgres exec database/schema.sql

# Opção 2: Via Dashboard
# 1. Vercel Dashboard → Storage → cloaker-db
# 2. Query tab
# 3. Cole o conteúdo de database/schema.sql
# 4. Execute
```

## 📝 Uso na Aplicação

### Exemplo: Logar Visita

```typescript
import { logVisitToPostgres } from '@/lib/database-postgres';

// No middleware ou API route
await logVisitToPostgres(
  campaignId,
  detectionResult,
  'safe', // ou 'real'
  {
    referer: req.headers.get('referer'),
    country: 'BR',
    anonymizeIP: true // GDPR compliance
  }
);
```

### Exemplo: Buscar Stats

```typescript
import { getCampaignStats } from '@/lib/database-postgres';

const stats = await getCampaignStats(campaignId);
// {
//   totalVisits: 1000,
//   botVisits: 200,
//   realVisits: 800,
//   cloakingRate: 20.0,
//   ...
// }
```

## 🔄 Migração de Dados Existentes (Opcional)

Se você já tem logs no Redis e quer migrar:

```typescript
// scripts/migrate-redis-to-postgres.ts
import { kv } from '@vercel/kv';
import { logVisitToPostgres } from '@/lib/database-postgres';

async function migrate() {
  // Buscar logs do Redis
  const keys = await kv.keys('visits:*');
  
  for (const key of keys) {
    const logs = await kv.lrange(key, 0, -1);
    
    for (const log of logs) {
      const parsed = JSON.parse(log);
      await logVisitToPostgres(
        parsed.campaignId,
        parsed.detection,
        parsed.page,
        { anonymizeIP: true }
      );
    }
  }
  
  console.log(`Migrated ${keys.length} campaign logs`);
}

migrate();
```

## 📊 Performance Tips

### 1. Materialized Views (Auto-Refresh)

```sql
-- Já está no schema.sql
-- Refresh a cada 5 minutos via cron
SELECT cron.schedule(
  'refresh-stats',
  '*/5 * * * *',
  'SELECT refresh_campaign_stats()'
);
```

### 2. Partitioning (Para >1M visitas)

```sql
-- Particionar por mês para melhor performance
CREATE TABLE visit_logs_2026_01 PARTITION OF visit_logs
FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

### 3. Cleanup Automático

```sql
-- Já está no schema.sql
-- Delete logs > 90 dias automaticamente
SELECT cron.schedule(
  'cleanup-old-logs',
  '0 3 * * *',
  'SELECT cleanup_old_logs()'
);
```

## 💰 Custo Estimado

| Visitas/Mês | Postgres Storage | Custo |
|-------------|------------------|-------|
| 50k | ~50MB | **R$ 0** (Hobby) |
| 100k | ~100MB | **R$ 0** (Hobby) |
| 500k | ~500MB | ~$20/mês (Pro) |
| 1M | ~1GB | ~$35/mês (Pro) |

**vs Redis:**
- 50k visitas = 100k comandos = **$25/mês** ❌

**Economia:** 100% até 100k visitas/mês

## ✅ Checklist de Migração

- [ ] Criar Postgres database no Vercel
- [ ] Adicionar env vars (.env.local)
- [ ] Instalar `@vercel/postgres`
- [ ] Executar `database/schema.sql` 
- [ ] Atualizar middleware para usar `database-postgres.ts`
- [ ] Testar logging local
- [ ] Deploy para produção
- [ ] Verificar logs no Vercel Dashboard
- [ ] (Opcional) Migrar dados existentes do Redis
- [ ] Configurar auto-refresh de stats (cron)

## 🐛 Troubleshooting

### Erro: "relation does not exist"
```bash
# Schema não foi executado
vercel postgres exec database/schema.sql
```

### Erro: "connection pool timeout"
```typescript
// Aumentar pool size (raro, apenas em alta escala)
const pool = createPool({
  connectionString: process.env.POSTGRES_URL,
  max: 20 // default: 10
});
```

### Performance lenta
```sql
-- Check indexes
SELECT * FROM pg_indexes WHERE tablename = 'visit_logs';

-- Refresh stats manualmente
SELECT refresh_campaign_stats();
```

## 📚 Próximos Passos

1. ✅ Setup Postgres (este guia)
2. Atualizar `middleware.ts` para usar Postgres
3. Atualizar dashboard para buscar de Postgres
4. Criar cron jobs para refresh/cleanup
5. Monitoring (Vercel Analytics)
