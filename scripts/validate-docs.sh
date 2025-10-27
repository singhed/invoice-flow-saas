#!/bin/bash

# Documentation validation script
# Checks for broken links and missing references

set -e

echo "Validating documentation..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ERRORS=0
WARNINGS=0

# Check if required documentation files exist
echo ""
echo "Checking required files..."
REQUIRED_FILES=(
    "README.md"
    "API_DOCUMENTATION.md"
    "INSTALLATION.md"
    "QUICK_START.md"
    "CONTRIBUTING.md"
    "SECURITY.md"
    "CHANGELOG.md"
    "LICENSE"
    "docs/ARCHITECTURE.md"
    "docs/DEPLOYMENT_GUIDE.md"
    "docs/DATABASE.md"
    "docs/INDEX.md"
)

for file in "${REQUIRED_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file (missing)"
        ((ERRORS++))
    fi
done

# Extract all markdown links and check if target files exist
echo ""
echo "Checking markdown links..."
CHECKED=0
BROKEN=0

for mdfile in README.md API_DOCUMENTATION.md INSTALLATION.md QUICK_START.md CONTRIBUTING.md SECURITY.md docs/*.md; do
    if [ -f "$mdfile" ]; then
        # Extract relative markdown links
        links=$(grep -oE '\[.*\]\([^)]+\.md[^)]*\)' "$mdfile" 2>/dev/null || true)
        if [ -n "$links" ]; then
            while IFS= read -r link; do
                # Extract the path from [text](path)
                path=$(echo "$link" | sed -E 's/.*\]\(([^)]+)\).*/\1/')
                
                # Remove any anchors (#section)
                clean_path=$(echo "$path" | sed 's/#.*//')
                
                # Resolve relative path
                if [[ "$clean_path" == /* ]]; then
                    target_file="$clean_path"
                else
                    dir=$(dirname "$mdfile")
                    target_file="$dir/$clean_path"
                fi
                
                ((CHECKED++))
                if [ -f "$target_file" ]; then
                    echo -e "${GREEN}✓${NC} $mdfile -> $clean_path"
                else
                    echo -e "${RED}✗${NC} $mdfile -> $clean_path (broken)"
                    ((BROKEN++))
                    ((WARNINGS++))
                fi
            done <<< "$links"
        fi
    fi
done

# Check for consistent heading format
echo ""
echo "Checking markdown formatting..."
for mdfile in README.md API_DOCUMENTATION.md INSTALLATION.md QUICK_START.md CONTRIBUTING.md SECURITY.md docs/README.md; do
    if [ -f "$mdfile" ]; then
        # Check for emoji (should not be present)
        if grep -qE '[\x{1F300}-\x{1F9FF}]|[\x{2600}-\x{26FF}]|:\w+:' "$mdfile" 2>/dev/null; then
            echo -e "${YELLOW}⚠${NC} $mdfile contains emojis (should be removed)"
            ((WARNINGS++))
        fi
        
        # Check for proper code block closure
        code_blocks=$(grep -c '```' "$mdfile" || echo "0")
        if [ $((code_blocks % 2)) -ne 0 ]; then
            echo -e "${RED}✗${NC} $mdfile has unclosed code blocks"
            ((ERRORS++))
        fi
    fi
done

# Summary
echo ""
echo "=================================="
echo "Documentation Validation Summary"
echo "=================================="
echo "Links checked: $CHECKED"
echo "Broken links: $BROKEN"
echo -e "${RED}Errors: $ERRORS${NC}"
echo -e "${YELLOW}Warnings: $WARNINGS${NC}"

if [ $ERRORS -gt 0 ]; then
    echo ""
    echo -e "${RED}Validation failed with $ERRORS error(s)${NC}"
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    echo ""
    echo -e "${YELLOW}Validation passed with $WARNINGS warning(s)${NC}"
    exit 0
else
    echo ""
    echo -e "${GREEN}All documentation checks passed!${NC}"
    exit 0
fi
