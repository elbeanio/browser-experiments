#!/bin/bash

# Simple pre-commit secret check
# Run this before committing to check for potential secrets

set -e

echo "🔍 Running pre-commit secret check..."

# Check for .env files that shouldn't be committed
ENV_FILES=$(git diff --cached --name-only | grep -E '\.env$|\.env\.|\.env\.example$' | wc -l)
if [ "$ENV_FILES" -gt 0 ]; then
    echo "❌ Found .env files in staged changes:"
    git diff --cached --name-only | grep -E '\.env$|\.env\.|\.env\.example$'
    echo "Please review - .env files should not be committed unless they are .env.example files"
    exit 1
fi

# Check for common secret patterns in staged changes
echo "Checking staged changes for secret patterns..."
SECRET_PATTERNS=(
    "password\s*=\s*['\"].*['\"]"
    "secret\s*=\s*['\"].*['\"]"
    "api_key\s*=\s*['\"].*['\"]"
    "api_secret\s*=\s*['\"].*['\"]"
    "access_token\s*=\s*['\"].*['\"]"
    "private_key\s*=\s*['\"].*['\"]"
    "ghp_[0-9a-zA-Z]{36}"
    "gho_[0-9a-zA-Z]{36}"
    "github_pat_"
)

FOUND_SECRETS=0
for pattern in "${SECRET_PATTERNS[@]}"; do
    # Check staged changes
    MATCHES=$(git diff --cached -G "$pattern" --name-only 2>/dev/null | wc -l)
    if [ "$MATCHES" -gt 0 ]; then
        echo "⚠️  Pattern '$pattern' found in staged changes"
        git diff --cached -G "$pattern" --name-only
        FOUND_SECRETS=1
    fi
done

if [ "$FOUND_SECRETS" -eq 0 ]; then
    echo "✅ No obvious secrets found in staged changes"
    exit 0
else
    echo ""
    echo "🚨 Potential secrets found in staged changes!"
    echo "Please review the files above before committing."
    echo "If these are false positives (test data, examples, etc.), you can commit with --no-verify"
    echo "But make sure no real secrets are being committed!"
    exit 1
fi