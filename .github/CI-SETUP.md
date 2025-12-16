# CI/CD Setup Guide

## Current CI Status

The CI pipeline automatically runs on every push and pull request:

✅ **Always runs:**
- TypeScript type checking (`npm run typecheck`)
- Unit tests (`npm test`)
- Code coverage reporting (Codecov)
- Security audits (weekly + on PRs)

⚙️ **Optional (requires setup):**
- EAS Build preview (only if `EXPO_TOKEN` is configured)

## Setting Up Automated Builds (Optional)

If you want GitHub Actions to automatically build your app on every push to `main`, follow these steps:

### 1. Create an Expo Access Token

1. Go to [https://expo.dev](https://expo.dev) and log in
2. Navigate to **Account Settings** → **Access Tokens**
3. Click **Create Token**
4. Give it a name (e.g., "GitHub Actions CI")
5. Copy the generated token (you won't be able to see it again!)

### 2. Add Token to GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `EXPO_TOKEN`
5. Value: Paste your Expo access token
6. Click **Add secret**

### 3. Verify Setup

Once the secret is added, push a commit to `main`:

```bash
git push origin main
```

The EAS Build job will now run automatically and create preview builds for iOS and Android.

## CI Workflow Behavior

### Without EXPO_TOKEN
- Tests and type checking run normally ✅
- Build job is **skipped** (no error) ⏭️
- Your CI passes successfully ✅

### With EXPO_TOKEN
- Tests and type checking run normally ✅
- Build job creates preview builds 📱
- Builds are available in your Expo dashboard

## Troubleshooting

### "Failed to restore: Cache service responded with 400"
This is a temporary GitHub cache service issue. It doesn't affect your builds - just ignore these warnings.

### "An Expo user account is required to proceed"
You need to set up the `EXPO_TOKEN` secret (see steps above) or the build job will fail.

### Build job not running at all
This is normal if you haven't configured `EXPO_TOKEN` - the job is skipped automatically.

## Cost Considerations

- **Free Tier:** Expo EAS provides limited free builds per month
- **Paid Plans:** For production use, consider an Expo EAS subscription
- **Alternative:** Build manually on your local machine using `eas build`

See [DEPLOYMENT.md](../DEPLOYMENT.md) for more details on building and deploying to production.
