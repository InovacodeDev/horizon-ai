# Cache Manager Implementation

## Overview

Implemented a complete LRU (Least Recently Used) cache manager for the NFe Web Crawler system with TTL support, cache metadata, and statistics tracking.

## Features Implemented

### Task 5.1: LRU Cache with Core Methods ✅

- **get(key)**: Retrieve cached data, returns null if expired or not found
- **set(key, data, ttl)**: Store data with optional TTL (default 24 hours)
- **clear(key)**: Remove specific cache entry
- **has(key)**: Check if key exists and is not expired
- **LRU Eviction**: Automatically evicts least recently used items when max size (1000) is reached
- **TTL Support**: Automatic expiration after 24 hours (configurable)
- **Max Size Limit**: 1000 invoices maximum (configurable)

### Task 5.2: Cache Metadata ✅

- **getWithMetadata(key)**: Returns data with cache hit/miss information and timestamp

  ```typescript
  {
    data: T | null,
    fromCache: boolean,
    cachedAt?: Date
  }
  ```

- **setAndGetMetadata(key, data, ttl)**: Sets data and returns metadata for responses

  ```typescript
  {
    fromCache: false,
    cachedAt: Date
  }
  ```

- **getMetadata(key)**: Get cache metadata including cachedAt and expiresAt timestamps

- **Force-refresh support**: Clear cache entry before fetching new data
  ```typescript
  if (forceRefresh) {
    cacheManager.clear(invoiceKey);
  }
  ```

## Additional Features

### Statistics Tracking

- **getStats()**: Returns cache performance metrics
  - size: Current number of cached items
  - hits: Number of cache hits
  - misses: Number of cache misses
  - hitRate: Hit rate percentage (hits / total requests)

### Utility Methods

- **clearAll()**: Clear entire cache
- **keys()**: Get all cached invoice keys
- **getMetadata(key)**: Get cache entry metadata

## Architecture

### LRU Implementation

Uses a doubly-linked list combined with a Map for O(1) operations:

- **Head**: Most recently used item
- **Tail**: Least recently used item (evicted first)
- **Map**: Fast key lookup

### Data Structure

```typescript
interface CacheNode<T> {
  key: string;
  entry: CacheEntry<T>;
  prev: CacheNode<T> | null;
  next: CacheNode<T> | null;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}
```

## Usage Examples

### Basic Usage

```typescript
import { cacheManager } from './cache-manager';

// Store invoice
cacheManager.set('44-digit-key', parsedInvoice);

// Retrieve invoice
const invoice = cacheManager.get('44-digit-key');
```

### With Metadata (for API responses)

```typescript
const { data, fromCache, cachedAt } = cacheManager.getWithMetadata(invoiceKey);

return {
  success: true,
  data,
  metadata: {
    fromCache,
    cachedAt,
  }
};
```

### Force Refresh

```typescript
async function parseInvoice(url: string, forceRefresh: boolean = false) {
  const invoiceKey = await extractKey(url);

  // Bypass cache if force refresh
  if (forceRefresh) {
    cacheManager.clear(invoiceKey);
  }

  // Check cache first
  const cached = cacheManager.get(invoiceKey);
  if (cached) {
    return cached;
  }

  // Parse and cache
  const parsed = await parseFromUrl(url);
  cacheManager.set(invoiceKey, parsed);

  return parsed;
}
```

### Monitor Performance

```typescript
const stats = cacheManager.getStats();
console.log(`Cache size: ${stats.size}/${MAX_CACHE_SIZE}`);
console.log(`Hit rate: ${(stats.hitRate * 100).toFixed(2)}%`);
console.log(`Hits: ${stats.hits}, Misses: ${stats.misses}`);
```

## Configuration

Default configuration from constants:

- **MAX_CACHE_SIZE**: 1000 invoices
- **DEFAULT_CACHE_TTL**: 24 hours (86400000 ms)
- **CACHE_KEY_PREFIX**: 'parsed_invoice:'

Custom configuration:

```typescript
const customCache = new CacheManager(
  500, // Max 500 items
  3600000, // 1 hour TTL
);
```

## Integration Points

The cache manager is ready to be integrated into:

1. **Invoice Parser Service** (Task 6): Main orchestrator will use cache
2. **API Endpoints** (Task 8): Will return cache metadata in responses
3. **Monitoring** (Task 9): Will log cache statistics

## Requirements Satisfied

✅ **Requirement 5.1**: Cache successfully parsed invoices using invoice key
✅ **Requirement 5.2**: Set cache TTL to 24 hours
✅ **Requirement 5.3**: Return cached data without re-crawling/re-parsing
✅ **Requirement 5.4**: Include cache metadata in responses (fromCache, cachedAt)
✅ **Requirement 5.5**: Support force-refresh parameter to bypass cache

## Next Steps

The cache manager is complete and ready for integration in:

- Task 6: Update Invoice Parser Service to use cache
- Task 8: Update API endpoint to support force-refresh parameter
- Task 9: Add logging for cache hit/miss rates
