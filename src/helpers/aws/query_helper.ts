import { AWSConnection } from "@/types/aws";
import { CloudWatchLogsClient, FilterLogEventsCommand } from "@aws-sdk/client-cloudwatch-logs";

export const queryLogsWithFilterExpression = async (
    connection: AWSConnection,
    logGroupName: string,
    logStreamName: string | null,
    filterExpression: string,
    dateRange?: { start: Date | null; end: Date | null; raw: string },
    nextToken?: string,
    maxResults: number = 100
  ) => {
    const client = new CloudWatchLogsClient({
      region: connection.region,
      credentials: {
        accessKeyId: connection.accessKey,
        secretAccessKey: connection.secretKey,
        sessionToken: connection.sessionToken,
      },
    });

    const allEvents: Array<{ timestamp: number; message: string }> = [];
    let currentNextToken = nextToken;
    let totalFetched = 0;

    do {
      const command = new FilterLogEventsCommand({
        logGroupName,
        logStreamNames: logStreamName ? [logStreamName] : undefined,
        startTime: dateRange?.start ? dateRange.start.getTime() : undefined,
        endTime: dateRange?.end ? dateRange.end.getTime() : undefined,
        filterPattern: filterExpression,
        nextToken: currentNextToken,
        limit: Math.min(100, maxResults - totalFetched), // Don't exceed maxResults
      });

      const response = await client.send(command);
      
      const events = response.events?.map((event) => ({
        timestamp: event.timestamp || 0,
        message: event.message || '',
      })) || [];

      allEvents.push(...events);
      totalFetched += events.length;
      currentNextToken = response.nextToken;

      console.log("after loop", currentNextToken, totalFetched, maxResults)

      // If no more events or we've hit the limit, break
      if (!currentNextToken || totalFetched >= maxResults) {
        break;
      }
    } while (currentNextToken !== undefined && totalFetched < maxResults);

    return {
      events: allEvents,
      nextToken: currentNextToken || null,
      totalFetched,
    };
  };