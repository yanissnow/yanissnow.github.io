#Requires -Version 5.1
<#
.SYNOPSIS
Creates read-only Active Directory reports for the SnowCorp lab.

.DESCRIPTION
Reads users below SnowCorp/Employees, direct members of the three
department groups, and the default domain password/lockout policy.
Writes three CSV files and a run summary to a new results folder.
The script does not change Active Directory objects or policies.

Run inside DC01 using Windows PowerShell with the ActiveDirectory module.
The usual lab account is SNOWCORP\Administrator.

.PARAMETER Server
The SnowCorp domain controller used for every directory query.

.PARAMETER OutputRoot
Parent folder for the reports. Defaults to C:\SnowCorp-Scripts\Results.

.EXAMPLE
.\01-SnowCorp-AD-Report.ps1

.NOTES
Project: SnowCorp IT Support and Security Lab
Version: 1.1
Directory access: Read-only
Files written: New report files in a separate folder for each run
#>

[CmdletBinding()]
param(
    [ValidateNotNullOrEmpty()]
    [string]$Server = 'DC01.snowcorp.test',

    [ValidateNotNullOrEmpty()]
    [string]$OutputRoot = 'C:\SnowCorp-Scripts\Results'
)

$ErrorActionPreference = 'Stop'
$expectedDomain = 'snowcorp.test'
$employeeOU = 'OU=Employees,OU=SnowCorp,DC=snowcorp,DC=test'
$groupNames = @('GG_IT', 'GG_HR', 'GG_Sales')

