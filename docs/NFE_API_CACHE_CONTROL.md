# NFE Invoice API - Cache Control Guide

## Overview

The POST /api/invoices endpoint now supports cache control through the `forceRefresh` query parameter and returns cache metadata in responses.

## Force Refresh Parameter

### Usage

Add `?forceRefresh=true` to the API endpoint URL to bypass cache and force re-parsing:

```bash
POST /api/invoices?forceRefresh=true
```

### When to Use Force Refresh

1. **Invoice Updates**: When you know an invoice has been updated on the government portal
2. **Data Verification**: When you need to verify the latest data from the source
3. **Debugging**: When troubleshooting parsing issues
4. **Testing**: When testing the parsing logic with fresh data

### Default Behavior

- **Without parameter**: Uses cached data if available (24-hour TTL)
- **With `forceRefresh=false`**: Same as default, uses cache
- **With `forceRefresh=true`**: Bypasses cache, fetches and parses fresh data

## Response Metadata

Every successful response includes metadata about the parsing operation:

```typescript
{
  "success": true,
  "data": { /* invoice data */ },
  "metadata": {
    "fromCache": boolean,           // true if served from cache
    "cachedAt": Date | undefined,   // when data was cached (if from cache)
    "parsingMethod": "ai" | "xml" | "html"  // parsing method used
  }
}
```

### Metadata Fields

#### `fromCache`

- **Type**: `boolean`
- **Description**: Indicates whether the data was served from cache
- **Values**:
  - `true`: Data was retrieved from cache (fast response)
  - `false`: Data was freshly parsed (slower response)

#### `cachedAt`

- **Type**: `Date | undefined`
- **Description**: Timestamp when the data was originally cached
- **Values**:
  - `Date`: ISO 8601 timestamp (e.g., "2025-11-06T10:30:00.000Z")
  - `undefined`: Not present if `fromCache` is false

#### `parsingMethod`

- **Type**: `"ai" | "xml" | "html"`
- **Description**: Method used to parse the invoice
- **Values**:
  - `"ai"`: Parsed using AI (Claude/GPT) - most common
  - `"xml"`: Parsed from XML data (when available)
  - `"html"`: Parsed from HTML (fallback method)

## Examples

### Example 1: First Request (Cache Miss)

```bash
POST /api/invoices
Content-Type: application/json

{
  "invoiceUrl": "https://sat.sef.sc.gov.br/nfce/consulta?p=42251109477652004850651140001754231806228292"
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "data": {
    "id": "invoice_123",
    "invoiceKey": "42251109477652004850651140001754231806228292",
    "merchant": {
      "name": "SUPERMERCADO EXEMPLO LTDA",
      "cnpj": "12345678000190"
    },
    "totals": {
      "total": 125.9
    }
    // ... more invoice data
  },
  "metadata": {
    "fromCache": false,
    "parsingMethod": "ai"
  }
}
```

### Example 2: Subsequent Request (Cache Hit)

```bash
POST /api/invoices
Content-Type: application/json

{
  "invoiceUrl": "https://sat.sef.sc.gov.br/nfce/consulta?p=42251109477652004850651140001754231806228292"
}
```

**Response** (201 Created, ~10x faster):

```json
{
  "success": true,
  "data": {
    // ... same invoice data
  },
  "metadata": {
    "fromCache": true,
    "cachedAt": "2025-11-06T10:30:00.000Z",
    "parsingMethod": "ai"
  }
}
```

### Example 3: Force Refresh

```bash
POST /api/invoices?forceRefresh=true
Content-Type: application/json

{
  "invoiceUrl": "https://sat.sef.sc.gov.br/nfce/consulta?p=42251109477652004850651140001754231806228292"
}
```

**Response** (201 Created):

```json
{
  "success": true,
  "data": {
    // ... freshly parsed invoice data
  },
  "metadata": {
    "fromCache": false,
    "parsingMethod": "ai"
  }
}
```

## Client Implementation Examples

### JavaScript/TypeScript

