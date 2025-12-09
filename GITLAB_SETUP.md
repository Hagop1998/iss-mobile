# GitLab Setup Instructions

## Step 1: Create GitLab Account
1. Go to https://gitlab.com/users/sign_up
2. Sign up with your email or use GitHub/Google
3. Verify your email address

## Step 2: Create New Project
1. After logging in, click "New project" or "Create project"
2. Choose "Create blank project"
3. Fill in:
   - **Project name**: `ISS-mobile-app` (or your preferred name)
   - **Visibility**: Private (recommended) or Public
   - **Initialize with README**: ❌ Leave unchecked (we already have one)
4. Click "Create project"

## Step 3: Push Your Code

After creating the project, GitLab will show you the repository URL. It will look like:
- **HTTPS**: `https://gitlab.com/your-username/ISS-mobile-app.git`
- **SSH**: `git@gitlab.com:your-username/ISS-mobile-app.git`

### Option A: Using HTTPS (Recommended for beginners)

Replace `YOUR_GITLAB_USERNAME` and `YOUR_PROJECT_NAME` with your actual values:

```bash
# Add GitLab remote
git remote add gitlab https://gitlab.com/YOUR_GITLAB_USERNAME/YOUR_PROJECT_NAME.git

# Push to GitLab
git push -u gitlab main
```

### Option B: Using SSH (If you have SSH keys set up)

```bash
# Add GitLab remote
git remote add gitlab git@gitlab.com:YOUR_GITLAB_USERNAME/YOUR_PROJECT_NAME.git

# Push to GitLab
git push -u gitlab main
```

## Step 4: Verify

After pushing, refresh your GitLab project page. You should see all your files there!

## Troubleshooting

### If you get authentication errors:
- For HTTPS: GitLab will prompt for username and password. Use a Personal Access Token instead of password.
  - Go to: Settings → Access Tokens
  - Create token with `write_repository` scope
  - Use token as password when prompted

### If you need to change the remote URL:
```bash
git remote set-url gitlab https://gitlab.com/YOUR_USERNAME/YOUR_PROJECT.git
```

## Next Steps

After pushing:
1. Add a README.md with project description
2. Set up CI/CD pipelines (optional)
3. Add collaborators (if needed)
4. Configure branch protection rules (optional)

