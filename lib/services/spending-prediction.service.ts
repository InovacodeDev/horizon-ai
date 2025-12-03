import { getAppwriteDatabases } from '@/lib/appwrite/client';
import { COLLECTIONS, DATABASE_ID, SpendingPredictionDB } from '@/lib/appwrite/schema';
import { ID, Query } from 'node-appwrite';

export class SpendingPredictionService {
  private dbAdapter: any;

  constructor() {
    this.dbAdapter = getAppwriteDatabases();
  }

  /**
   * Get the latest prediction for a specific category and month
   */
  async getPrediction(userId: string, category: string, month: string): Promise<SpendingPredictionDB | null> {
    try {
      const response = await this.dbAdapter.listDocuments(DATABASE_ID, COLLECTIONS.SPENDING_PREDICTIONS, [
        Query.equal('user_id', userId),
        Query.equal('category', category),
        Query.equal('month', month),
        Query.orderDesc('created_at'),
        Query.limit(1),
      ]);

      if (response.documents.length > 0) {
        return response.documents[0] as SpendingPredictionDB;
      }
      return null;
    } catch (error) {
      console.error(`Failed to get prediction for ${category} in ${month}:`, error);
      return null;
    }
  }

  /**
   * Save a new spending prediction
   */
  async savePrediction(data: {
    userId: string;
    category: string;
    predictedAmount: number;
    confidence: number;
    month: string;
    reasoning?: string;
    metadata?: string;
  }): Promise<SpendingPredictionDB> {
    try {
      const doc = await this.dbAdapter.createDocument(DATABASE_ID, COLLECTIONS.SPENDING_PREDICTIONS, ID.unique(), {
        user_id: data.userId,
        category: data.category,
        predicted_amount: data.predictedAmount,
        confidence: data.confidence,
        month: data.month,
        calculated_at: new Date().toISOString(),
        reasoning: data.reasoning,
        metadata: data.metadata,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return doc as SpendingPredictionDB;
    } catch (error) {
      console.error('Failed to save spending prediction:', error);
      throw error;
    }
  }
}
