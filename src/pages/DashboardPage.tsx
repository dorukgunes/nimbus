import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { AWSConnection, SavedQuery, LogFormatterSettings } from "@/types/aws";
import { toast } from "sonner";
import { CloudWatchQueryInput } from "@/components/CloudWatchQueryInput";
import { LogViewer } from "@/components/LogViewer";
import { DashboardFooter } from "@/components/DashboardFooter";
import { SettingsDialog } from "@/components/SettingsDialog";


interface LogGroup {
  logGroupName: string;
  creationTime: number;
  retentionInDays: number;
}

interface LogEntry {
  timestamp: number;
  message: string;
  logStreamName: string;
}

export const DashboardPage: React.FC = () => {
  const { connectionId } = useParams<{ connectionId: string }>();
  const [connection, setConnection] = useState<AWSConnection | null>(null);
  const [logGroups, setLogGroups] = useState<LogGroup[]>([]);
  const [selectedLogGroup, setSelectedLogGroup] = useState<string | null>(null);
  const [selectedLogStream] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [nextToken, setNextToken] = useState<string | null>(null);
  const [lastQuery, setLastQuery] = useState<string>('');
  const [lastDateRange, setLastDateRange] = useState<{ start: Date | null; end: Date | null; raw: string } | undefined>(undefined);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([]);
  const [logFormatterSettings, setLogFormatterSettings] = useState<LogFormatterSettings>({
    textSize: 0.5,
    lineFormat: [
      { id: "time-default", type: "time", value: "%time('D/MMM/YYYY:HH:mm:ss')" },
      { id: "level", type: "field", value: "%level" },
      { id: "line", type: "field", value: "%line", locked: true },
    ],
    customFields: {},
  });

  const loadLogGroups = async (connection: AWSConnection) => {
    try {
      const groups = await window.awsAPI.getLogGroups(connection);
      setLogGroups(groups);
    } catch (error) {
      toast.error(`Failed to load log groups: ${error}`);
    }
  };

  const loadSavedQueries = async () => {
    if (!connectionId) return;
    try {
      const queries = await window.connectionAPI.getSavedQueries(connectionId);
      setSavedQueries(queries);
    } catch (error) {
      console.error('Failed to load saved queries:', error);
    }
  };

  useEffect(() => {
    const loadConnectionAndLogGroups = async () => {
      try {
        // Load connection details
        const connections = await window.connectionAPI.getAllConnections();
        const currentConnection = connections.find(
          (c) => c.id === connectionId,
        );
        if (!currentConnection) {
          toast.error("Connection not found");
          return;
        }
        setConnection(currentConnection);

        // Load log groups
        await loadLogGroups(currentConnection);
        
        // Auto-select the last selected log group if it exists
        if (currentConnection.lastSelectedLogGroup) {
          setSelectedLogGroup(currentConnection.lastSelectedLogGroup);
        }
      } catch (error) {
        toast.error(`Failed to load dashboard data ${error}`);
      }
    };

    loadConnectionAndLogGroups();
  }, [connectionId]);

  useEffect(() => {
    loadSavedQueries();
  }, [connectionId]);

  // Update formatter settings when selected log group changes
  useEffect(() => {
    if (selectedLogGroup) {
      const settings = loadLogFormatterSettings(selectedLogGroup);
      setLogFormatterSettings(settings);
    }
  }, [selectedLogGroup, connection]);

  const handleLogGroupSelect = async (logGroupName: string) => {
    try {
      if (!connection) return [];
      
      // Clear existing logs when switching log groups
      setLogs([]);
      setNextToken(null);
      setLastQuery('');
      setLastDateRange(undefined);
      setIsLoadingLogs(false);
      
      setSelectedLogGroup(logGroupName);
      
      // Save the selected log group to the connection
      await window.connectionAPI.updateLastSelectedLogGroup(connection.id, logGroupName);
      
      const streams = await window.awsAPI.getLogStreams(
        connection,
        logGroupName,
      );
      return streams;
    } catch (error) {
      toast.error(`Failed to load log streams: ${error}`);
      return [];
    }
  };

  const handleExecuteQuery = async (query: string, dateRange?: { start: Date | null; end: Date | null; raw: string }) => {
    if (!connection || !selectedLogGroup) return;
    setIsLoadingLogs(true);
    setLogs([]);
    setNextToken(null);
    setLastQuery(query);
    setLastDateRange(dateRange);
    try {
      const result = await window.awsAPI.queryLogs(
        connection,
        selectedLogGroup,
        selectedLogStream, // This will be null when querying all streams in a group
        query,
        dateRange,
        undefined
      );
      setLogs(result.events);
      setNextToken(result.nextToken || null);
    } catch (error) {
      if (error instanceof Error && error.message.includes('The security token included in the request is expired')) {
        toast.error('Your AWS credentials have expired. Please refresh them.');
        window.connectionAPI.updateConnection(connectionId!, { status: 'expired' });
      } else {
        toast.error(`Failed to execute query: ${error}`);
      }
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleLoadMore = async () => {
    if (!connection || !selectedLogGroup || !nextToken || isLoadingLogs) return;
    setIsLoadingLogs(true);
    try {
      const result = await window.awsAPI.queryLogs(
        connection,
        selectedLogGroup,
        selectedLogStream,
        lastQuery,
        lastDateRange,
        nextToken,
        500
      );
      setLogs((prev) => [...prev, ...(result.events || [])]);
      setNextToken(result.nextToken || null);
    } catch (error) {
      toast.error(`Failed to load more logs: ${error}`);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const handleSaveQuery = async (query: Omit<SavedQuery, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!connectionId) return null;
    try {
      const savedQuery = await window.connectionAPI.saveQuery(connectionId, query);
      if (savedQuery) {
        await loadSavedQueries(); // Refresh the saved queries list
      }
      return savedQuery;
    } catch (error) {
      console.error('Failed to save query:', error);
      return null;
    }
  };

  const handleUpdateQuery = async (queryId: string, query: Omit<SavedQuery, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!connectionId) return null;
    try {
      const updatedQuery = await window.connectionAPI.updateQuery(connectionId, queryId, query);
      if (updatedQuery) {
        await loadSavedQueries(); // Refresh the saved queries list
      }
      return updatedQuery;
    } catch (error) {
      console.error('Failed to update query:', error);
      return null;
    }
  };

  const handleDeleteQuery = async (queryId: string) => {
    if (!connectionId) return false;
    try {
      const success = await window.connectionAPI.deleteQuery(connectionId, queryId);
      if (success) {
        await loadSavedQueries(); // Refresh the saved queries list
      }
      return success;
    } catch (error) {
      console.error('Failed to delete query:', error);
      return false;
    }
  };

  const handleSaveSettings = async (logGroupName: string, settings: LogFormatterSettings) => {
    if (!connection) return;
    
    try {
      // Update local state
      setLogFormatterSettings(settings);
      
      // Save settings to the connection
      const currentLogGroupSettings = connection.logGroupSettings?.[logGroupName] || { excludedLogs: [] };
      const updatedConnection = {
        ...connection,
        logGroupSettings: {
          ...connection.logGroupSettings,
          [logGroupName]: {
            ...currentLogGroupSettings,
            logFormatter: settings,
          }
        }
      };
      
      // Update the connection in the database
      await window.connectionAPI.updateConnection(connection.id, updatedConnection);
      
      // Update local connection state
      setConnection(updatedConnection);
      
      toast.success(`Settings saved for ${logGroupName}`);
    } catch (error) {
      toast.error(`Failed to save settings: ${error}`);
    }
  };

  const loadLogFormatterSettings = (logGroupName: string) => {
    if (!connection?.logGroupSettings?.[logGroupName]?.logFormatter) {
      // Use default settings if none exist
      return {
        textSize: 0.5,
        lineFormat: [
          { id: "time-default", type: "time", value: "%time('D/MMM/YYYY:HH:mm:ss')" },
          { id: "level", type: "field", value: "%level" },
          { id: "line", type: "field", value: "%line", locked: true },
        ],
        customFields: {},
      };
    }
    
    return connection.logGroupSettings[logGroupName].logFormatter;
  };

  const handleOpenSettings = (logGroupName: string) => {
    setSelectedLogGroup(logGroupName);
    // Load existing settings for this log group
    const existingSettings = loadLogFormatterSettings(logGroupName);
    setLogFormatterSettings(existingSettings);
    setSettingsOpen(true);
  };

  if (!connection) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-full pb-4">
      <div className="flex bg-background min-w-0 flex-1 flex-col pt-4">
        <div className="flex min-h-0 flex-1 flex-col px-6 pb-6 gap-2">
          
          <div className="min-h-0 flex-1">       
              <LogViewer 
                logs={logs} 
                isLoading={isLoadingLogs} 
                onLoadMore={handleLoadMore} 
                hasMore={!!nextToken}
                formatterSettings={selectedLogGroup ? loadLogFormatterSettings(selectedLogGroup) : logFormatterSettings}
              />
          </div>
   
          <CloudWatchQueryInput
            onExecuteQuery={handleExecuteQuery}
            isLoading={isLoadingLogs}
            logGroups={logGroups}
            selectedLogGroup={selectedLogGroup}
            onLogGroupSelect={handleLogGroupSelect}
            connectionId={connectionId}
            savedQueries={savedQueries}
            onSaveQuery={handleSaveQuery}
            onUpdateQuery={handleUpdateQuery}
            onDeleteQuery={handleDeleteQuery}
            onOpenSettings={handleOpenSettings}
          />         
        </div>
      </div>
      <DashboardFooter
        connection={connection}
      />
      <SettingsDialog 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen}
        connection={connection}
        logGroupName={selectedLogGroup}
        onSaveSettings={handleSaveSettings}
        sampleLogs={logs.slice(0, 10)} // Pass first 10 logs for field discovery
      />
    </div>
  );
};