try {
    # 1. Load the directory tools and confirm the intended lab domain.
    Import-Module ActiveDirectory -ErrorAction Stop
    $domain = Get-ADDomain -Identity $expectedDomain -Server $Server
    if ($domain.DNSRoot -ne $expectedDomain) {
        throw "The selected server did not return the SnowCorp domain."
    }
    $null = Get-ADOrganizationalUnit -Identity $employeeOU -Server $Server

    # 2. Collect account status from the Employees OU and its sub-OUs.
    $users = @(
        Get-ADUser -Filter * -SearchBase $employeeOU -SearchScope Subtree -Server $Server -Properties LockedOut, PasswordNeverExpires, PasswordLastSet |
            Sort-Object SamAccountName
    )
    if ($users.Count -eq 0) {
        throw "No employee or test accounts were returned. Check the Employees OU."
    }

    $userReport = @(
        foreach ($user in $users) {
            $passwordLastSetUtc = ''
            if ($null -ne $user.PasswordLastSet) {
                $passwordLastSetUtc = $user.PasswordLastSet.ToUniversalTime().ToString('o')
            }
            [pscustomobject]@{
                Name                 = $user.Name
                Username             = $user.SamAccountName
                Enabled              = $user.Enabled
                LockedOut            = $user.LockedOut
                PasswordNeverExpires = $user.PasswordNeverExpires
                PasswordLastSetUtc   = $passwordLastSetUtc
                DistinguishedName    = $user.DistinguishedName
            }
        }
    )

    # 3. Collect each department group's scope, category, and direct members.
    $groupReport = @(
        foreach ($groupName in $groupNames) {
            $group = Get-ADGroup -Identity $groupName -Server $Server
            $members = @(
                Get-ADGroupMember -Identity $group.DistinguishedName -Server $Server |
                    Sort-Object Name
            )
            $memberLabels = @(
                foreach ($member in $members) {
                    '{0} [{1}]' -f $member.Name, $member.ObjectClass
                }
            )
            [pscustomobject]@{
                Group         = $group.SamAccountName
                Scope         = [string]$group.GroupScope
                Category      = [string]$group.GroupCategory
                MemberCount   = $members.Count
                DirectMembers = $memberLabels -join '; '
            }
        }
    )

    # 4. Collect configured domain policy values, not actual passwords.
    $policy = Get-ADDefaultDomainPasswordPolicy -Identity $expectedDomain -Server $Server
    $policyReport = [pscustomobject]@{
        Domain                     = $domain.DNSRoot
        MinimumPasswordLength      = $policy.MinPasswordLength
        ComplexityEnabled          = $policy.ComplexityEnabled
        PasswordHistoryCount       = $policy.PasswordHistoryCount
        MaximumPasswordAgeDays     = $policy.MaxPasswordAge.TotalDays
        MinimumPasswordAgeDays     = $policy.MinPasswordAge.TotalDays
        ReversibleEncryption       = $policy.ReversibleEncryptionEnabled
        LockoutThreshold           = $policy.LockoutThreshold
        LockoutDurationMinutes     = $policy.LockoutDuration.TotalMinutes
        ResetLockoutCounterMinutes = $policy.LockoutObservationWindow.TotalMinutes
    }

    # 5. Save a new run without replacing earlier report files.
    $runStamp = Get-Date -Format 'yyyyMMdd-HHmmss-fff'
    $runSuffix = [guid]::NewGuid().ToString('N').Substring(0, 6)
    $runFolder = Join-Path -Path $OutputRoot -ChildPath ("Run-{0}-{1}" -f $runStamp, $runSuffix)
    $null = New-Item -ItemType Directory -Path $OutputRoot -Force
    $null = New-Item -ItemType Directory -Path $runFolder

    $userFile = Join-Path -Path $runFolder -ChildPath '01-Users.csv'
    $groupFile = Join-Path -Path $runFolder -ChildPath '02-Department-Groups.csv'
    $policyFile = Join-Path -Path $runFolder -ChildPath '03-Password-Lockout-Policy.csv'
    $summaryFile = Join-Path -Path $runFolder -ChildPath '00-Run-Summary.txt'

    $userReport | Export-Csv -LiteralPath $userFile -NoTypeInformation -Encoding UTF8
    $groupReport | Export-Csv -LiteralPath $groupFile -NoTypeInformation -Encoding UTF8
    $policyReport | Export-Csv -LiteralPath $policyFile -NoTypeInformation -Encoding UTF8

    $enabledCount = @($users | Where-Object { $_.Enabled }).Count
    $disabledCount = @($users | Where-Object { -not $_.Enabled }).Count
    $lockedCount = @($users | Where-Object { $_.LockedOut }).Count
    $generatedUtc = (Get-Date).ToUniversalTime().ToString('o')
    $runAs = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    $summary = @(
        'SNOWCORP ACTIVE DIRECTORY REPORT'
        'Script version: 1.1'
        "Generated UTC: $generatedUtc"
        "Executed on: $env:COMPUTERNAME"
        "Executed as: $runAs"
        "Queried server: $Server"
        "Domain: $($domain.DNSRoot)"
        "User search base: $employeeOU"
        "Users collected: $($users.Count)"
        "Enabled users: $enabledCount"
        "Disabled users: $disabledCount"
        "Locked-out users: $lockedCount"
        "Department groups collected: $($groupReport.Count)"
        'Group membership: Direct members only'
        'Policy scope: Default domain password and lockout policy'
        "Results folder: $runFolder"
        'Report collection completed successfully.'
        'Compare the CSV values with the documented SnowCorp configuration.'
    )
    $summary | Set-Content -LiteralPath $summaryFile -Encoding UTF8

    # 6. Display the collected data for review and screenshot evidence.
    Write-Host ''
    Write-Host 'SNOWCORP AD REPORT - COLLECTION COMPLETED' -ForegroundColor Green
    Write-Host ("Computer: {0} | Domain: {1}" -f $env:COMPUTERNAME, $domain.DNSRoot)
    Write-Host ("Users: {0} | Enabled: {1} | Disabled: {2} | Locked out: {3}" -f $users.Count, $enabledCount, $disabledCount, $lockedCount)
    Write-Host ''
    $userReport | Format-Table Name, Username, Enabled, LockedOut -AutoSize | Out-Host
    $groupReport | Format-Table Group, Scope, Category, MemberCount, DirectMembers -AutoSize -Wrap | Out-Host
    $policyReport | Format-List | Out-Host
    Write-Host ("REPORT FOLDER: {0}" -f $runFolder) -ForegroundColor Cyan
    Write-Host 'Saved: 3 CSV reports and 00-Run-Summary.txt'
}
catch {
    Write-Error -Message ("Report creation stopped: {0}" -f $_.Exception.Message) -ErrorAction Continue
    exit 1
}

