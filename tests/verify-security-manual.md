# Manual Security Verification Guide

This guide provides step-by-step instructions to manually verify that the Google AI API key is not exposed in the client-side code.

## Prerequisites

1. Start the development server:

   ```bash
   npm run dev
   ```

2. Open your browser to `http://localhost:3000`

## Verification Steps

### 1. Verify API Key Not in Client Bundle

**Steps:**

1. Open browser DevTools (F12 or Right-click → Inspect)
2. Go to the **Sources** tab
3. Search for files in the left panel
4. Look for any files containing "shopping" or "list"
5. Open `app/(app)/shopping-list/page.tsx` or similar compiled files
6. Press `Ctrl+F` (or `Cmd+F` on Mac) and search for:
   - `GEMINI_API_KEY`
   - `GOOGLE_AI_API_KEY`
   - `NEXT_PUBLIC_GOOGLE_AI_API_KEY`
   - `@google/genai`

**Expected Result:** ✅ None of these strings should be found in the client-side bundle.

### 2. Verify API Key Not in Network Requests

**Steps:**

1. Open browser DevTools (F12)
2. Go to the **Network** tab
3. Clear any existing requests (click the 🚫 icon)
4. Navigate to the Shopping List page: `http://localhost:3000/shopping-list`
5. Click on the "Criar Nova Lista" tab
6. Enter a prompt like "Compras da semana"
7. Click "Gerar"
8. In the Network tab, find the request to `/api/shopping-list/generate`
9. Click on it and examine:
   - **Headers** tab: Check request and response headers
   - **Payload** tab: Check the request body
   - **Response** tab: Check the response body

**Expected Result:** ✅ The API key should NOT appear in:

- Request headers
- Request body (payload)
- Response headers
- Response body

**What you SHOULD see:**

- Request body contains only: `{"prompt": "Compras da semana"}`
- Response body contains: `{"items": [...], "title": "..."}`

### 3. Test Shopping List Generation

**Steps:**

1. Go to Shopping List page
2. Click "Criar Nova Lista" tab
3. Enter prompt: "Ingredientes para lasanha"
4. Click "Gerar"
5. Wait for the list to appear

**Expected Result:** ✅ A list of ingredients should appear (e.g., "Massa de lasanha", "Molho de tomate", etc.)

### 4. Test NFe Parsing

**Steps:**

1. Go to Shopping List page
2. Click "Importar NF-e" tab
3. Enter a test URL: `https://sat.sef.sc.gov.br/nfce/consulta?p=12345678901234567890123456789012345678901234`
4. Click "Importar"
5. Observe the result

**Expected Result:**

- ✅ Either a parsed purchase appears (if AI can process it)
- ✅ OR a user-friendly error message appears (e.g., "Failed to parse NFe...")
- ❌ Should NOT show technical errors or API keys

### 5. Test Insights Generation

**Steps:**

1. Go to Shopping List page
2. Click "Histórico e Insights" tab
3. Click "Gerar Insights de Economia"
4. Wait for insights to appear

**Expected Result:** ✅ Markdown-formatted insights should appear with savings tips based on the mock purchase history.

### 6. Test Error Scenarios

#### Empty Prompt

**Steps:**

1. Go to "Criar Nova Lista" tab
2. Leave the prompt empty
3. Try to click "Gerar" (should be disabled)

**Expected Result:** ✅ Button should be disabled when prompt is empty.

#### Empty NFe URL

**Steps:**

1. Go to "Importar NF-e" tab
2. Leave the URL empty
3. Try to click "Importar" (should be disabled)

**Expected Result:** ✅ Button should be disabled when URL is empty.

#### Invalid NFe URL

**Steps:**

1. Go to "Importar NF-e" tab
2. Enter invalid URL: "not-a-url"
3. Click "Importar"

**Expected Result:** ✅ User-friendly error message appears (e.g., "Invalid URL format...")

### 7. Verify Environment Variables

**Steps:**

1. Check `.env` file in the project root
2. Verify it contains: `GEMINI_API_KEY=...`
3. Verify it does NOT contain: `NEXT_PUBLIC_GOOGLE_AI_API_KEY`

**Expected Result:**

- ✅ `GEMINI_API_KEY` exists (server-side only)
- ✅ No `NEXT_PUBLIC_*` variables for Google AI

### 8. Check Client Component Code

**Steps:**

1. Open `app/(app)/shopping-list/page.tsx`
2. Search for imports at the top of the file
3. Verify there are NO imports from `@google/genai`

**Expected Result:** ✅ No Google AI imports in the client component.

## Security Checklist

- [ ] API key not found in client-side bundle
- [ ] API key not in Network tab requests/responses
- [ ] Shopping list generation works correctly
- [ ] NFe parsing works correctly (or shows proper errors)
- [ ] Insights generation works correctly
- [ ] Error messages are user-friendly
- [ ] No `NEXT_PUBLIC_GOOGLE_AI_API_KEY` in .env
- [ ] No `@google/genai` imports in client components
- [ ] All API calls go through `/api/shopping-list/*` endpoints

## Common Issues

### Issue: "Service configuration error"

**Cause:** `GEMINI_API_KEY` is not set or is invalid.
**Solution:** Set a valid Google AI API key in `.env` file.

### Issue: Features don't work

**Cause:** Development server not running or API key not configured.
**Solution:**

1. Restart the dev server: `npm run dev`
2. Check `.env` file has valid `GEMINI_API_KEY`

### Issue: Can't find API requests in Network tab

**Cause:** Network tab not recording or requests filtered.
**Solution:**

1. Clear filters in Network tab
2. Make sure "Preserve log" is checked
3. Refresh the page and try again

## Automated Tests

To run automated tests:

```bash
# Run all tests
npm test

# Run only shopping list security tests
npm test shopping-list-security
```

## Conclusion

If all checks pass (✅), the implementation is secure and functional. The Google AI API key is properly protected on the server-side and never exposed to the client.
