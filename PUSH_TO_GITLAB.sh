#!/bin/bash
# Script to push code to GitLab
# Replace YOUR_USERNAME and YOUR_TOKEN below

echo "Pushing code to GitLab..."
echo "You will be prompted for:"
echo "  Username: degirmenjian.hagop1998"
echo "  Password: [Your Personal Access Token]"
echo ""

git push -u gitlab main

echo ""
echo "✅ Done! Check your GitLab project page to see your code."

