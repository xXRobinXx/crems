[CmdletBinding(SupportsShouldProcess = $true, ConfirmImpact = 'High')]
param(
    [Parameter(Mandatory = $true)]
    [ValidatePattern('^\d+\.\d+\.\d+$')]
    [string] $Version,

    [switch] $InstallPi,

    [switch] $ResumePublishedRelease,

    [string] $HomeAssistantUrl = $env:CREMS_HA_URL,

    [ValidateRange(1, 120)]
    [int] $WorkflowTimeoutMinutes = 45
)

$ErrorActionPreference = 'Stop'
$repository = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$tag = "v$Version"
$haSlug = '350f0e24_crems_energy'
$haToken = $null

function Invoke-Checked([string] $Command, [string[]] $Arguments) {
    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "Opdracht mislukt ($LASTEXITCODE): $Command $($Arguments -join ' ')"
    }
}

function Invoke-Supervisor([string] $Method, [string] $Path, [object] $Body = $null) {
    $request = @{
        Method      = $Method
        Uri         = "$($script:haBase)/api/hassio/$Path"
        Headers     = @{ Authorization = "Bearer $script:haToken" }
        TimeoutSec  = 60
        ErrorAction = 'Stop'
    }
    if ($null -ne $Body) {
        $request.ContentType = 'application/json'
        $request.Body = $Body | ConvertTo-Json -Depth 8 -Compress
    }
    Invoke-RestMethod @request
}

function Wait-Workflow([string] $Commit, [string] $TagName, [int] $TimeoutMinutes) {
    $api = "https://api.github.com/repos/xXRobinXx/crems/actions/runs?head_sha=$Commit&per_page=50"
    $headers = @{ 'User-Agent' = 'CREMS-release-script'; Accept = 'application/vnd.github+json' }
    $deadline = [DateTimeOffset]::UtcNow.AddMinutes($TimeoutMinutes)
    $workflow = $null
    while ([DateTimeOffset]::UtcNow -lt $deadline) {
        $result = Invoke-RestMethod -Method Get -Uri $api -Headers $headers -TimeoutSec 30
        $workflow = $result.workflow_runs |
            Where-Object { $_.name -eq 'Publish Home Assistant image' -and $_.head_sha -eq $Commit -and $_.event -eq 'push' -and $_.head_branch -eq $TagName } |
            Sort-Object created_at -Descending |
            Select-Object -First 1
        if ($workflow -and $workflow.status -eq 'completed') {
            if ($workflow.conclusion -ne 'success') {
                throw "GitHub imageworkflow eindigde met '$($workflow.conclusion)': $($workflow.html_url)"
            }
            return $workflow
        }
        Start-Sleep -Seconds 10
    }
    $url = if ($workflow) { $workflow.html_url } else { 'https://github.com/xXRobinXx/crems/actions' }
    throw "Timeout tijdens ARM64-publicatie. Controleer de workflow: $url"
}

function Confirm-Arm64Image([string] $ImageVersion) {
    $tokenResponse = Invoke-RestMethod -Method Get -Uri 'https://ghcr.io/token?scope=repository%3Axxrobinxx%2Fcrems-energy%3Apull' -Headers @{ 'User-Agent' = 'CREMS-release-script' } -TimeoutSec 30
    if (-not $tokenResponse.token) { throw 'Kon geen tijdelijke anonieme leestoken voor de publieke image verkrijgen.' }
    $manifestUri = "https://ghcr.io/v2/xxrobinxx/crems-energy/manifests/$ImageVersion"
    $manifestHeaders = @{
        Authorization = "Bearer $($tokenResponse.token)"
        Accept = 'application/vnd.oci.image.index.v1+json, application/vnd.docker.distribution.manifest.list.v2+json'
    }
    $response = Invoke-WebRequest -Method Get -Uri $manifestUri -Headers $manifestHeaders -TimeoutSec 30
    $manifestJson = if ($response.Content -is [byte[]]) { [Text.Encoding]::UTF8.GetString($response.Content) } else { [string]$response.Content }
    $manifest = $manifestJson | ConvertFrom-Json
    if (-not $manifest.manifests) { throw "Image $ImageVersion is geen multi-architecture manifestlijst." }
    if (-not ($manifest.manifests | Where-Object { $_.platform.os -eq 'linux' -and $_.platform.architecture -eq 'arm64' })) {
        throw "Image $ImageVersion bevat geen linux/arm64-manifest."
    }
    if (-not $response.Headers['Docker-Content-Digest']) { throw "Registry bevestigde geen digest voor image $ImageVersion." }
    return $response.Headers['Docker-Content-Digest']
}

