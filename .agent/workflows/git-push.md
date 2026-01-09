---
description: Push changes to GitHub (commits and deploys to Vercel)
---

# Push Changes to GitHub

// turbo-all

1. Add Git to PATH:
```powershell
$env:PATH = "C:\Users\aliss\AppData\Local\GitHubDesktop\app-3.5.4\resources\app\git\cmd;$env:PATH"
```

2. Stage all changes:
```powershell
git add .
```

3. Commit with message:
```powershell
git commit -m "update: [description of changes]"
```

4. Push to remote (if configured):
```powershell
git push origin main
```

## Notes:
- Vercel auto-deploys on push to the main branch
- The Git is from GitHub Desktop installation
