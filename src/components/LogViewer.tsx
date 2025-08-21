import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import LogViewerDrawer from "./LogViewerDrawer";
import { formatTimestamp } from "@/utils/formatTimestamp";
import { LogFormatterSettings, LogFormatToken } from "./LogFormatter";

interface LogEntry {
  timestamp: number;
  message: string;
  logStreamName: string;
}

interface LogViewerProps {
  logs: LogEntry[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  formatterSettings?: LogFormatterSettings;
}

export const LogViewer: React.FC<LogViewerProps> = ({
  logs,
  isLoading = false,
  onLoadMore,
  hasMore = false,
  formatterSettings,
}) => {
  const [selectedLog, setSelectedLog] = React.useState<LogEntry | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const handleLogClick = (log: LogEntry) => {
    setSelectedLog(log);
    setDrawerOpen(true);
  };

  // Get text size class based on formatter settings
  const getTextSizeClass = () => {
    if (!formatterSettings) return "text-sm";
    
    const size = formatterSettings.textSize;
    if (size < 0.3) return "text-xs";
    if (size < 0.6) return "text-sm";
    if (size < 0.9) return "text-base";
    return "text-lg";
  };

  // Format log line based on formatter settings
  const formatLogLine = (log: LogEntry) => {
    if (!formatterSettings || formatterSettings.lineFormat.length === 0) {
      // Default formatting
      return (
        <div className="flex max-w-screen items-center gap-2">
          <span className="text-muted-foreground w-32 flex-shrink-0 text-xs whitespace-nowrap">
            {formatTimestamp(log.timestamp)}
          </span>
          <span
            className={(() => {
              try {
                const parsed = JSON.parse(log.message);
                switch ((parsed.level || "").toLowerCase()) {
                  case "info":
                    return "font-semibold whitespace-nowrap text-blue-500";
                  case "warning":
                    return "font-semibold whitespace-nowrap text-yellow-500";
                  case "error":
                    return "font-semibold whitespace-nowrap text-red-500";
                  case "debug":
                    return "font-semibold whitespace-nowrap text-gray-500";
                  default:
                    return "text-muted-foreground whitespace-nowrap";
                }
              } catch {
                return "text-muted-foreground whitespace-nowrap";
              }
            })()}
          >
            {(() => {
              try {
                const parsed = JSON.parse(log.message);
                return parsed.level || "-";
              } catch {
                return "-";
              }
            })()}
          </span>
          <span className="w-full min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate">
                {(() => {
                  try {
                    const parsed = JSON.parse(log.message);
                    return parsed.msg || "-";
                  } catch {
                    return log.message;
                  }
                })()}
              </span>
              {(() => {
                // Helper to pick a color from a palette based on userId
                const userColors = [
                  "bg-blue-100 text-blue-800",
                  "bg-green-100 text-green-800",
                  "bg-yellow-100 text-yellow-800",
                  "bg-purple-100 text-purple-800",
                  "bg-pink-100 text-pink-800",
                  "bg-red-100 text-red-800",
                  "bg-indigo-100 text-indigo-800",
                  "bg-teal-100 text-teal-800",
                  "bg-orange-100 text-orange-800",
                  "bg-gray-100 text-gray-800",
                ];
                function getUserId(parsed: Record<string, unknown>) {
                  return (
                    parsed.userId ||
                    parsed.user_id ||
                    parsed.requestUserId ||
                    parsed.request_user_id ||
                    null
                  );
                }
                function getUserColor(userId: string) {
                  // Simple hash to pick a color index
                  let hash = 0;
                  for (let i = 0; i < userId.length; i++) {
                    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
                  }
                  const idx = Math.abs(hash) % userColors.length;
                  return userColors[idx];
                }
                try {
                  const parsed = JSON.parse(log.message);
                  const userId = getUserId(parsed);
                  if (!userId) {
                    return (
                      <span className="text-muted-foreground whitespace-nowrap">
                        -
                      </span>
                    );
                  }
                  const colorClass = getUserColor(String(userId));
                  return (
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 align-middle text-xs font-medium whitespace-nowrap ${colorClass}`}
                      style={{
                        minWidth: "2.5rem",
                        textAlign: "center",
                        height: "1.5rem",
                      }}
                    >
                      {String(userId)}
                    </span>
                  );
                } catch {
                  return (
                    <span className="text-muted-foreground whitespace-nowrap">
                      -
                    </span>
                  );
                }
              })()}
              <span className="truncate text-muted-foreground">
                {(() => {
                  try {
                    const parsed = JSON.parse(log.message);
                    return String(parsed.url ?? parsed.message?.url ?? "-");
                  } catch {
                    return "-";
                  }
                })()}
              </span>
            </div>
          </span>
        </div>
      );
    }

    // Custom formatting based on formatter settings
    const formatToken = (token: LogFormatToken) => {
      switch (token.value) {
        case "%time('D/MMM/YYYY:HH:mm:ss')":
          return formatTimestamp(log.timestamp);
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
          try {
            const parsed = JSON.parse(log.message);
            return parsed.level || "-";
          } catch {
            return "-";
          }
        case "%message":
          return log.message;
        case "%line":
          try {
            const parsed = JSON.parse(log.message);
            return parsed.msg || parsed.message || log.message;
          } catch {
            return log.message;
          }
        default:
          // Handle custom fields
          if (token.type === "custom" && token.customField) {
            try {
              const parsed = JSON.parse(log.message);
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
              return value !== undefined ? String(value) : "-";
            } catch {
              return "-";
            }
          }
          return token.value;
      }
    };

    return (
      <div className="flex max-w-screen items-center gap-2">
        {formatterSettings.lineFormat.map((token, index) => (
          <span
            key={`${token.id}-${index}`}
            className={cn(
              "whitespace-nowrap",
              token.value.startsWith("%time") && "text-muted-foreground w-32 flex-shrink-0 text-xs",
              token.value === "%level" && (() => {
                try {
                  const parsed = JSON.parse(log.message);
                  switch ((parsed.level || "").toLowerCase()) {
                    case "info":
                      return "font-semibold text-blue-500";
                    case "warning":
                      return "font-semibold text-yellow-500";
                    case "error":
                      return "font-semibold text-red-500";
                    case "debug":
                      return "font-semibold text-gray-500";
                    default:
                      return "text-muted-foreground";
                  }
                } catch {
                  return "text-muted-foreground";
                }
              })(),
              token.value === "%line" && "w-full min-w-0 flex-1 truncate",
              token.value === "%app" && "text-muted-foreground",
              token.value === "%source" && "text-muted-foreground"
            )}
          >
            {formatToken(token)}
          </span>
        ))}
      </div>
    );
  };

  // Infinite scroll handler
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const lastElRef = React.useRef<HTMLDivElement | null>(null);
  // Debounce scroll handler to prevent rapid firing
  const scrollTimeout = React.useRef<NodeJS.Timeout | null>(null);
  React.useEffect(() => {
    if (!onLoadMore || !hasMore) return;
    const handleScroll = () => {
      if (scrollTimeout.current) clearTimeout(scrollTimeout.current);
      scrollTimeout.current = setTimeout(() => {
        const el = viewportRef.current;
        if (!el || isLoading || !hasMore) return;
        if (el.scrollHeight - el.scrollTop - el.clientHeight < 100) {
          onLoadMore();
        }
      }, 100);
    };
    const el = viewportRef.current;
    if (el) {
      el.addEventListener("scroll", handleScroll);
      lastElRef.current = el;
    }
    return () => {
      if (lastElRef.current) {
        lastElRef.current.removeEventListener("scroll", handleScroll);
        lastElRef.current = null;
      }
      if (scrollTimeout.current) {
        clearTimeout(scrollTimeout.current);
        scrollTimeout.current = null;
      }
    };
  }, [onLoadMore, hasMore, isLoading]);

  if (isLoading && !logs.length) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2" />
      </div>
    );
  }

  if (!logs.length) {
    return (
      <div className="text-muted-foreground flex h-full items-center justify-center">
        No logs to display
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="scrollbar-stable h-full" viewportRef={viewportRef}>
        <div className={cn("h-full space-y-1", getTextSizeClass())}>
          {logs.map((log, index) => (
            <div
              key={`${log.timestamp}-${index}`}
              className="hover:bg-muted/50 cursor-pointer overflow-x-auto rounded p-0.5 font-mono"
              onClick={() => handleLogClick(log)}
            >
              {formatLogLine(log)}
            </div>
          ))}
          {!hasMore && logs.length > 0 && (
            <div className="text-muted-foreground z-50 flex h-11 items-center justify-center py-2 text-xs">
              No more logs.
            </div>
          )}
        </div>
      </ScrollArea>
      <LogViewerDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        log={selectedLog}
        formatterSettings={formatterSettings}
      />
    </>
  );
};

// Helper function for conditional classes
function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
