# How to Create a GitLab Personal Access Token

## Step-by-Step Instructions:

1. **You're currently on the Preferences page** - I can see you're there!

2. **In the left sidebar**, scroll down and click on **"Personal access tokens"**
   - It's located between "Integration accounts" and "Emails"
   - It's under the "User settings" section

3. **On the Personal Access Tokens page:**
   - You'll see a form to create a new token
   - Fill in:
     - **Token name**: `ISS Mobile App Push` (or any name you prefer)
     - **Expiration date**: Choose a date or leave blank for no expiration
     - **Select scopes**: Check the box for **`write_repository`**
     - Click **"Create personal access token"**

4. **Copy the token immediately!**
   - GitLab will show you the token only once
   - It will look something like: `glpat-xxxxxxxxxxxxxxxxxxxx`
   - Copy it and save it somewhere safe

5. **Use the token to push:**
   - When you run `git push -u gitlab main`
   - Username: `degirmenjian.hagop1998` (or your GitLab username)
   - Password: **Paste the token** (not your GitLab password!)

## Quick Navigation:
- Direct link: https://gitlab.com/-/user_settings/personal_access_tokens
- Or: Click your profile → Preferences → Personal access tokens (left sidebar)

