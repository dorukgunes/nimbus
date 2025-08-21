import { contextBridge, ipcRenderer } from 'electron';
import { AWSConnection, NewAWSConnection, LogGroup, LogStream, LogEntry, SavedQuery } from './types/aws';
import {
  CloudWatchLogsClient,
  DescribeLogGroupsCommand,
  DescribeLogStreamsCommand,
} from '@aws-sdk/client-cloudwatch-logs';
import { queryLogsWithFilterExpression } from './helpers/aws/query_helper';
import {
  THEME_MODE_CURRENT_CHANNEL,
  THEME_MODE_DARK_CHANNEL,
  THEME_MODE_LIGHT_CHANNEL,
  THEME_MODE_SYSTEM_CHANNEL,
  THEME_MODE_TOGGLE_CHANNEL,
} from './helpers/ipc/theme/theme-channels';

export type ConnectionAPI = {
  getAllConnections: () => Promise<AWSConnection[]>;
  saveConnection: (connection: NewAWSConnection) => Promise<AWSConnection>;
  updateConnection: (id: string, connection: AWSConnection) => Promise<AWSConnection>;
  deleteConnection: (id: string) => Promise<void>;
  testConnection: (connection: NewAWSConnection) => Promise<boolean>;
  updateLastSelectedLogGroup: (connectionId: string, logGroupName: string) => Promise<AWSConnection>;
  // Saved Queries methods
  saveQuery: (connectionId: string, query: Omit<SavedQuery, 'id' | 'createdAt' | 'updatedAt'>) => Promise<SavedQuery | null>;
  updateQuery: (connectionId: string, queryId: string, query: Partial<Omit<SavedQuery, 'id' | 'createdAt'>>) => Promise<SavedQuery | null>;
  deleteQuery: (connectionId: string, queryId: string) => Promise<boolean>;
  getSavedQueries: (connectionId: string) => Promise<SavedQuery[]>;
};

interface AWSAPI {
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
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld(
  'connectionAPI',
  {
    getAllConnections: () => ipcRenderer.invoke('connection:getAll'),
    saveConnection: (connection: NewAWSConnection) =>
      ipcRenderer.invoke('connection:save', connection),
    updateConnection: (id: string, connection: AWSConnection) =>
      ipcRenderer.invoke('connection:update', id, connection),
    deleteConnection: (id: string) =>
      ipcRenderer.invoke('connection:delete', id),
    testConnection: (connection: NewAWSConnection) =>
      ipcRenderer.invoke('connection:test', connection),
    updateLastSelectedLogGroup: (connectionId: string, logGroupName: string) =>
      ipcRenderer.invoke('connection:updateLastSelectedLogGroup', connectionId, logGroupName),
    // Saved Queries methods
    saveQuery: (connectionId: string, query: Omit<SavedQuery, 'id' | 'createdAt' | 'updatedAt'>) =>
      ipcRenderer.invoke('connection:saveQuery', connectionId, query),
    updateQuery: (connectionId: string, queryId: string, query: Partial<Omit<SavedQuery, 'id' | 'createdAt'>>) =>
      ipcRenderer.invoke('connection:updateQuery', connectionId, queryId, query),
    deleteQuery: (connectionId: string, queryId: string) =>
      ipcRenderer.invoke('connection:deleteQuery', connectionId, queryId),
    getSavedQueries: (connectionId: string) =>
      ipcRenderer.invoke('connection:getSavedQueries', connectionId),
  } as ConnectionAPI
);

contextBridge.exposeInMainWorld('awsAPI', {
  getLogGroups: async (connection: AWSConnection) => {
    const client = new CloudWatchLogsClient({
      region: connection.region,
      credentials: {
        accessKeyId: connection.accessKey,
        secretAccessKey: connection.secretKey,
        sessionToken: connection.sessionToken,
      },
    });

    const command = new DescribeLogGroupsCommand({});
    const response = await client.send(command);
    return response.logGroups?.map((group) => ({
      logGroupName: group.logGroupName || '',
      creationTime: group.creationTime || 0,
      retentionInDays: group.retentionInDays || 0,
    })) || [];
  },
  getLogStreams: async (connection: AWSConnection, logGroupName: string) => {
    const client = new CloudWatchLogsClient({
      region: connection.region,
      credentials: {
        accessKeyId: connection.accessKey,
        secretAccessKey: connection.secretKey,
        sessionToken: connection.sessionToken,
      },
    });

    const command = new DescribeLogStreamsCommand({
      logGroupName: logGroupName,
      orderBy: 'LastEventTime',
      descending: true,
    });
    const response = await client.send(command);
    return response.logStreams?.map((stream) => ({
      logStreamName: stream.logStreamName || '',
      creationTime: stream.creationTime || 0,
      firstEventTimestamp: stream.firstEventTimestamp || 0,
      lastEventTimestamp: stream.lastEventTimestamp || 0,
    })) || [];
  },
  queryLogs: async (
    connection: AWSConnection,
    logGroupName: string,
    logStreamName: string | null,
    query: string,
    dateRange?: { start: Date | null; end: Date | null; raw: string },
    nextToken?: string,
    maxResults?: number
  ) => {
    const result = await queryLogsWithFilterExpression(connection, logGroupName, logStreamName, query, dateRange, nextToken, maxResults);
    return {
      events: result.events.map(event => ({
        ...event,
        logStreamName: logStreamName || '',
      })),
      nextToken: result.nextToken,
      totalFetched: result.totalFetched,
    };
  },
} as AWSAPI);

// Expose theme mode API
contextBridge.exposeInMainWorld('themeMode', {
  current: () => ipcRenderer.invoke(THEME_MODE_CURRENT_CHANNEL),
  toggle: () => ipcRenderer.invoke(THEME_MODE_TOGGLE_CHANNEL),
  dark: () => ipcRenderer.invoke(THEME_MODE_DARK_CHANNEL),
  light: () => ipcRenderer.invoke(THEME_MODE_LIGHT_CHANNEL),
  system: () => ipcRenderer.invoke(THEME_MODE_SYSTEM_CHANNEL),
});
