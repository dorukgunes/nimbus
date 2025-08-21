import { AWSConnection, LogGroup, LogStream, LogEntry, NewAWSConnection, SavedQuery } from './aws';

declare global {
  interface Window {
    connectionAPI: {
      getAllConnections: () => Promise<AWSConnection[]>;
      saveConnection: (connection: NewAWSConnection) => Promise<AWSConnection>;
      updateConnection: (id: string, connection: Partial<AWSConnection>) => Promise<AWSConnection>;
      deleteConnection: (id: string) => Promise<void>;
      testConnection: (connection: NewAWSConnection) => Promise<boolean>;
      updateLastSelectedLogGroup: (connectionId: string, logGroupName: string) => Promise<AWSConnection>;
      // Saved Queries methods
      saveQuery: (connectionId: string, query: Omit<SavedQuery, 'id' | 'createdAt' | 'updatedAt'>) => Promise<SavedQuery | null>;
      updateQuery: (connectionId: string, queryId: string, query: Partial<Omit<SavedQuery, 'id' | 'createdAt'>>) => Promise<SavedQuery | null>;
      deleteQuery: (connectionId: string, queryId: string) => Promise<boolean>;
      getSavedQueries: (connectionId: string) => Promise<SavedQuery[]>;
    };
    awsAPI: {
      getLogGroups: (connection: AWSConnection) => Promise<LogGroup[]>;
      getLogStreams: (connection: AWSConnection, logGroupName: string) => Promise<LogStream[]>;
      queryLogs: (
        connection: AWSConnection,
        logGroupName: string,
        logStreamName: string | null,
        query: string,
        dateRange?: { start: Date | null; end: Date | null; raw: string },
        nextToken?: string,
        maxResults?: number
      ) => Promise<{ nextToken?: string | null; events: LogEntry[]; totalFetched: number }>;
    };
  }
} 