# Shopping List Processor Function

Appwrite function that processes async queue for AI shopping list generation.

## Trigger

- **Schedule**: Every 1 minute (`* * * * *`)
- **Manual**: Can be triggered manually via Appwrite Console

## Environment Variables Required

```bash
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_FUNCTION_PROJECT_ID=<project-id>
APPWRITE_API_KEY=<api-key-with-database-permissions>
APPWRITE_DATABASE_ID=horizon_ai_db
GEMINI_API_KEY=<google-gemini-api-key>
```

## Logic Flow

1. Query `shopping_list_requests` where `status='pending'`
2. Process up to 3 requests per execution (to avoid timeouts)
3. For each request:
   - Update status to `'generating'`
   - Fetch user's invoice history for the category (last N months)
   - Call Google Gemini AI to generate intelligent shopping list
   - Create `shopping_list` and `shopping_list_items`
   - Update request status to `'completed'` with `shopping_list_id`
   - Create `notification` for user (success)
4. On error:
   - Update request status to `'error'` with `error_message`
   - Create `notification` for user (error)

## AI Logic

The function uses the same consumption pattern analysis as the GoogleAIService:

- Calculates average days between purchases
- Determines if product needs replenishment (80% of cycle passed)
- Suggests quantity based on average quantity per purchase
- Filters out recently purchased items (<50% of cycle)

## Deployment

From Appwrite Console:

1. Create new function: "shopping-list-processor"
2. Runtime: Node.js 20
3. Schedule: `* * * * *` (every minute)
4. Upload code from `functions/shopping-list-processor/`
5. Set environment variables
6. Deploy

## Monitoring

Check function logs in Appwrite Console for:

- Number of pending requests found
- Processing status for each request
- Errors and failures
- Success confirmations
