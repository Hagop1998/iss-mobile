# Push to Both GitHub and GitLab

This guide shows you how to push your mobile app to both GitHub and GitLab simultaneously.

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository named `iss-mobile` (or your preferred name)
3. **Don't** initialize with README, .gitignore, or license (we already have these)
4. Click "Create repository"

## Step 2: Add GitHub Remote

After creating the repository, GitHub will show you the repository URL. Use it to add the remote:

```bash
# Add GitHub remote (replace YOUR_USERNAME with your GitHub username)
git remote add github https://github.com/YOUR_USERNAME/iss-mobile.git

# Or if you prefer SSH:
git remote add github git@github.com:YOUR_USERNAME/iss-mobile.git
```

## Step 3: Verify Remotes

Check that both remotes are configured:

```bash
git remote -v
```

You should see:
- `gitlab` → your GitLab repository
- `github` → your GitHub repository

## Step 4: Push to Both Repositories

### Option A: Push to both separately

```bash
# Push to GitLab
git push gitlab main

# Push to GitHub
git push github main
```

### Option B: Push to both at once (create an alias)

```bash
# Create an alias to push to both
git config alias.pushall '!git push gitlab main && git push github main'

# Use it:
git pushall
```

### Option C: Push to all remotes

```bash
# Push to all remotes at once
git push --all --all
```

## Step 5: Set Up Default Push (Optional)

If you want to push to both by default:

```bash
# Set both as push URLs for origin
git remote set-url --add --push origin https://gitlab.com/degirmenjian.hagop1998/iss-mobile.git
git remote set-url --add --push origin https://github.com/YOUR_USERNAME/iss-mobile.git

# Then you can just use:
git push origin main
```

## Current Setup

- **GitLab remote**: `gitlab` → https://gitlab.com/degirmenjian.hagop1998/iss-mobile.git
- **GitHub remote**: Add using Step 2 above

## Quick Commands Reference

```bash
# Check remotes
git remote -v

# Push to GitLab only
git push gitlab main

# Push to GitHub only
git push github main

# Push to both (if you set up the alias)
git pushall
```

## Troubleshooting

### If GitHub asks for authentication:
- Use a Personal Access Token instead of password
- Or set up SSH keys for GitHub

### If you get "remote already exists":
```bash
# Remove existing remote
git remote remove github

# Add it again
git remote add github https://github.com/YOUR_USERNAME/iss-mobile.git
```

