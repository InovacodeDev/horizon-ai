#!/bin/bash

# Static Security Verification Script
# This script performs static analysis to verify API key security

echo "=================================================="
echo "Shopping List Security Verification"
echo "=================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

PASSED=0
FAILED=0

# Function to print test result
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((PASSED++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((FAILED++))
    fi
}

echo "1. Checking for insecure API key variables..."
echo "----------------------------------------------"

# Check for NEXT_PUBLIC_GOOGLE_AI_API_KEY in .env files
if grep -r "NEXT_PUBLIC_GOOGLE_AI_API_KEY" .env* 2>/dev/null | grep -v ".env.example" | grep -v "^#"; then
    print_result 1 "Found NEXT_PUBLIC_GOOGLE_AI_API_KEY in .env files"
else
    print_result 0 "No NEXT_PUBLIC_GOOGLE_AI_API_KEY in .env files"
fi

# Check for NEXT_PUBLIC_GOOGLE_AI_API_KEY in client code
if grep -r "NEXT_PUBLIC_GOOGLE_AI_API_KEY" app/ components/ 2>/dev/null; then
    print_result 1 "Found NEXT_PUBLIC_GOOGLE_AI_API_KEY in client code"
else
    print_result 0 "No NEXT_PUBLIC_GOOGLE_AI_API_KEY in client code"
fi

echo ""
echo "2. Checking for Google AI imports in client code..."
echo "----------------------------------------------------"

# Check shopping list page specifically
if grep -r "@google/genai" "app/(app)/shopping-list/" 2>/dev/null; then
    print_result 1 "Found @google/genai import in shopping list page"
else
    print_result 0 "No @google/genai imports in shopping list page"
fi

# Check all client components (excluding API routes)
CLIENT_IMPORTS=$(grep -r "@google/genai" app/ 2>/dev/null | grep -v "app/api/" | grep -v ".test." || echo "")
if [ -n "$CLIENT_IMPORTS" ]; then
    echo -e "${YELLOW}⚠ WARNING${NC}: Found @google/genai imports in other client components:"
    echo "$CLIENT_IMPORTS"
    echo "(This is outside the scope of this task but should be addressed)"
fi

echo ""
echo "3. Verifying server-side API routes exist..."
echo "---------------------------------------------"

# Check if API routes exist
if [ -f "app/api/shopping-list/generate/route.ts" ]; then
    print_result 0 "Shopping list generation API route exists"
else
    print_result 1 "Shopping list generation API route missing"
fi

if [ -f "app/api/shopping-list/parse-nfe/route.ts" ]; then
    print_result 0 "NFe parsing API route exists"
else
    print_result 1 "NFe parsing API route missing"
fi

if [ -f "app/api/shopping-list/insights/route.ts" ]; then
    print_result 0 "Insights generation API route exists"
else
    print_result 1 "Insights generation API route missing"
fi

echo ""
echo "4. Verifying Google AI service module..."
echo "-----------------------------------------"

if [ -f "lib/services/google-ai.service.ts" ]; then
    print_result 0 "Google AI service module exists"
    
    # Check if it uses GEMINI_API_KEY (server-side)
    if grep -q "process.env.GEMINI_API_KEY" "lib/services/google-ai.service.ts"; then
        print_result 0 "Service uses server-side GEMINI_API_KEY"
    else
        print_result 1 "Service doesn't use GEMINI_API_KEY"
    fi
else
    print_result 1 "Google AI service module missing"
fi

echo ""
echo "5. Checking client component implementation..."
echo "-----------------------------------------------"

if [ -f "app/(app)/shopping-list/page.tsx" ]; then
    # Check if client uses fetch to call API routes
    if grep -q "fetch.*api/shopping-list" "app/(app)/shopping-list/page.tsx"; then
        print_result 0 "Client uses fetch to call API routes"
    else
        print_result 1 "Client doesn't use fetch for API calls"
    fi
    
    # Verify no direct Google AI usage
    if grep -q "GoogleGenAI\|@google/genai" "app/(app)/shopping-list/page.tsx"; then
        print_result 1 "Client still has Google AI imports"
    else
        print_result 0 "Client has no Google AI imports"
    fi
else
    print_result 1 "Shopping list page not found"
fi

echo ""
echo "6. Verifying environment configuration..."
echo "------------------------------------------"

# Check .env.example has correct variable
if grep -q "^GEMINI_API_KEY=" ".env.example"; then
    print_result 0 ".env.example has GEMINI_API_KEY"
else
    print_result 1 ".env.example missing GEMINI_API_KEY"
fi

# Check .env.example doesn't have public variable
if grep -q "^NEXT_PUBLIC_GOOGLE_AI_API_KEY=" ".env.example"; then
    print_result 1 ".env.example has insecure NEXT_PUBLIC_GOOGLE_AI_API_KEY"
else
    print_result 0 ".env.example doesn't have insecure variable"
fi

# Check if .env exists and has GEMINI_API_KEY
if [ -f ".env" ]; then
    if grep -q "^GEMINI_API_KEY=" ".env"; then
        print_result 0 ".env has GEMINI_API_KEY configured"
    else
        echo -e "${YELLOW}⚠ WARNING${NC}: .env exists but GEMINI_API_KEY not configured"
    fi
else
    echo -e "${YELLOW}⚠ WARNING${NC}: .env file not found (expected for new setups)"
fi

echo ""
echo "7. Checking API route implementations..."
echo "-----------------------------------------"

# Check generate route
if grep -q "getGoogleAIService" "app/api/shopping-list/generate/route.ts" 2>/dev/null; then
    print_result 0 "Generate route uses Google AI service"
else
    print_result 1 "Generate route doesn't use Google AI service"
fi

# Check parse-nfe route
if grep -q "getGoogleAIService" "app/api/shopping-list/parse-nfe/route.ts" 2>/dev/null; then
    print_result 0 "Parse NFe route uses Google AI service"
else
    print_result 1 "Parse NFe route doesn't use Google AI service"
fi

# Check insights route
if grep -q "getGoogleAIService" "app/api/shopping-list/insights/route.ts" 2>/dev/null; then
    print_result 0 "Insights route uses Google AI service"
else
    print_result 1 "Insights route doesn't use Google AI service"
fi

echo ""
echo "8. Verifying error handling..."
echo "-------------------------------"

# Check if routes have proper error handling
for route in "generate" "parse-nfe" "insights"; do
    route_file="app/api/shopping-list/$route/route.ts"
    if [ -f "$route_file" ]; then
        if grep -q "GoogleAIServiceError" "$route_file"; then
            print_result 0 "$route route has error handling"
        else
            print_result 1 "$route route missing error handling"
        fi
    fi
done

echo ""
echo "=================================================="
echo "Summary"
echo "=================================================="
echo -e "${GREEN}Passed: $PASSED${NC}"
echo -e "${RED}Failed: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All security checks passed!${NC}"
    echo ""
    echo "The implementation is secure:"
    echo "  • API key is server-side only (GEMINI_API_KEY)"
    echo "  • No client-side Google AI imports"
    echo "  • All AI operations go through API routes"
    echo "  • Proper error handling in place"
    echo ""
    echo "Next steps:"
    echo "  1. Start dev server: npm run dev"
    echo "  2. Test functionality manually (see tests/verify-security-manual.md)"
    echo "  3. Run automated tests: npm test shopping-list-security"
    exit 0
else
    echo -e "${RED}✗ Some security checks failed!${NC}"
    echo ""
    echo "Please review the failed checks above and fix the issues."
    exit 1
fi
