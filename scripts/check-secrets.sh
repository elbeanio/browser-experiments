#!/bin/bash

# Simple secret checking script for pre-commit

echo "🔍 Checking for potential secrets..."

# Check for common secret patterns
PATTERNS=(
  "password\s*=\s*['\"].*['\"]"
  "secret\s*=\s*['\"].*['\"]"
  "key\s*=\s*['\"].*['\"]"
  "token\s*=\s*['\"].*['\"]"
  "api_key\s*=\s*['\"].*['\"]"
  "api_secret\s*=\s*['\"].*['\"]"
  "private_key\s*=\s*['\"].*['\"]"
  "access_token\s*=\s*['\"].*['\"]"
  "auth_token\s*=\s*['\"].*['\"]"
  "bearer\s*['\"].*['\"]"
  "ghp_"
  "gho_"
  "ghu_"
  "ghs_"
  "ghr_"
  "github_pat_"
)

FOUND_SECRETS=0

for pattern in "${PATTERNS[@]}"; do
  MATCHES=$(grep -r -I -n -E "$pattern" . \
    --exclude-dir=.git \
    --exclude-dir=node_modules \
    --exclude-dir=dist \
    --exclude="*.lock" \
    --exclude="*.map" \
    --exclude="*.min.js" 2>/dev/null | wc -l)
  
  if [ "$MATCHES" -gt 0 ]; then
    echo "❌ Found $MATCHES matches for pattern: $pattern"
    grep -r -I -n -E "$pattern" . \
      --exclude-dir=.git \
      --exclude-dir=node_modules \
      --exclude-dir=dist \
      --exclude="*.lock" \
      --exclude="*.map" \
      --exclude="*.min.js" 2>/dev/null | head -5
    FOUND_SECRETS=1
  fi
done

# Check for .env files
ENV_FILES=$(find . -name "*.env*" -o -name ".env" 2>/dev/null | grep -v node_modules | grep -v .git | wc -l)
if [ "$ENV_FILES" -gt 0 ]; then
  echo "⚠️  Found $ENV_FILES .env files (should not be committed):"
  find . -name "*.env*" -o -name ".env" 2>/dev/null | grep -v node_modules | grep -v .git
  FOUND_SECRETS=1
fi

# Check for credential/key files
CRED_FILES=$(find . -name "*credential*" -o -name "*password*" -o -name "*secret*" -o -name "*.pem" -o -name "*.key" 2>/dev/null | grep -v node_modules | grep -v .git | wc -l)
if [ "$CRED_FILES" -gt 0 ]; then
  echo "⚠️  Found $CRED_FILES credential/key files (should not be committed):"
  find . -name "*credential*" -o -name "*password*" -o -name "*secret*" -o -name "*.pem" -o -name "*.key" 2>/dev/null | grep -v node_modules | grep -v .git | head -5
  FOUND_SECRETS=1
fi

if [ "$FOUND_SECRETS" -eq 0 ]; then
  echo "✅ No obvious secrets found"
  exit 0
else
  echo ""
  echo "🚨 Potential secrets found! Please review before committing."
  echo "If these are false positives, add them to .gitignore or exclude patterns."
  exit 1
fi