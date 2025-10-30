/**
 * Exemplo de uso do hook useAppwriteRealtime
 * 
 * Este arquivo demonstra como usar o hook genérico de realtime
 * para subscrever a eventos de uma coleção específica.
 */

'use client';

import { useAppwriteRealtime } from '@/hooks/useAppwriteRealtime';
import { useState } from 'react';

interface MyDocument {
  $id: string;
  name: string;
  value: number;
  $createdAt: string;
  $updatedAt: string;
}

export function RealtimeExample() {
  const [documents, setDocuments] = useState<MyDocument[]>([]);
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const collectionId = 'my_collection';

  // Exemplo 1: Usando callbacks específicos
  useAppwriteRealtime<MyDocument>({
    channels: [`databases.${databaseId}.collections.${collectionId}.documents`],
    onCreate: (payload) => {
      console.log('Novo documento criado:', payload);
      setDocuments((prev) => [...prev, payload]);
    },
    onUpdate: (payload) => {
      console.log('Documento atualizado:', payload);
      setDocuments((prev) =>
        prev.map((doc) => (doc.$id === payload.$id ? payload : doc))
      );
    },
    onDelete: (payload) => {
      console.log('Documento deletado:', payload);
      setDocuments((prev) => prev.filter((doc) => doc.$id !== payload.$id));
    },
  });

  // Exemplo 2: Usando callback genérico
  useAppwriteRealtime({
    channels: [`databases.${databaseId}.collections.${collectionId}.documents`],
    onMessage: (message) => {
      console.log('Evento recebido:', message);
      // Processar manualmente baseado no tipo de evento
      if (message.events.some((e) => e.includes('.create'))) {
        // Lógica para criação
      }
    },
  });

  // Exemplo 3: Subscrever a múltiplos canais
  useAppwriteRealtime({
    channels: [
      `databases.${databaseId}.collections.collection1.documents`,
      `databases.${databaseId}.collections.collection2.documents`,
    ],
    onMessage: (message) => {
      console.log('Evento de múltiplos canais:', message);
    },
  });

  // Exemplo 4: Subscrever a um documento específico
  const documentId = 'specific-doc-id';
  useAppwriteRealtime({
    channels: [
      `databases.${databaseId}.collections.${collectionId}.documents.${documentId}`,
    ],
    onUpdate: (payload) => {
      console.log('Documento específico atualizado:', payload);
    },
  });

  // Exemplo 5: Desabilitar realtime condicionalmente
  const [realtimeEnabled, setRealtimeEnabled] = useState(true);
  
  useAppwriteRealtime({
    channels: [`databases.${databaseId}.collections.${collectionId}.documents`],
    enabled: realtimeEnabled,
    onCreate: (payload) => {
      console.log('Criado:', payload);
    },
  });

  return (
    <div>
      <h1>Realtime Example</h1>
      <button onClick={() => setRealtimeEnabled(!realtimeEnabled)}>
        {realtimeEnabled ? 'Desabilitar' : 'Habilitar'} Realtime
      </button>
      
      <div>
        <h2>Documentos ({documents.length})</h2>
        <ul>
          {documents.map((doc) => (
            <li key={doc.$id}>
              {doc.name} - {doc.value}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * Padrões de Canais do Appwrite
 * 
 * 1. Todos os documentos de uma coleção:
 *    databases.{databaseId}.collections.{collectionId}.documents
 * 
 * 2. Documento específico:
 *    databases.{databaseId}.collections.{collectionId}.documents.{documentId}
 * 
 * 3. Todos os documentos de um banco:
 *    databases.{databaseId}.collections.*.documents
 * 
 * 4. Todos os bancos:
 *    databases.*.collections.*.documents
 * 
 * 5. Eventos de autenticação:
 *    account
 *    account.sessions
 *    account.sessions.{sessionId}
 * 
 * 6. Eventos de storage:
 *    buckets.{bucketId}.files
 *    buckets.{bucketId}.files.{fileId}
 */

/**
 * Tipos de Eventos
 * 
 * - databases.{databaseId}.collections.{collectionId}.documents.*.create
 * - databases.{databaseId}.collections.{collectionId}.documents.*.update
 * - databases.{databaseId}.collections.{collectionId}.documents.*.delete
 */
