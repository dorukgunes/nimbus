import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/tailwind";
import {
  Search,
  Loader2,
  ChevronDown,
  X,
  Save,
  Bookmark,
  Play,
  Settings,
  Check,
} from "lucide-react";
import { NaturalLanguageDatePicker } from "./NaturalLanguageDatePicker";
import { Button } from "@/components/ui/button";
import { LogGroup, SavedQuery } from "@/types/aws";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface CloudWatchQueryInputProps {
  onExecuteQuery: (
    query: string,
    dateRange?: { start: Date | null; end: Date | null; raw: string },
  ) => void;
  isLoading?: boolean;
  logGroups?: LogGroup[];
  selectedLogGroup?: string | null;
  onLogGroupSelect?: (logGroupName: string) => void;
  connectionId?: string;
  savedQueries?: SavedQuery[];
  onSaveQuery?: (
    query: Omit<SavedQuery, "id" | "createdAt" | "updatedAt">,
  ) => Promise<SavedQuery | null>;
  onUpdateQuery?: (
    queryId: string,
    query: Omit<SavedQuery, "id" | "createdAt" | "updatedAt">,
  ) => Promise<SavedQuery | null>;
  onDeleteQuery?: (queryId: string) => Promise<boolean>;
  onOpenSettings?: (logGroupName: string) => void;
}

