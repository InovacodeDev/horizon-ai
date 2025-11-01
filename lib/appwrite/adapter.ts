import { Databases, ID, TablesDB } from 'node-appwrite';

/**
 * A lightweight adapter that exposes the legacy Databases method names
 * (createDocument, listDocuments, getDocument, updateDocument, deleteDocument)
 * but delegates to TablesDB's object-parameter API when available.
 */
export class AppwriteDBAdapter {
  private databases: TablesDB;

  constructor(databases: TablesDB) {
    this.databases = databases;
  }

  /**
   * Check if TablesDB is being used
   */
  public usingTablesDB(): boolean {
    return true;
  }

  // listDocuments -> listRows
  async listDocuments(databaseId: string, collectionId: string, queries?: any) {
    try {
      console.log(`[Adapter] listRows called with databaseId: ${databaseId}, tableId: ${collectionId}`);
      const res = await this.databases.listRows({
        databaseId,
        tableId: collectionId,
        queries,
      });
      return { documents: res.rows, total: res.total };
    } catch (error) {
      console.error(`Error listing documents from ${collectionId}:`, error);
      throw error;
    }
  }

  // getDocument -> getRow
  async getDocument(databaseId: string, collectionId: string, documentId: string) {
    try {
      const res = await this.databases.getRow({
        databaseId,
        tableId: collectionId,
        rowId: documentId,
      });
      return res;
    } catch (error) {
      console.error(`Error getting document ${documentId} from ${collectionId}:`, error);
      throw error;
    }
  }

  // createDocument -> createRow
  async createDocument(
    databaseId: string,
    collectionId: string,
    documentId: string,
    data: any,
    permissions?: string[],
  ) {
    try {
      const rowId = documentId || ID.unique();
      const res = await this.databases.createRow({
        databaseId,
        tableId: collectionId,
        rowId,
        data,
        permissions,
      });
      return res;
    } catch (error) {
      console.error(`Error creating document in ${collectionId}:`, error);
      throw error;
    }
  }

  // updateDocument -> updateRow
  async updateDocument(
    databaseId: string,
    collectionId: string,
    documentId: string,
    data: any,
    permissions?: string[],
  ) {
    try {
      const res = await this.databases.updateRow({
        databaseId,
        tableId: collectionId,
        rowId: documentId,
        data,
        permissions,
      });
      return res;
    } catch (error) {
      console.error(`Error updating document ${documentId} in ${collectionId}:`, error);
      throw error;
    }
  }

  // deleteDocument -> deleteRow
  async deleteDocument(databaseId: string, collectionId: string, documentId: string) {
    try {
      const res = await this.databases.deleteRow({
        databaseId,
        tableId: collectionId,
        rowId: documentId,
      });
      return res;
    } catch (error) {
      console.error(`Error deleting document ${documentId} from ${collectionId}:`, error);
      throw error;
    }
  }
}

export default AppwriteDBAdapter;
