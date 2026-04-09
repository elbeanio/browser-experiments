#!/bin/bash

# Setup pre-commit hooks for secret checking

set -e

echo "🔧 Setting up pre-commit hooks..."

# Create .git/hooks directory if it doesn't exist
mkdir -p .git/hooks

# Create pre-commit hook
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Pre-commit hook for secret checking

echo "🔍 Running pre-commit checks..."

# Run secret check
if [ -f scripts/secret-check.sh ]; then
    ./scripts/secret-check.sh
    SECRET_CHECK_RESULT=$?
    
    if [ $SECRET_CHECK_RESULT -ne 0 ]; then
        echo ""
        echo "❌ Secret check failed. Commit aborted."
        echo "If you need to bypass this check, use: git commit --no-verify"
        exit 1
    fi
else
    echo "⚠️  Secret check script not found at scripts/secret-check.sh"
fi

# Add other pre-commit checks here if needed

echo "✅ Pre-commit checks passed!"
exit 0
EOF

# Make the hook executable
chmod +x .git/hooks/pre-commit

echo "✅ Pre-commit hook installed at .git/hooks/pre-commit"
echo ""
echo "The hook will run automatically before each commit."
echo "To bypass the check (if needed), use: git commit --no-verify"
echo ""
echo "You can also run the check manually: ./scripts/secret-check.sh"