export const CloudWatchQueryInput: React.FC<CloudWatchQueryInputProps> = ({
  onExecuteQuery,
  isLoading = false,
  logGroups = [],
  selectedLogGroup,
  onLogGroupSelect,
  connectionId,
  savedQueries = [],
  onSaveQuery,
  onUpdateQuery,
  onDeleteQuery,
  onOpenSettings,
}) => {
  const [query, setQuery] = useState("");
  const [dateRange, setDateRange] = useState<{
    start: Date | null;
    end: Date | null;
    raw: string;
  }>({ start: null, end: null, raw: "last 2 hours" });
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [queryName, setQueryName] = useState("");
  const [editingQueryId, setEditingQueryId] = useState<string | null>(null);

  // Reset editingQueryId when query becomes empty
  useEffect(() => {
    if (!query.trim()) {
      setEditingQueryId(null);
      setQueryName("");
    }
  }, [query]);

  const handleExecute = () => {
    onExecuteQuery(query.trim(), dateRange);
  };

  const handleDateRangeChange = (
    range: { start: Date | null; end: Date | null },
    raw: string,
  ) => {
    const newDateRange = { ...range, raw };
    setDateRange(newDateRange);
  };

  const handleDateRangeEnter = () => {
    onExecuteQuery(query.trim(), dateRange);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleExecute();
    }
  };

  const handleSaveQuery = async () => {
    if (!query.trim() || !queryName.trim() || !onSaveQuery) return;

    try {
      let savedQuery;

      if (editingQueryId) {
        // Update existing query
        savedQuery = await onUpdateQuery?.(editingQueryId, {
          name: queryName.trim(),
          query: query.trim(),
          logGroupName: selectedLogGroup || undefined,
        });
      } else {
        // Save new query
        savedQuery = await onSaveQuery({
          name: queryName.trim(),
          query: query.trim(),
          logGroupName: selectedLogGroup || undefined,
        });
      }

      if (savedQuery) {
        toast.success(
          editingQueryId
            ? "Query updated successfully"
            : "Query saved successfully",
        );
        setSaveDialogOpen(false);
        setQueryName("");
        setEditingQueryId(null);
      }
    } catch {
      toast.error(
        editingQueryId ? "Failed to update query" : "Failed to save query",
      );
    }
  };

  const handleLoadQuery = (savedQuery: SavedQuery) => {
    setQuery(savedQuery.query);
    setEditingQueryId(savedQuery.id);
    setQueryName(savedQuery.name);
    onExecuteQuery(savedQuery.query.trim(), dateRange);
  };

  const handleDeleteQuery = async (queryId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!onDeleteQuery) return;

    try {
      const success = await onDeleteQuery(queryId);
      if (success) {
        toast.success("Query deleted successfully");
        // If we're editing the deleted query, clear the editing state
        if (editingQueryId === queryId) {
          setEditingQueryId(null);
          setQueryName("");
        }
      }
    } catch {
      toast.error("Failed to delete query");
    }
  };

  const handleNewQuery = () => {
    setEditingQueryId(null);
    setQueryName("");
    setSaveDialogOpen(true);
  };

  const getPartitionText = () => {
    if (selectedLogGroup) {
      return selectedLogGroup;
    }
    return "Select Partition";
  };

  const handleLogGroupSelect = (logGroupName: string) => {
    onLogGroupSelect?.(logGroupName);
  };

  const handleOpenSettings = (e: React.MouseEvent, logGroupName: string) => {
    e.stopPropagation();
    onOpenSettings?.(logGroupName);
  };

  // Check if current query matches any saved query
  const matchingSavedQuery = savedQueries.find(
    (sq) => sq.query === query.trim() && sq.logGroupName === selectedLogGroup,
  );

  return (
    <div className="bg-background rounded-lg shadow-sm">
      <div className="pb-2">
        <div className="bg-muted/30 flex items-center overflow-hidden rounded-md border">
          {/* Partition/Log Group Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className={cn(
                  "hover:bg-muted/50 flex h-full w-64 flex-shrink-0 items-center gap-2 rounded-none border-r px-3",
                  selectedLogGroup && "bg-accent/10 text-accent-foreground"
                )}
              >
                <span
                  title={getPartitionText()}
                  className="flex-1 truncate text-left text-sm"
                >
                  {getPartitionText()}
                </span>
                <ChevronDown className="h-3 w-3 flex-shrink-0" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              side="top"
              className="max-h-96 w-80 overflow-y-auto"
            >
              {logGroups.map((group) => (
                <DropdownMenuItem
                  key={group.logGroupName}
                  onClick={() => handleLogGroupSelect(group.logGroupName)}
                  className={cn(
                    "p-2 cursor-pointer",
                    selectedLogGroup === group.logGroupName && "bg-accent text-accent-foreground"
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {selectedLogGroup === group.logGroupName && (
                        <Check className="h-3 w-3 text-accent-foreground" />
                      )}
                      <div
                        className="text-sm font-medium truncate"
                        title={group.logGroupName}
                      >
                        {group.logGroupName}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 hover:bg-muted/50 ml-2 flex-shrink-0"
                      onClick={(e) => handleOpenSettings(e, group.logGroupName)}
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Search Input */}
          <div className="flex flex-1 items-center">
            {isLoading && (
              <Loader2 className="text-muted-foreground mr-2 ml-2 h-4 w-4 animate-spin" />
            )}
            {!isLoading && (
              <Search className="text-muted-foreground mr-2 ml-2 h-4 w-4" />
            )}
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleInputKeyDown}
              placeholder="Search..."
              disabled={isLoading}
              className={cn(
                "border-none bg-transparent px-0 py-2 pl-2 shadow-none focus:ring-0 focus-visible:ring-0",
              )}
            />
          </div>

          {/* Saved Queries Dropdown - only show when not editing */}
          {connectionId && !editingQueryId && query.trim() === "" && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="hover:bg-muted/50 flex h-full items-center gap-2 rounded-none border-r px-3"
                >
                  <Bookmark className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="max-h-96 w-80 overflow-y-auto"
              >
                <div className="text-muted-foreground px-2 py-1.5 text-sm font-medium">
                  Saved Queries
                </div>
                <DropdownMenuSeparator />
                {savedQueries.length === 0 ? (
                  <div className="text-muted-foreground px-2 py-1.5 text-sm">
                    No saved queries
                  </div>
                ) : (
                  savedQueries.map((savedQuery) => (
                    <DropdownMenuItem
                      key={savedQuery.id}
                      onClick={() => handleLoadQuery(savedQuery)}
                      className="cursor-pointer p-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">
                          {savedQuery.name}
                        </div>
                        <div className="text-muted-foreground line-clamp-2 text-xs break-all">
                          {savedQuery.query}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:bg-destructive/10 hover:text-destructive ml-2 h-6 w-6 flex-shrink-0"
                        onClick={(e) => handleDeleteQuery(savedQuery.id, e)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Save/Update Query Button - separate from dropdown */}
          {connectionId && query.trim() && (
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="ghost"
                  className="hover:bg-muted/50 flex h-full items-center gap-2 rounded-none border-r px-3"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (editingQueryId) {
                      // If editing, open dialog with current name
                      setSaveDialogOpen(true);
                    } else if (matchingSavedQuery) {
                      // If query matches a saved query, load it for editing
                      handleLoadQuery(matchingSavedQuery);
                      setSaveDialogOpen(true);
                    } else {
                      // New query
                      handleNewQuery();
                    }
                  }}
                >
                  <Save className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>
                    {editingQueryId ? "Update Query" : "Save Query"}
                  </DialogTitle>
                  <DialogDescription>
                    {editingQueryId
                      ? "Update this saved query with the current settings."
                      : "Save this query for future use. You can include a name and it will be associated with the current log group."}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="query-name">Query Name</Label>
                    <Input
                      id="query-name"
                      value={queryName}
                      onChange={(e) => setQueryName(e.target.value)}
                      placeholder="Enter a name for this query"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Query</Label>
                    <div className="bg-muted mt-1 rounded p-2 font-mono text-sm">
                      {query}
                    </div>
                  </div>

                  {selectedLogGroup && (
                    <div>
                      <Label>Log Group</Label>
                      <div className="bg-muted mt-1 rounded p-2 text-sm break-all">
                        {selectedLogGroup}
                      </div>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSaveDialogOpen(false);
                      setEditingQueryId(null);
                      setQueryName("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSaveQuery}
                    disabled={!queryName.trim()}
                  >
                    {editingQueryId ? "Update Query" : "Save Query"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}

          {/* Date Range Picker */}
          <div className="flex min-w-[180px] items-center">
            <NaturalLanguageDatePicker
              value={dateRange.raw}
              onChange={handleDateRangeChange}
              onEnter={handleDateRangeEnter}
              placeholder="e.g. last 2 hours"
            />
          </div>

          {/* Run Query Button */}

          <Button
            variant="ghost"
            className="hover:bg-muted/50 flex h-full items-center gap-2 rounded-none border-l px-3"
            onClick={handleExecute}
            disabled={isLoading}
          >
            <Play className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
