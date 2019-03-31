$resourceGroupName = "appConsento"
$location = "West Europe"
$storageAccountName = "$resourceGroupName".ToLower()
$storageSku = 'Standard_LRS'
$jotFormAPIKey = "951f4daf43eeeea54b1f980f0d0a7418"

$tenantId = "03a96ac9-6b14-46ef-9250-2b988e9ca025"
$applicationId = "82051a7b-841c-4747-912d-383ffcb3d3f8";
$securePassword = "N&~G'LV'Ug<K" | ConvertTo-SecureString -AsPlainText -Force
$credential = New-Object -TypeName System.Management.Automation.PSCredential -ArgumentList $applicationId, $securePassword
Connect-AzAccount -ServicePrincipal -Credential $credential -TenantId $tenantId


Register resource providers
@('Microsoft.Web', 'Microsoft.Storage') | ForEach-Object {
    Register-AzResourceProvider -ProviderNamespace $_
}

# Create resource Gruop: appConsento
Write-Output -Message "Creating Azure Resource group"
$resourceGroup = New-AzResourceGroup -Name $resourceGroupName -Location $location
If ($resourceGroup.ProvisioningState.ToLower() -eq "succeeded") {
    Write-Output $resourceGroup
} Else {
    Write-Output "Could not create Resource group"
    exit
}

# Create storage account
$storageAccount = New-AzStorageAccount -ResourceGroupName $resourceGroupName -AccountName $storageAccountName -Location $location -SkuName $storageSku
Write-Output $storageAccount

# Get storage account key and create connection string
$accountKey = Get-AzStorageAccountKey -ResourceGroupName $resourceGroupName -AccountName $storageAccountName | Where-Object {$_.KeyName -eq 'Key1'} | Select-Object -ExpandProperty Value

$storageConnectionString = "DefaultEndpointsProtocol=https;AccountName=$storageAccountName;AccountKey=$accountKey;EndpointSuffix=core.windows.net"

Write-Output $storageConnectionString

# Create the Function App
$functionAppName = 'jf-question-id'
$newFunctionAppParams = @{
    ResourceType      = 'Microsoft.Web/Sites'
    ResourceName      = $functionAppName
    Kind              = 'functionapp'
    Location          = $location
    ResourceGroupName = $resourceGroupName
    Properties        = @{}
    Force             = $true
}
$functionApp = New-AzResource @newFunctionAppParams


# Set Function app settings
$functionAppSettings = @{
    AzureWebJobDashboard                     = $storageConnectionString
    AzureWebJobsStorage                      = $storageConnectionString
    FUNCTIONS_EXTENSION_VERSION              = '~1'
    WEBSITE_CONTENTAZUREFILECONNECTIONSTRING = $storageConnectionString
    WEBSITE_CONTENTSHARE                     = $storageAccountName
    JOT_FORM_API_KEY                         = $jotFormAPIKey   
}

$setWebAppParams = @{
    Name = $functionAppName
    ResourceGroupName = $resourceGroupName
    AppSettings = $functionAppSettings
}

$webApp = Set-AzWebApp @setWebAppParams

# TODO: create new api inside the FA (GET) with params and deploy