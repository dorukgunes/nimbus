export interface LogFormatterSettings {
  textSize: number;
  lineFormat: Array<{
    id: string;
    type: string;
    value: string;
    locked?: boolean;
    customField?: string;
  }>;
  customFields: Record<string, string>; // Maps display name to JSON path
}

export interface LogGroupSettings {
  excludedLogs: string[];
  logFormatter?: LogFormatterSettings;
}

export interface SavedQuery {
  id: string;
  name: string;
  query: string;
  logGroupName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AWSConnection {
  id: string;
  name: string;
  region: string;
  accessKey: string;
  secretKey: string;
  sessionToken?: string;
  createdAt: Date;
  updatedAt: Date;
  logGroupSettings?: Record<string, LogGroupSettings>;
  lastSelectedLogGroup?: string;
  savedQueries?: SavedQuery[];
  status: 'active' | 'expired';
}

export interface NewAWSConnection {
  name: string;
  region: string;
  accessKey: string;
  secretKey: string;
  sessionToken?: string;
}

export interface LogGroup {
  logGroupName: string;
  creationTime: number;
  retentionInDays: number;
}

export interface LogStream {
  logStreamName: string;
  creationTime: number;
  firstEventTimestamp: number;
  lastEventTimestamp: number;
}

export interface LogEntry {
  timestamp: number;
  message: string;
  logStreamName: string;
}

export interface PaginatedLogResult {
  events: LogEntry[];
  nextToken?: string | null;
} 