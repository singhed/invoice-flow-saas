#!/bin/bash

# Documentation validation script for enterprise-level quality checks
# Version: 1.0.0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
ERRORS=0
WARNINGS=0
PASSED=0

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Documentation Validation${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Function to check file exists
check_file() {
    local file=$1
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗${NC} $file (missing)"
        ((ERRORS++))
        return 1
    fi
}

# Function to check for balanced code blocks
check_code_blocks() {
    local file=$1
    local count=$(grep -c '```' "$file" 2>/dev/null || echo "0")
    
    if [ $((count % 2)) -eq 0 ]; then
        echo -e "${GREEN}✓${NC} $file: Code blocks balanced"
        ((PASSED++))
    else
        echo -e "${RED}✗${NC} $file: Unbalanced code blocks (found $count)"
        ((ERRORS++))
    fi
}

# Function to check for emojis
check_emojis() {
    local file=$1
    # Simple check for common emoji patterns
    if grep -q ':.*:' "$file" 2>/dev/null || grep -qP '[\x{1F300}-\x{1F9FF}]' "$file" 2>/dev/null; then
        echo -e "${YELLOW}⚠${NC} $file: May contain emojis"
        ((WARNINGS++))
    else
        echo -e "${GREEN}✓${NC} $file: No emojis found"
        ((PASSED++))
    fi
}

# Check required root documentation files
echo "Checking Required Files..."
echo "-------------------------"

REQUIRED_FILES=(
    "README.md"
    "API_DOCUMENTATION.md"
    "INSTALLATION.md"
    "QUICK_START.md"
    "CONTRIBUTING.md"
    "SECURITY.md"
    "CHANGELOG.md"
    "LICENSE"
)

for file in "${REQUIRED_FILES[@]}"; do
    check_file "$file"
done

echo ""
echo "Checking docs/ Directory..."
echo "-------------------------"

REQUIRED_DOCS=(
    "docs/INDEX.md"
    "docs/README.md"
    "docs/ARCHITECTURE.md"
    "docs/DEPLOYMENT_GUIDE.md"
    "docs/DATABASE.md"
    "docs/RUNBOOK.md"
    "docs/SLA.md"
    "docs/TESTING_STRATEGY.md"
    "docs/API_VERSIONING.md"
)

for file in "${REQUIRED_DOCS[@]}"; do
    check_file "$file"
done

echo ""
echo "Checking Code Block Balance..."
echo "-----------------------------"

MARKDOWN_FILES=(
    "README.md"
    "API_DOCUMENTATION.md"
    "INSTALLATION.md"
    "QUICK_START.md"
    "CONTRIBUTING.md"
    "docs/RUNBOOK.md"
    "docs/TESTING_STRATEGY.md"
)

for file in "${MARKDOWN_FILES[@]}"; do
    if [ -f "$file" ]; then
        check_code_blocks "$file"
    fi
done

echo ""
echo "Checking for Emojis..."
echo "---------------------"

STYLE_CHECK_FILES=(
    "README.md"
    "API_DOCUMENTATION.md"
    "docs/README.md"
)

for file in "${STYLE_CHECK_FILES[@]}"; do
    if [ -f "$file" ]; then
        check_emojis "$file"
    fi
done

echo ""
echo "Checking File Structure..."
echo "-------------------------"

if [ -d "docs/services" ]; then
    echo -e "${GREEN}✓${NC} docs/services directory exists"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} docs/services directory missing (optional)"
    ((WARNINGS++))
fi

if [ -f ".docs-map.md" ]; then
    echo -e "${GREEN}✓${NC} Documentation map exists"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠${NC} Documentation map missing"
    ((WARNINGS++))
fi

# Summary
echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Validation Summary${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"
echo -e "${RED}Errors: $ERRORS${NC}"
echo ""

if [ $ERRORS -gt 0 ]; then
    echo -e "${RED}Validation failed with $ERRORS error(s)${NC}"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}Validation passed with $WARNINGS warning(s)${NC}"
    exit 0
else
    echo -e "${GREEN}All documentation checks passed successfully!${NC}"
    exit 0
fi
