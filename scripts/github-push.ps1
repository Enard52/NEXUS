# NEXUS - sync with GitHub: pull new commits, then commit all local changes and push (origin/main).
# Local main and remote main end up identical. Output: scripts\github-push.log
$ErrorActionPreference = 'Continue'
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root
$log = Join-Path $PSScriptRoot 'github-push.log'
Start-Transcript -Path $log -Force | Out-Null
"=== NEXUS GitHub push $(Get-Date -Format s)"

# 1) Release workflow goes to .github\workflows
if (Test-Path 'desktop\github-workflow\desktop-release.yml') {
  New-Item -ItemType Directory -Force '.github\workflows' | Out-Null
  Move-Item -Force 'desktop\github-workflow\desktop-release.yml' '.github\workflows\desktop-release.yml'
  Remove-Item 'desktop\github-workflow' -Recurse -Force -ErrorAction SilentlyContinue
  "workflow moved to .github\workflows"
}

# 2) Make sure we are on main and up to date with the remote
git checkout main
git fetch origin
$behind = (git rev-list --count HEAD..origin/main)
if ([int]$behind -gt 0) {
  "origin/main has $behind new commit(s) - updating local main first"
  git pull --ff-only origin main
  if ($LASTEXITCODE -ne 0) { "ERROR: local main could not be fast-forwarded (diverged). Nothing was committed."; Stop-Transcript | Out-Null; exit 1 }
}

# 3) Stage everything and run safety checks
if (-not (git config user.name)) { git config user.name 'Ensar' }
if (-not (git config user.email)) { git config user.email 'ensarharmanci52@gmail.com' }
git add -A
$staged = @(git diff --cached --name-only)
"files to commit: $($staged.Count)"
$bad = @($staged | Where-Object { $_ -match '(^|/)node_modules/|^desktop/(dist|app)/|(^|/)\.env(\.|$)|cloud-config\.js$' })
if ($bad.Count -gt 0) { "ERROR: unwanted files staged, nothing committed:"; $bad | Select-Object -First 30; git reset -q; Stop-Transcript | Out-Null; exit 1 }
$big = @($staged | Where-Object { (Test-Path -LiteralPath $_) -and ((Get-Item -LiteralPath $_).Length -gt 50MB) })
if ($big.Count -gt 0) { "ERROR: files over 50 MB, nothing committed:"; $big; git reset -q; Stop-Transcript | Out-Null; exit 1 }
if ($staged.Count -eq 0) { "nothing to commit" } else {
  $msg = "NEXUS update $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
  git commit -q -m $msg -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>"
}

# 4) Push
git push origin main
"--- result"
git status -sb | Select-Object -First 3
git --no-pager log --oneline -3
"local : $(git rev-parse HEAD)"
"remote: $(git rev-parse origin/main)"
Stop-Transcript | Out-Null
