import React from 'react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { formatTimestamp } from '@/utils/formatTimestamp';
import { LogFormatterSettings, LogFormatToken } from './LogFormatter';

interface LogEntry {
  timestamp: number;
  message: string;
  logStreamName: string;
}

interface LogViewerDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  log: LogEntry | null;
  formatterSettings?: LogFormatterSettings;
}

// Add a simple JSON syntax highlighter
function prettyPrintJson(json: object) {
  const jsonString = JSON.stringify(json, null, 2);
  // Simpler regex to match keys, strings, numbers, booleans, and nulls
  return jsonString.replace(/("[^"]*"(?=\s*:))|("[^"]*")|(\b(true|false|null)\b)|(-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g, (match, key, str) => {
    if (key) return `<span class='text-blue-400'>${key}</span>`; // key
    if (str) return `<span class='text-green-400'>${str}</span>`; // string value
    if (/true|false/.test(match)) return `<span class='text-purple-400'>${match}</span>`; // boolean
    if (/null/.test(match)) return `<span class='text-pink-400'>${match}</span>`; // null
    return `<span class='text-yellow-400'>${match}</span>`; // number
  });
}

// Format log value based on formatter settings
const formatLogValue = (token: LogFormatToken, parsed: Record<string, unknown>, log: LogEntry) => {
  switch (token.value) {
    case "%time('D/MMM/YYYY:HH:mm:ss')":
      return formatTimestamp(log.timestamp, 'dd MMM yyyy, HH:mm:ss');
    case "%time('MMM D HH:mm:ss')":
      return new Date(log.timestamp).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    case "%time('YYYY-MM-DD HH:mm:ss')":
      return new Date(log.timestamp).toLocaleString('en-US', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    case "%time('YYYY-MM-DD HH:mm:ss.SSS')":
      return new Date(log.timestamp).toISOString().replace('T', ' ').replace('Z', '');
    case "%timestamp":
      return log.timestamp.toString();
    case "%level":
      return String(parsed.level ?? '-');
    case "%message":
      return log.message;
    case "%line":
      return String(parsed.msg ?? parsed.message ?? log.message);
    default:
      // Handle custom fields
      if (token.type === "custom" && token.customField) {
        try {
          const keys = token.customField.split('.');
          let value: unknown = parsed;
          for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
              value = (value as Record<string, unknown>)[key];
            } else {
              value = undefined;
              break;
            }
          }
          return value !== undefined ? String(value) : '-';
        } catch {
          return '-';
        }
      }
      return token.value;
  }
};

// Helper function to format time consistently
const formatTimeForDisplay = (timestamp: number) => {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

const LogViewerDrawer: React.FC<LogViewerDrawerProps> = ({ open, onOpenChange, log, formatterSettings }) => {
  return (
    <Drawer open={open} onOpenChange={onOpenChange} direction="right">
      <DrawerContent
        className="
          w-full
          data-[vaul-drawer-direction=right]:!max-w-[40vw]
  
        "
      >
        <DrawerHeader>
          <DrawerTitle>Log Details</DrawerTitle>
          <DrawerClose className="absolute right-4 top-4" />
        </DrawerHeader>
        <div className="p-4 overflow-x-auto">
          {log && (() => {
            let parsed: Record<string, unknown> & { url?: string; message?: { url?: string } } = {};
            try {
              parsed = JSON.parse(log.message);
            } catch { /* ignore JSON parse errors, fallback to empty object */ }
            
            // If we have formatter settings, use them to display the log details
            if (formatterSettings && formatterSettings.lineFormat.length > 0) {
              return (
                <div className="space-y-4">
                  <div className="space-y-2">
                    {formatterSettings.lineFormat.map((token, index) => {
                      let value = formatLogValue(token, parsed, log);
                      let displayName = token.value.replace('%', '');
                      
                      // Special handling for time display to make it more readable
                      if (token.value.startsWith('%time')) {
                        value = formatTimeForDisplay(log.timestamp);
                        displayName = 'Time'; // Show just "Time" for all time tokens
                      }
                      
                      return (
                        <div key={`${token.id}-${index}`} className="flex gap-2 items-start">
                          <span className="text-muted-foreground text-xs capitalize">
                            {displayName}:
                          </span>
                          <span className={`text-xs break-all user-select-text ${
                            token.value === "%level" ? getLevelColor(String(parsed.level ?? '-')) : ''
                          }`} style={{ userSelect: 'text' }}>
                            {value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs mb-1">Full JSON</div>
                    <pre className="text-xs bg-muted rounded p-2 overflow-x-auto user-select-text" style={{ fontFamily: 'monospace', userSelect: 'text' }}
                      dangerouslySetInnerHTML={{ __html: prettyPrintJson(parsed) }}
                    />
                  </div>
                </div>
              );
            }
            
            // Fallback to default display if no formatter settings
            return (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex gap-4 items-center">
                    <span className="text-muted-foreground text-xs w-24">Time:</span>
                    <span className="text-xs">{formatTimeForDisplay(log.timestamp)}</span>
                  </div>
                  <div className="flex gap-4 items-center">
                    <span className="text-muted-foreground text-xs w-24">Level:</span>
                    <span className={`text-xs font-semibold ${getLevelColor(String(parsed.level ?? '-'))}`}>{String(parsed.level ?? '-')}</span>
                  </div>
                  <div className="flex gap-4 items-center">
                    <span className="text-muted-foreground text-xs w-24">Hostname:</span>
                    <span className="text-xs">{String(parsed.hostname ?? '-')}</span>
                  </div>
                  <div className="flex gap-4 items-center">
                    <span className="text-muted-foreground text-xs w-24">User ID:</span>
                    <span className="text-xs">{String(parsed.userId ?? parsed.user_id ?? parsed.requestUserId ?? parsed.request_user_id ?? '-')}</span>
                  </div>
                  <div className="flex gap-4 items-center">
                    <span className="text-muted-foreground text-xs w-24">URL:</span>
                    <span className="text-xs">{String(parsed.url ?? parsed.message?.url ?? '-')}</span>
                  </div>
                  <div className="flex gap-4 items-start">
                    <span className="text-muted-foreground text-xs w-24">Message:</span>
                    <span className="text-xs whitespace-pre-line break-all user-select-text" style={{ userSelect: 'text' }}>{String(parsed.msg ?? log.message)}</span>
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground text-xs mb-1">Full JSON</div>
                  <pre className="text-xs bg-muted rounded p-2 overflow-x-auto user-select-text" style={{ fontFamily: 'monospace', userSelect: 'text' }}
                    dangerouslySetInnerHTML={{ __html: prettyPrintJson(parsed) }}
                  />
                </div>
              </div>
            );
          })()}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

// Helper function to get level color
const getLevelColor = (level: string) => {
  const levelLower = level.toLowerCase();
  switch (levelLower) {
    case 'info':
      return 'text-blue-500';
    case 'warning':
      return 'text-yellow-500';
    case 'error':
      return 'text-red-500';
    case 'debug':
      return 'text-gray-500';
    default:
      return 'text-muted-foreground';
  }
};

export default LogViewerDrawer;