```typescript
async function createInvoice(invoiceUrl: string, forceRefresh: boolean = false) {
  const url = new URL('/api/invoices', window.location.origin);
  if (forceRefresh) {
    url.searchParams.set('forceRefresh', 'true');
  }

  const response = await fetch(url.toString(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ invoiceUrl }),
  });

  const result = await response.json();

  if (result.success) {
    console.log('Invoice created:', result.data);
    console.log('From cache:', result.metadata.fromCache);
    console.log('Parsing method:', result.metadata.parsingMethod);

    if (result.metadata.fromCache) {
      console.log('Cached at:', new Date(result.metadata.cachedAt));
    }
  }

  return result;
}

// Use cached data (default)
await createInvoice('https://...');

// Force refresh
await createInvoice('https://...', true);
```

### React Hook

```typescript
import { useState } from 'react';

function useInvoiceCreation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createInvoice = async (invoiceUrl: string, forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      const url = new URL('/api/invoices', window.location.origin);
      if (forceRefresh) {
        url.searchParams.set('forceRefresh', 'true');
      }

      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceUrl }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { createInvoice, loading, error };
}

// Usage in component
function InvoiceForm() {
  const { createInvoice, loading } = useInvoiceCreation();
  const [showCacheInfo, setShowCacheInfo] = useState(false);

  const handleSubmit = async (url: string, forceRefresh: boolean) => {
    const result = await createInvoice(url, forceRefresh);

    if (result.metadata.fromCache) {
      setShowCacheInfo(true);
      // Show user that data was from cache
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      handleSubmit(
        formData.get('url') as string,
        formData.get('forceRefresh') === 'on'
      );
    }}>
      <input name="url" placeholder="Invoice URL" />
      <label>
        <input type="checkbox" name="forceRefresh" />
        Force refresh (bypass cache)
      </label>
      <button type="submit" disabled={loading}>
        {loading ? 'Processing...' : 'Create Invoice'}
      </button>
    </form>
  );
}
```

## Performance Considerations

### Cache Hit Performance

- **Response Time**: ~50-100ms (vs 5-10 seconds for fresh parsing)
- **Cost**: No AI API calls (saves money)
- **Reliability**: No dependency on government portal availability

### Cache Miss Performance

- **Response Time**: 5-10 seconds (includes web crawling + AI parsing)
- **Cost**: ~$0.01-0.05 per invoice (AI API costs)
- **Reliability**: Depends on government portal and AI API availability

### Recommendations

1. **Default to Cache**: Let the system use cache by default for best performance
2. **Force Refresh Sparingly**: Only use when you need guaranteed fresh data
3. **Show Cache Status**: Display cache metadata to users for transparency
4. **Handle Timeouts**: Implement proper timeout handling for fresh parsing requests

## Cache Configuration

Cache behavior can be configured via environment variables:

```bash
# Cache TTL (time-to-live) in milliseconds
# Default: 86400000 (24 hours)
CACHE_TTL=86400000

# Maximum number of invoices to cache
# Default: 1000
MAX_CACHE_SIZE=1000
```

## Troubleshooting

### Issue: Always Getting Cached Data

**Solution**: Use `forceRefresh=true` to bypass cache

### Issue: Slow Response Times

**Possible Causes**:

1. Cache miss (first request for this invoice)
2. Government portal is slow
3. AI API is slow

**Solution**: Check `metadata.fromCache` to determine if cache was used

### Issue: Stale Data

**Solution**: Use `forceRefresh=true` to get fresh data, or wait for cache to expire (24 hours)

### Issue: Cache Not Working

**Possible Causes**:

1. `CACHE_TTL` set to 0 (caching disabled)
2. Cache size limit reached
3. Server restart (in-memory cache cleared)

**Solution**: Check environment variables and server logs

## Related Documentation

- [NFE Web Crawler Design](../.kiro/specs/nfe-webcrawler-ai-extraction/design.md)
- [NFE Web Crawler Requirements](../.kiro/specs/nfe-webcrawler-ai-extraction/requirements.md)
- [Task 8 Implementation Summary](../.kiro/specs/nfe-webcrawler-ai-extraction/TASK_8_SUMMARY.md)
