#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Horizon AI - Pre-Push Validation${NC}"
echo "=================================="
echo ""

# Track if any check fails
FAILED=0

# 1. TypeScript Type Checking
echo -e "${YELLOW}📝 Running TypeScript type checking...${NC}"
pnpm typecheck
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ TypeScript type checking failed${NC}"
  FAILED=1
else
  echo -e "${GREEN}✅ TypeScript type checking passed${NC}"
fi
echo ""

# 2. Build (includes linting)
echo -e "${YELLOW}🏗️  Building project...${NC}"
pnpm build
if [ $? -ne 0 ]; then
  echo -e "${RED}❌ Build failed${NC}"
  FAILED=1
else
  echo -e "${GREEN}✅ Build passed${NC}"
fi
echo ""

# Final result
echo "=================================="
if [ $FAILED -eq 1 ]; then
  echo -e "${RED}❌ Pre-push validation FAILED${NC}"
  echo -e "${YELLOW}Please fix the errors above before pushing${NC}"
  exit 1
else
  echo -e "${GREEN}✅ All validations PASSED${NC}"
  echo -e "${GREEN}Safe to push!${NC}"
  exit 0
fi
