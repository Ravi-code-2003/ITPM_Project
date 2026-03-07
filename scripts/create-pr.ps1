param(
  [string]$Base = "Lasal",
  [string]$Remote = "origin",
  [switch]$Fill = $true
)

$ErrorActionPreference = "Stop"

function Require-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Required command not found: $Name"
  }
}

Require-Command git

$ghCommand = Get-Command gh -ErrorAction SilentlyContinue
if ($ghCommand) {
  $ghExe = $ghCommand.Source
} else {
  $fallbackGh = Join-Path $env:LOCALAPPDATA "Programs\\GitHubCLI\\bin\\gh.exe"
  if (Test-Path $fallbackGh) {
    $ghExe = $fallbackGh
  } else {
    throw "Required command not found: gh"
  }
}

function Invoke-Gh {
  param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Args)
  & $ghExe @Args
}

$repoRoot = git rev-parse --show-toplevel
if (-not $repoRoot) {
  throw "Not inside a git repository."
}

Set-Location $repoRoot

$currentBranch = (git rev-parse --abbrev-ref HEAD).Trim()
if (-not $currentBranch -or $currentBranch -eq "HEAD") {
  throw "You are in a detached HEAD state. Check out a branch first."
}

if ($currentBranch -eq $Base) {
  throw "Current branch is '$Base'. Switch to a feature branch to create a PR."
}

git fetch $Remote $Base $currentBranch | Out-Null

$counts = (git rev-list --left-right --count "$Remote/$Base...$currentBranch").Trim()
$parts = $counts -split "\s+"
if ($parts.Length -lt 2) {
  throw "Unable to determine branch divergence."
}

[int]$ahead = $parts[1]
if ($ahead -le 0) {
  Write-Output "No commits to PR from '$currentBranch' into '$Base'."
  exit 0
}

$upstream = ""
try {
  $upstream = (git rev-parse --abbrev-ref --symbolic-full-name "@{u}" 2>$null).Trim()
} catch {
  $upstream = ""
}

if (-not $upstream) {
  git push -u $Remote $currentBranch
} else {
  git push
}

$existing = ""
try {
  $existing = (Invoke-Gh pr list --base $Base --head "$currentBranch" --state open --json url --jq ".[0].url" 2>$null).Trim()
} catch {
  $existing = ""
}

if ($existing) {
  Write-Output "Open PR already exists: $existing"
  exit 0
}

$createArgs = @("pr", "create", "--base", $Base, "--head", $currentBranch)
if ($Fill) {
  $createArgs += "--fill"
}

$prUrl = (Invoke-Gh @createArgs).Trim()
if (-not $prUrl) {
  throw "PR creation command did not return a URL."
}

Write-Output "Created PR: $prUrl"