Push-Location $repository
try {
    if ((git branch --show-current) -ne 'main') { throw 'Release moet vanaf branch main worden gestart.' }
    $dirty = git status --porcelain --untracked-files=no
    if ($dirty) { throw 'Commit eerst alle bijgehouden wijzigingen; release is gestopt vóór push.' }
    $untrackedReleaseInputs = git ls-files --others --exclude-standard
    $untrackedReleaseInputs = $untrackedReleaseInputs | Where-Object { $_ -ne 'apps/web/test-price-run.txt' }
    if ($untrackedReleaseInputs) { throw "Commit alle nieuwe release-input voordat je publiceert: $($untrackedReleaseInputs -join ', ')" }

    $rootVersion = (Select-String -Path 'crems/config.yaml' -Pattern '^version: "([0-9.]+)"$').Matches.Groups[1].Value
    $addonVersion = (Select-String -Path 'apps/home-assistant-addon/crems/config.yaml' -Pattern '^version: "([0-9.]+)"$').Matches.Groups[1].Value
    if ($rootVersion -ne $Version -or $addonVersion -ne $Version) {
        throw "Versie $Version moet overeenkomen met beide addonmanifesten (root=$rootVersion, app=$addonVersion)."
    }

    if ($InstallPi) {
        if (-not $HomeAssistantUrl) { throw 'Geef -HomeAssistantUrl of stel CREMS_HA_URL in.' }
        $parsedHaUrl = [Uri]$HomeAssistantUrl
        if ($parsedHaUrl.Scheme -notin @('http', 'https') -or $parsedHaUrl.UserInfo) { throw 'Home Assistant-URL moet http(s) zijn en mag geen gebruikersgegevens bevatten.' }
        $script:haBase = $parsedHaUrl.AbsoluteUri.TrimEnd('/')
    }

    $localTag = git tag --list $tag
    $localTagCommit = if ($localTag) { (git rev-parse "$tag^{commit}").Trim() } else { $null }
    $remoteTag = git ls-remote --tags origin "refs/tags/$tag*"
    if ($LASTEXITCODE -eq 0 -and $remoteTag -and -not $ResumePublishedRelease) { throw "Tag $tag bestaat al; tags worden nooit overschreven. Gebruik -ResumePublishedRelease om exact deze onafgeronde release te hervatten." }
    if ($LASTEXITCODE -notin @(0, 2)) { throw 'Kon bestaande releasetag op origin niet controleren.' }
    $tagCommit = $null
    if ($ResumePublishedRelease) {
        $remoteCommitLine = $remoteTag | Where-Object { $_ -match "refs/tags/$([regex]::Escape($tag))\^\{\}$" } | Select-Object -First 1
        $remoteTagCommit = if ($remoteCommitLine) { ($remoteCommitLine -split '\s+')[0] } else { $null }
        if (-not $localTagCommit -or -not $remoteTagCommit -or $remoteTagCommit -ne $localTagCommit) {
            throw "Resume vereist een onveranderde lokale en remote tag $tag."
        }
        & git merge-base --is-ancestor $localTagCommit HEAD
        if ($LASTEXITCODE -ne 0) { throw "Tag $tag is geen voorouder van HEAD; release kan niet veilig worden hervat." }
        & git diff --quiet $localTagCommit HEAD -- . ':(exclude)tools/release-crems.ps1' ':(exclude)docs/**' ':(exclude)TASKS.md' ':(exclude)REVIEW.md' ':(exclude)PRODUCT_AUDIT.md'
        if ($LASTEXITCODE -ne 0) { throw "Build-, dependency-, workflow- of andere input is gewijzigd na tag $tag; hervatten is geweigerd." }
        $tagCommit = $localTagCommit
    }

    Invoke-Checked 'pnpm' @('harness', 'check')
    Invoke-Checked 'pnpm' @('harness', 'gate')

    $commit = (git rev-parse HEAD).Trim()
    $target = if ($InstallPi) { "GitHub v$Version en CREMS op $HomeAssistantUrl" } else { "GitHub ARM64-release v$Version" }
    if (-not $PSCmdlet.ShouldProcess($target, 'Maak release-tag, publiceer image en voltooi gevraagde uitrol')) {
        Write-Host "Controle geslaagd; WhatIf actief. Er is niets gepubliceerd. Commit: $commit"
        return
    }

    if (-not $ResumePublishedRelease) {
        Invoke-Checked 'git' @('tag', '-a', $tag, '-m', "Release $tag")
        try {
            Invoke-Checked 'git' @('push', 'origin', "refs/tags/$tag")
        }
        catch {
            git tag -d $tag | Out-Null
            throw
        }
        $tagCommit = $commit
    }

    $run = Wait-Workflow -Commit $tagCommit -TagName $tag -TimeoutMinutes $WorkflowTimeoutMinutes
    $imageDigest = Confirm-Arm64Image -ImageVersion $Version
    Invoke-Checked 'git' @('push', 'origin', 'main')
    Write-Host "ARM64-image gepubliceerd: $($run.html_url); OCI digest $imageDigest"

    if ($InstallPi) {
        $haToken = $env:CREMS_HA_TOKEN
        if (-not $haToken) {
            $secureToken = Read-Host 'Home Assistant long-lived token (wordt niet opgeslagen of afgedrukt)' -AsSecureString
            $pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken)
            try { $haToken = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) }
            finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer) }
        }
        if (-not $haToken) { throw "Release is gepubliceerd; start opnieuw met -ResumePublishedRelease om de Pi-update af te ronden." }
        $script:haToken = $haToken
        $null = Invoke-Supervisor -Method Post -Path 'store/reload' -Body @{}
        $infoResponse = Invoke-Supervisor -Method Get -Path "store/addons/$haSlug"
        $info = $infoResponse.data
        if (-not $info -or $info.version_latest -ne $Version) {
            throw "Home Assistant toont versie '$($info.version_latest)' in de appcatalogus; verwacht $Version. De image is wel gepubliceerd."
        }
        if ($info.version -eq $Version -and $info.state -eq 'started') {
            Write-Host "CREMS Energie $Version draait al op de Pi."
            return
        }
        $updateResponse = Invoke-Supervisor -Method Post -Path "store/addons/$haSlug/update" -Body @{ backup = $true; background = $false }
        if ($updateResponse.result -ne 'ok') { throw 'Home Assistant heeft de add-onupdate niet bevestigd; controleer Back-ups en de add-onstatus.' }
        $verifiedResponse = Invoke-Supervisor -Method Get -Path "store/addons/$haSlug"
        $verified = $verifiedResponse.data
        if ($verified.version -ne $Version -or $verified.state -ne 'started') {
            throw "Versiecontrole mislukt: Home Assistant rapporteert '$($verified.version)' met status '$($verified.state)'."
        }
        Write-Host "CREMS Energie $Version draait op de Pi; Home Assistant maakte de appbackup tijdens de update. De HA-host is niet herstart."
    }
    else {
        Write-Host 'Image en addonmanifest zijn gepubliceerd. Installatie op de Pi is niet gevraagd; gebruik Home Assistant om de app-update uit te voeren.'
    }
}
finally {
    $haToken = $null
    $script:haToken = $null
    Pop-Location
}
