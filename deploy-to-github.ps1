# DEPLOY COMPLETO PARA GITHUB
# Execute este script da pasta do projeto

# 1. Verificar se está na pasta certa
if (!(Test-Path "package.json")) {
    Write-Host "❌ ERRO: Execute este script de dentro da pasta CLOAKER!" -ForegroundColor Red
    exit 1
}

Write-Host "✅ Pasta correta detectada!" -ForegroundColor Green
Write-Host ""

# 2. Verificar arquivos importantes
$requiredFiles = @(
    "middleware.ts",
    "next.config.js",
    "package.json",
    "app/admin/domains",
    "lib/database-domains.ts",
    "lib/traffic-source.ts",
    "lib/utm.ts",
    "lib/tracking-script.ts"
)

Write-Host "🔍 Verificando arquivos SaaS..." -ForegroundColor Cyan
foreach ($file in $requiredFiles) {
    if (Test-Path $file) {
        Write-Host "  ✅ $file" -ForegroundColor Green
    } else {
        Write-Host "  ❌ $file FALTANDO!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "📦 Preparando arquivos para upload..." -ForegroundColor Cyan

# 3. Criar arquivo com lista de arquivos a incluir
$filesToInclude = @(
    "app/**/*",
    "lib/**/*",
    "database/**/*",
    "public/**/*",
    "middleware.ts",
    "next.config.js",
    "package.json",
    "package-lock.json",
    "tsconfig.json",
    "tailwind.config.ts",
    "postcss.config.js",
    ".gitignore",
    ".env.example",
    "vercel.json"
)

Write-Host ""
Write-Host "================================================" -ForegroundColor Yellow
Write-Host "  INSTRUÇÕES PARA UPLOAD NO GITHUB" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow
Write-Host ""
Write-Host "1️⃣  Vá em: https://github.com/alves8974/SORA" -ForegroundColor White
Write-Host ""
Write-Host "2️⃣  DELETE TUDO:" -ForegroundColor White
Write-Host "   - Marque checkbox (seleciona todos)" -ForegroundColor Gray
Write-Host "   - Clique 'Delete files'" -ForegroundColor Gray
Write-Host "   - Commit: 'Remove old version'" -ForegroundColor Gray
Write-Host ""
Write-Host "3️⃣  UPLOAD NOVO:" -ForegroundColor White
Write-Host "   - Clique 'Add file' → 'Upload files'" -ForegroundColor Gray
Write-Host "   - Arraste TODAS estas pastas/arquivos:" -ForegroundColor Gray
Write-Host ""
foreach ($file in $filesToInclude) {
    Write-Host "     📁 $file" -ForegroundColor Cyan
}
Write-Host ""
Write-Host "4️⃣  Commit: 'Complete SaaS implementation'" -ForegroundColor White
Write-Host ""
Write-Host "5️⃣  AGUARDE 3-4 minutos (Vercel build)" -ForegroundColor White
Write-Host ""
Write-Host "================================================" -ForegroundColor Yellow

# 4. Opcional: Usar Git CLI se disponível
if (Get-Command git -ErrorAction SilentlyContinue) {
    Write-Host ""
    Write-Host "✨ Git detectado! Quer fazer upload automático? (S/N)" -ForegroundColor Green
    $resposta = Read-Host
    
    if ($resposta -eq "S" -or $resposta -eq "s") {
        Write-Host ""
        Write-Host "🚀 Iniciando upload automático..." -ForegroundColor Cyan
        
        # Verificar se já tem remote
        $hasRemote = git remote -v 2>$null
        
        if (!$hasRemote) {
            Write-Host "Configurando remote..." -ForegroundColor Yellow
            git remote add origin https://github.com/alves8974/SORA.git
        }
        
        Write-Host "Adicionando arquivos..." -ForegroundColor Yellow
        git add .
        
        Write-Host "Criando commit..." -ForegroundColor Yellow
        git commit -m "Complete SaaS implementation with all features"
        
        Write-Host "Fazendo push..." -ForegroundColor Yellow
        git push -f origin main
        
        Write-Host ""
        Write-Host "✅ Upload concluído!" -ForegroundColor Green
        Write-Host "🔄 Vercel vai detectar mudanças em ~30 segundos" -ForegroundColor Cyan
        Write-Host "⏰ Build completo: 3-4 minutos" -ForegroundColor Cyan
    }
} else {
    Write-Host ""
    Write-Host "💡 DICA: Instale Git para uploads automáticos!" -ForegroundColor Yellow
    Write-Host "   Download: https://git-scm.com/download/win" -ForegroundColor Gray
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Yellow
Write-Host "  Após o deploy, acesse:" -ForegroundColor White
Write-Host "  https://sora-gules-gamma.vercel.app/admin" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Yellow
