$env = "dev"
$resourceGroupName = "app-consento-$env"
$location = "West Europe"
$storageAccountName = "jfquestionid$env".ToLower()
$storageSku = "Standard_LRS"
$jotFormAPIKey = ""
$subscriptionId = ""
$faFolder = "jf-question-id"

# LOGIN CREDENTIALS

# INSERT CREDENTIALS HERE
$tenantId = ""
$applicationId = "";
$securePassword = "" | ConvertTo-SecureString -AsPlainText -Force
$credential = New-Object -TypeName System.Management.Automation.PSCredential -ArgumentList $applicationId, $securePassword
# 

# Login to Azure
Connect-AzAccount -ServicePrincipal -Credential $credential -TenantId $tenantId

# Set up Subscription
Write-Output "Setting up Subscription..."
az account set --subscription $subscriptionId
if (-not $?) {
	throw "Unable to set the subscriptionId"
}
else {
	Write-Host "Set Subscription to $subscriptionId"
}

# Register resource providers
Write-Host "Registering Resource providers..."
@('Microsoft.Web', 'Microsoft.Storage') | ForEach-Object {
    Register-AzResourceProvider -ProviderNamespace $_
}

# Create resource Gruop
Write-Output "Creating Azure Resource group..."
$resourceGroup = New-AzResourceGroup -Name $resourceGroupName -Location $location
If ($resourceGroup.ProvisioningState.ToLower() -eq "succeeded") {
    Write-Output $resourceGroup
} Else {
    Write-Output "Could not create Resource group"
    exit
}

# Create storage account
Write-Output "Creating Azure Storage Account..."
$storageAccount = New-AzStorageAccount -ResourceGroupName $resourceGroupName -AccountName $storageAccountName -Location $location -SkuName $storageSku
Write-Output $storageAccount

# Get storage account key for creating connection string
Write-Output "Getting Storage Account key..."
$accountKey = Get-AzStorageAccountKey -ResourceGroupName $resourceGroupName -AccountName $storageAccountName | Where-Object {$_.KeyName -eq 'Key1'} | Select-Object -ExpandProperty Value

# Form Connection string for storage account
Write-Output "Forming Connection String..."
$storageConnectionString = "DefaultEndpointsProtocol=https;AccountName=$storageAccountName;AccountKey=$accountKey;EndpointSuffix=core.windows.net"

# Create the Function App
Write-Output "Creating Function App..."
$functionAppName = "$faFolder-$env"
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
Write-Output $functionApp

# Create the App Insights Resource
Write-Output "Creating App Insights Resource..."
$newAppInsightsParams = @{
    ResourceType      = "Microsoft.Insights/components"
    ResourceName      = "app-insights-$functionAppName"
    Tag               = @{ applicationType = "web"; applicationName = "app-insights-$functionAppName"}
    Location          = $location
    ResourceGroupName = $resourceGroupName
    Properties        = @{"Application_Type"="web"}
    Force             = $true
}

$appInsights = New-AzResource @newAppInsightsParams
Write-Output $appInsights

# Set Function app settings and environment variables
Write-Output "Adding configurations and environment variables to Function App..."
$functionAppSettings = @{
    AzureWebJobDashboard                     = $storageConnectionString
    AzureWebJobsStorage                      = $storageConnectionString
    FUNCTIONS_EXTENSION_VERSION              = '~2'
    FUNCTIONS_WORKER_RUNTIME                 = 'node'
    WEBSITE_CONTENTAZUREFILECONNECTIONSTRING = $storageConnectionString
    WEBSITE_CONTENTSHARE                     = $storageAccountName
    WEBSITE_NODE_DEFAULT_VERSION             = "10.14.1"
    APPINSIGHTS_INSTRUMENTATIONKEY           = $appInsights.Properties.InstrumentationKey
    JOT_FORM_API_KEY                         = $jotFormAPIKey   
}
$setWebAppParams = @{
    Name = $functionAppName
    ResourceGroupName = $resourceGroupName
    AppSettings = $functionAppSettings
}
$webApp = Set-AzWebApp @setWebAppParams

# Packing and zipping APIs
Write-Output "Packing and Zipping function app APIs..."
cd function-apps
funcpack pack ./jf-question-id
npm run pack

# Deploy APIs in Azure
Write-Output "Deploying APIs in Function App..."
az functionapp deployment source config-zip  -g $resourceGroupName -n $functionAppName --src "dist/$faFolder.zip"
if (-not $?) {
	throw "FunctionApp deployement failed"
}
else {
	Write-Host "$apiName deployed to $resourceGroup successfully!"
}