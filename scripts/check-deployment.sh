#!/bin/bash

# Script to check and help fix GitHub Pages deployment

set -e

echo "🔍 Checking GitHub Pages deployment..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo ""
echo "=== Current Status ==="
echo ""

# Check if gh-pages branch exists
echo -n "Checking for gh-pages branch... "
if git ls-remote --heads origin | grep -q gh-pages; then
    echo -e "${GREEN}✅ Exists${NC}"
else
    echo -e "${RED}❌ Missing${NC}"
    echo "  The gh-pages branch doesn't exist. The deployment workflow may have failed."
    exit 1
fi

# Check gh-pages branch contents
echo -n "Checking gh-pages branch contents... "
GH_PAGES_CONTENT=$(git ls-tree -r origin/gh-pages --name-only | head -5 | wc -l)
if [ "$GH_PAGES_CONTENT" -gt 0 ]; then
    echo -e "${GREEN}✅ Has content${NC}"
    echo "  Files in gh-pages branch:"
    git ls-tree -r origin/gh-pages --name-only | head -5
else
    echo -e "${RED}❌ Empty${NC}"
fi

# Check GitHub Pages status via API (if available)
echo -n "Checking GitHub Pages status... "
if command -v gh &> /dev/null; then
    if gh api /repos/$(git remote get-url origin | sed -E 's/.*github.com[:\/]//' | sed 's/\.git$//')/pages &> /dev/null; then
        echo -e "${GREEN}✅ Enabled${NC}"
    else
        echo -e "${YELLOW}⚠️  Not enabled or API error${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  GitHub CLI not available${NC}"
fi

# Test the deployed URL
URL="https://$(git remote get-url origin | sed -E 's/.*github.com[:\/]//' | sed 's/\.git$//' | sed 's/^/elbeanio.github.io\//')"
echo -n "Testing deployed URL ($URL)... "
if curl -s -o /dev/null -w "%{http_code}" "$URL" | grep -q "200"; then
    echo -e "${GREEN}✅ Accessible${NC}"
else
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
    echo -e "${RED}❌ HTTP $HTTP_CODE${NC}"
fi

echo ""
echo "=== Next Steps ==="
echo ""

if [[ "$HTTP_CODE" != "200" ]]; then
    echo "📋 To fix GitHub Pages deployment:"
    echo ""
    echo "1. Go to: https://github.com/$(git remote get-url origin | sed -E 's/.*github.com[:\/]//' | sed 's/\.git$//')/settings/pages"
    echo "2. Under 'Build and deployment', select:"
    echo "   - Source: Deploy from a branch"
    echo "   - Branch: gh-pages"
    echo "   - Folder: / (root)"
    echo "3. Click Save"
    echo ""
    echo "4. Wait a few minutes for GitHub to deploy"
    echo "5. Check the site again: $URL"
    echo ""
    echo "Note: The deployment workflow creates the gh-pages branch, but GitHub Pages"
    echo "      needs to be manually enabled in repository settings."
else
    echo "✅ Deployment appears to be working!"
    echo "   Site: $URL"
fi

echo ""
echo "=== Troubleshooting ==="
echo ""
echo "If GitHub Pages is enabled but still not working:"
echo "1. Check the gh-pages branch has actual content:"
echo "   git ls-tree -r origin/gh-pages --name-only"
echo ""
echo "2. Check GitHub Actions workflow runs:"
echo "   gh run list --workflow=deploy.yml"
echo ""
echo "3. Check workflow logs for errors:"
echo "   gh run view [RUN_ID] --log"
echo ""
echo "4. The site may take a few minutes to deploy after enabling"