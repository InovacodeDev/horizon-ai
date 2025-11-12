/**
 * Appwrite Function: Expire Invitations
 *
 * This function automatically marks old pending invitations as expired.
 *
 * Triggers:
 * - Schedule: Daily at 00:00 (cron: 0 0 * * *)
 *
 * Functionality:
 * 1. Queries all pending invitations with expiration dates in the past
 * 2. Updates their status to "expired"
 * 3. Returns count of expired invitations
 */
import { Client, Databases, Query } from 'node-appwrite';

// Types
interface Invitation {
  $id: string;
  user_id: string;
  email: string;
  status: string;
  expires_at: string;
  created_at: string;
  updated_at: string;
}

// Configuration
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || 'horizon_ai_db';
const INVITATIONS_COLLECTION = 'sharing_invitations';

/**
 * Initialize Appwrite client
 */
function initializeClient(): { client: Client; databases: Databases } {
  const client = new Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT || 'https://cloud.appwrite.io/v1')
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID || '')
    .setKey(process.env.APPWRITE_API_KEY || '');

  const databases = new Databases(client);

  return { client, databases };
}

/**
 * Expire old invitations with pagination support
 */
async function expireOldInvitations(databases: Databases): Promise<number> {
  console.log('[ExpireInvitations] Starting expiration process');

  const now = new Date().toISOString();
  let expiredCount = 0;
  let offset = 0;
  const limit = 100;

  while (true) {
    try {
      // Query pending invitations with expired dates
      const result = await databases.listDocuments(DATABASE_ID, INVITATIONS_COLLECTION, [
        Query.equal('status', 'pending'),
        Query.lessThan('expires_at', now),
        Query.limit(limit),
        Query.offset(offset),
      ]);

      console.log(`[ExpireInvitations] Found ${result.documents.length} expired invitations in batch`);

      if (result.documents.length === 0) {
        break;
      }

      // Update each invitation to expired status
      for (const invitation of result.documents) {
        try {
          await databases.updateDocument(DATABASE_ID, INVITATIONS_COLLECTION, invitation.$id, {
            status: 'expired',
            updated_at: new Date().toISOString(),
          });
          expiredCount++;
          console.log(`[ExpireInvitations] Expired invitation ${invitation.$id}`);
        } catch (error) {
          console.error(`[ExpireInvitations] Error expiring invitation ${invitation.$id}:`, error);
        }
      }

      // Check if we've processed all documents
      if (result.documents.length < limit) {
        break;
      }

      offset += limit;
    } catch (error) {
      console.error('[ExpireInvitations] Error querying invitations:', error);
      throw error;
    }
  }

  console.log(`[ExpireInvitations] Total invitations expired: ${expiredCount}`);
  return expiredCount;
}

/**
 * Main function
 */
export default async ({ req, res, log, error }: any) => {
  try {
    log('Expire Invitations Function started');
    log(`Request method: ${req.method}`);
    log(`Execution type: ${req.headers['x-appwrite-trigger'] || 'manual'}`);

    const { databases } = initializeClient();

    // Expire old invitations
    const expiredCount = await expireOldInvitations(databases);

    return res.json({
      success: true,
      message: `Successfully expired ${expiredCount} invitation(s)`,
      expiredCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    error('Expire Invitations Function error:', err);
    return res.json(
      {
        success: false,
        error: err.message || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      },
      500,
    );
  }
};
