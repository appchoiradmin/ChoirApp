# ChoirApp Azure Deployment Guide

This guide covers the complete deployment of ChoirApp to Microsoft Azure using a unified cloud architecture.

## Architecture Overview

**Unified Azure Deployment:**
- **Frontend**: Azure Static Web Apps (React + Vite)
- **Backend**: Azure App Service (.NET 8 Web API)
- **Database**: Aiven PostgreSQL (external, free tier)

## Benefits of Azure-First Approach

- ✅ **Single Provider**: Unified management and billing
- ✅ **No Cold Starts**: App Service keeps your API warm
- ✅ **Perfect .NET Integration**: Native ASP.NET Core support
- ✅ **Global CDN**: Built-in for Static Web Apps
- ✅ **Free Tier**: Complete MVP deployment at $0/month
- ✅ **Easy CI/CD**: GitHub Actions integration

## Prerequisites

1. **Azure Account**: Free account with $200 credit
2. **GitHub Repository**: Your ChoirAppV2 monorepo
3. **Aiven PostgreSQL**: Database connection string (already configured)

## Azure Resources Setup

### 1. Resource Group
```
Name: choirapp-rg
Region: East US
Purpose: Container for all ChoirApp resources
```

### 2. Azure Static Web App (Frontend)
```
Name: choirapp-frontend
Resource Group: choirapp-rg
Plan: Free
Source: GitHub
Repository: ChoirAppV2
Branch: main
Build Preset: React
App Location: /packages/frontend
Output Location: dist
```

**Generated URL**: `https://choirapp-frontend.azurestaticapps.net`

### 3. App Service Plan
```
Name: choirapp-plan
Resource Group: choirapp-rg
OS: Windows
Region: East US
Pricing Tier: F1 (Free) - 60 CPU minutes/day
```

### 4. App Service (Backend)
```
Name: choirapp-backend
Resource Group: choirapp-rg
Runtime: .NET 8 (LTS)
OS: Windows
Region: East US
App Service Plan: choirapp-plan
```

**Generated URL**: `https://choirapp-backend.azurewebsites.net`

## Deployment Configuration

### Backend Configuration Files

1. **web.config** - IIS configuration for Azure App Service
2. **appsettings.json** - Updated with Azure Static Web App CORS origins
3. **GitHub Actions** - Automated deployment workflow

### Environment Variables (Azure App Service)

Set these in Azure Portal → App Service → Configuration → Application Settings:

```
ASPNETCORE_ENVIRONMENT = Production
Authentication__Google__ClientId = [Your Google OAuth Client ID]
Authentication__Google__ClientSecret = [Your Google OAuth Client Secret]
Jwt__Issuer = https://choirapp-backend.azurewebsites.net
Jwt__Audience = https://choirapp-frontend.azurestaticapps.net
Jwt__Key = [Your JWT Secret Key - 32+ characters]
ConnectionStrings__DefaultConnection = [Your Aiven PostgreSQL connection string]
```

### CORS Configuration

The backend is configured to allow requests from:
- `https://choirapp-frontend.azurestaticapps.net` (production)
- `http://localhost:5173` (Vite dev server)
- `http://localhost:3000` (alternative dev server)

## Deployment Process

### Automatic Deployment (Recommended)

1. **Push to GitHub**: Any push to `main` branch triggers deployment
2. **Static Web App**: Automatically deploys frontend
3. **App Service**: Uses GitHub Actions to deploy backend

### Manual Deployment

#### Frontend (Static Web App)
```bash
# Build locally
cd packages/frontend
npm run build

# Deploy via Azure CLI
az staticwebapp deploy --name choirapp-frontend --source-location ./dist
```

#### Backend (App Service)
```bash
# Publish locally
cd packages/backend/src/ChoirApp.Backend
dotnet publish -c Release -o ./publish

# Deploy via Azure CLI
az webapp deploy --name choirapp-backend --src-path ./publish.zip
```

## Database Migration

Run Entity Framework migrations against Aiven PostgreSQL:

```bash
cd packages/backend/src/ChoirApp.Backend
dotnet ef database update --connection "$env:DATABASE_CONNECTION_STRING"
```

## Monitoring and Logging

### Application Insights (Free Tier)
- **1GB data/month** included
- **Performance monitoring**
- **Error tracking**
- **Custom telemetry**

### Log Stream
Access real-time logs in Azure Portal:
- App Service → Monitoring → Log stream

## Cost Breakdown (Free Tier)

| Service | Free Tier Limits | Cost |
|---------|------------------|------|
| Static Web Apps | 100GB bandwidth/month | $0 |
| App Service (F1) | 60 CPU minutes/day | $0 |
| Application Insights | 1GB data/month | $0 |
| Aiven PostgreSQL | 1GB storage + backups | $0 |
| **Total** | **Perfect for MVP** | **$0/month** |

## Scaling Options

### When to Upgrade
- **Static Web Apps**: Upgrade for custom domains, staging slots
- **App Service**: Upgrade to B1 ($13/month) for always-on, custom domains
- **Database**: Upgrade Aiven for more storage/connections

### Upgrade Path
1. **Basic Tier** (~$15/month): Custom domains, SSL, always-on
2. **Standard Tier** (~$50/month): Auto-scaling, staging slots
3. **Premium Tier** (~$150/month): Advanced security, VNet integration

## Security Best Practices

1. **Secrets Management**: Use Azure Key Vault for production secrets
2. **Authentication**: Google OAuth + JWT tokens
3. **HTTPS Only**: Enforced on both frontend and backend
4. **CORS**: Restricted to known origins
5. **Database**: SSL required for Aiven PostgreSQL

## Troubleshooting

### Common Issues

1. **CORS Errors**: Check appsettings.json CorsOrigins configuration
2. **Database Connection**: Verify connection string and SSL requirements
3. **Build Failures**: Check Node.js/npm versions in GitHub Actions
4. **Authentication**: Verify Google OAuth redirect URIs

### Useful Commands

```bash
# Check app status
az webapp show --name choirapp-backend --resource-group choirapp-rg

# View logs
az webapp log tail --name choirapp-backend --resource-group choirapp-rg

# Restart app
az webapp restart --name choirapp-backend --resource-group choirapp-rg
```

## Next Steps

1. **Complete Azure resource creation** (if not done)
2. **Configure GitHub Actions secrets** for automated deployment
3. **Set up Application Insights** for monitoring
4. **Run database migrations** to create initial schema
5. **Test end-to-end functionality**
6. **Set up custom domain** (optional)

## Support

- **Azure Documentation**: https://docs.microsoft.com/azure/
- **Static Web Apps**: https://docs.microsoft.com/azure/static-web-apps/
- **App Service**: https://docs.microsoft.com/azure/app-service/
