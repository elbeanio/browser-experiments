#!/bin/bash

# Secret checking script for pre-commit or manual use
# This script checks for potential secrets in the codebase

set -e

echo "🔍 Running secret check..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

FOUND_ISSUES=0

# Function to check pattern in staged files
check_pattern() {
    local pattern_name="$1"
    local pattern="$2"
    
    echo -n "Checking for ${pattern_name}... "
    
    # Check staged changes only
    MATCHES=$(git diff --cached -G "$pattern" --name-only 2>/dev/null | wc -l)
    
    if [ "$MATCHES" -gt 0 ]; then
        echo -e "${RED}❌ Found in staged changes${NC}"
        git diff --cached -G "$pattern" --name-only
        return 1
    else
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    fi
}

# Function to check for sensitive files in staged changes
check_sensitive_files() {
    echo -n "Checking for sensitive files in staged changes... "
    
    # Get list of staged files
    STAGED_FILES=$(git diff --cached --name-only)
    
    # Check each staged file for sensitive patterns in filenames
    SENSITIVE_STAGED=$(echo "$STAGED_FILES" | grep -E '\.env$|\.env\.|secret|credential|password|\.key$|\.pem$|\.crt$|\.cer$' | wc -l)
    
    if [ "$SENSITIVE_STAGED" -gt 0 ]; then
        echo -e "${YELLOW}⚠️  Found sensitive files staged${NC}"
        echo "$STAGED_FILES" | grep -E '\.env$|\.env\.|secret|credential|password|\.key$|\.pem$|\.crt$|\.cer$'
        return 1
    else
        echo -e "${GREEN}✅ OK${NC}"
        return 0
    fi
}

# Check for common secret patterns
echo ""
echo "=== Checking staged changes for secret patterns ==="
echo ""

# Simple patterns that work with git diff -G
check_pattern "GitHub tokens" "gh[pousr]_" || FOUND_ISSUES=1
check_pattern "GitHub PAT" "github_pat_" || FOUND_ISSUES=1
check_pattern "AWS keys" "AKIA[0-9A-Z]" || FOUND_ISSUES=1
check_pattern "Private key markers" "-----BEGIN.*PRIVATE KEY" || FOUND_ISSUES=1
check_pattern "JWT tokens" "eyJ" || FOUND_ISSUES=1

# Check for generic secret patterns
check_pattern "password assignments" "password.*=.*['\"]" || FOUND_ISSUES=1
check_pattern "secret assignments" "secret.*=.*['\"]" || FOUND_ISSUES=1
check_pattern "API key assignments" "api_key.*=.*['\"]" || FOUND_ISSUES=1
check_pattern "access token assignments" "access_token.*=.*['\"]" || FOUND_ISSUES=1

# Check for sensitive files
echo ""
check_sensitive_files || FOUND_ISSUES=1

# Summary
echo ""
echo "=== Summary ==="
if [ "$FOUND_ISSUES" -eq 0 ]; then
    echo -e "${GREEN}✅ No obvious secrets found in staged changes${NC}"
    echo ""
    echo "Note: This is a basic check. For comprehensive scanning, run the GitHub Actions workflow."
    exit 0
else
    echo -e "${RED}🚨 Potential secrets found in staged changes!${NC}"
    echo ""
    echo "Please review the findings above before committing."
    echo ""
    echo "If these are false positives (test data, examples, etc.):"
    echo "1. Make sure they're not real secrets"
    echo "2. You can commit with --no-verify if needed"
    echo "3. Consider adding them to .gitignore if they shouldn't be committed"
    echo ""
    echo "For real secrets:"
    echo "1. Remove them from the code immediately"
    echo "2. Use environment variables or secret management"
    echo "3. Rotate any exposed credentials"
    exit 1
fi