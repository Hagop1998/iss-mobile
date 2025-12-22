# GitLab CI/CD Pipeline Setup Guide

## Overview
This guide will help you set up a CI/CD pipeline for your React Native/Expo app on GitLab.

## Pipeline Files

### Option 1: Simple Pipeline (`.gitlab-ci-simple.yml`)
- Basic setup with EAS Build
- Manual builds for Android and iOS
- Good for starting out

### Option 2: Full Pipeline (`.gitlab-ci.yml`)
- Complete setup with native builds
- Linting and testing stages
- Multiple build options
- Production deployment ready

## Setup Steps

### 1. Choose Your Pipeline

**For Simple Setup (Recommended for beginners):**
```bash
cp .gitlab-ci-simple.yml .gitlab-ci.yml
```

**For Full Setup:**
The `.gitlab-ci.yml` file is already created with full features.

### 2. Configure Environment Variables in GitLab

Go to your GitLab project → **Settings → CI/CD → Variables** and add:

**Required for EAS Build:**
- `EXPO_TOKEN` - Your Expo access token
  - Get it from: https://expo.dev/accounts/[your-account]/settings/access-tokens
  - Scope: `build:read`, `build:write`

**Optional:**
- `EXPO_APPLE_ID` - For iOS builds
- `EXPO_APPLE_APP_SPECIFIC_PASSWORD` - For iOS builds
- `EXPO_GOOGLE_SERVICE_ACCOUNT_KEY` - For Android builds

### 3. Push to GitLab

```bash
git add .gitlab-ci.yml
git commit -m "Add GitLab CI/CD pipeline"
git push gitlab main
```

### 4. Verify Pipeline

1. Go to your GitLab project
2. Click **CI/CD → Pipelines**
3. You should see your pipeline running
4. Click on it to see the stages

## Pipeline Stages

### Install Stage
- Installs Node.js dependencies
- Installs Expo CLI and EAS CLI
- Caches node_modules for faster builds

### Test Stage (Full pipeline only)
- Runs linting
- Can run tests if configured

### Build Stage
- **Android**: Builds APK using EAS or native Gradle
- **iOS**: Builds IPA using EAS
- Builds are **manual** by default (click to run)

### Deploy Stage
- Preview: Shows build artifacts
- Production: Ready for app store deployment

## How to Use

### Manual Builds
1. Go to **CI/CD → Pipelines**
2. Click **Run pipeline**
3. Select your branch (usually `main`)
4. Click **Run pipeline**
5. Wait for install stage to complete
6. Click the **play button** (▶️) on the build job you want

### Automatic Builds
To make builds automatic, change `when: manual` to `when: on_success` in `.gitlab-ci.yml`

## Build Artifacts

After a successful build:
1. Go to **CI/CD → Pipelines**
2. Click on the completed pipeline
3. Click on the build job (e.g., `build_android`)
4. Click **Browse** in the artifacts section
5. Download your APK or IPA file

## Troubleshooting

### Pipeline Not Running
- Check if `.gitlab-ci.yml` is in the root directory
- Verify it's committed and pushed
- Check GitLab project settings → CI/CD → General pipelines

### EAS Build Fails
- Verify `EXPO_TOKEN` is set in GitLab CI/CD variables
- Check token has correct permissions
- Ensure `eas.json` is configured correctly

### Native Build Fails
- For Android: Ensure GitLab runner has Android SDK
- For iOS: Requires macOS runner with Xcode
- Consider using EAS Build instead (cloud-based)

## Next Steps

1. **Set up EAS Build** (recommended):
   ```bash
   eas login
   eas build:configure
   ```

2. **Add environment variables** in GitLab CI/CD settings

3. **Test the pipeline** by pushing to main branch

4. **Configure automatic builds** (optional) by removing `when: manual`

## Notes

- Builds are set to `manual` by default to save CI/CD minutes
- Change to automatic if you want builds on every push
- EAS Build requires an Expo account (free tier available)
- Native builds require specific GitLab runners (Android/iOS)

