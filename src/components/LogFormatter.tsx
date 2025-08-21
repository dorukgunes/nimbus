import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { GripVertical, Lock, X, Plus, Trash2, Eye } from "lucide-react";
import { cn } from "@/utils/tailwind";

export interface LogFormatToken {
  id: string;
  type: string;
  value: string;
  locked?: boolean;
  customField?: string; // For custom field mappings
}

export interface LogFormatterSettings {
  textSize: number;
  lineFormat: LogFormatToken[];
  customFields: Record<string, string>; // Maps display name to JSON path
}

interface LogFormatterProps {
  settings: LogFormatterSettings;
  onSettingsChange: (settings: LogFormatterSettings) => void;
  sampleLogs?: Array<{ timestamp: number; message: string }>; // For field discovery
}

const AVAILABLE_TOKENS: LogFormatToken[] = [
  // Time formats
  { id: "time1", type: "time", value: "%time('MMM D HH:mm:ss')" },
  { id: "time2", type: "time", value: "%time('YYYY-MM-DD HH:mm:ss')" },
  { id: "time3", type: "time", value: "%time('D/MMM/YYYY:HH:mm:ss')" },
  { id: "time4", type: "time", value: "%time('YYYY-MM-DD HH:mm:ss.SSS')" },
  
  // Common standard fields
  { id: "timestamp", type: "field", value: "%timestamp" },
  { id: "level", type: "field", value: "%level" },
  { id: "message", type: "field", value: "%message" },
  { id: "line", type: "field", value: "%line", locked: true },
];

export const LogFormatter: React.FC<LogFormatterProps> = ({
  settings,
  onSettingsChange,
  sampleLogs = [],
}) => {
  const [draggedToken, setDraggedToken] = useState<LogFormatToken | null>(null);
  const [draggedOverIndex, setDraggedOverIndex] = useState<number | null>(null);
  const [showCustomFieldDialog, setShowCustomFieldDialog] = useState(false);
  const [newCustomField, setNewCustomField] = useState({ displayName: "", jsonPath: "" });
  const [discoveredFields, setDiscoveredFields] = useState<string[]>([]);
  const lineFormatRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  // Discover fields from sample logs
  useEffect(() => {
    if (sampleLogs.length > 0) {
      const fields = new Set<string>();
      sampleLogs.forEach(log => {
        try {
          const parsed = JSON.parse(log.message);
          const extractFields = (obj: any, prefix = "") => {
            Object.keys(obj).forEach(key => {
              const fullPath = prefix ? `${prefix}.${key}` : key;
              fields.add(fullPath);
              if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
                extractFields(obj[key], fullPath);
              }
            });
          };
          extractFields(parsed);
        } catch (e) {
          // Skip non-JSON logs
        }
      });
      setDiscoveredFields(Array.from(fields).sort());
    }
  }, [sampleLogs]);

  // Ensure line token is always present and at the end (only once on mount)
  useEffect(() => {
    if (initializedRef.current) return;
    
    const hasLineToken = settings.lineFormat.some(t => t.value === "%line");
    const lineToken = settings.lineFormat.find(t => t.value === "%line");
    const tokensWithoutLine = settings.lineFormat.filter(t => t.value !== "%line");
    
    if (!hasLineToken) {
      // Add line token if it doesn't exist
      const newLineFormat = [
        ...tokensWithoutLine,
        { id: "line-default", type: "field", value: "%line", locked: true }
      ];
      onSettingsChange({
        ...settings,
        lineFormat: newLineFormat,
      });
    } else if (lineToken && settings.lineFormat[settings.lineFormat.length - 1]?.value !== "%line") {
      // Ensure line token is at the end
      const newLineFormat = [
        ...tokensWithoutLine,
        lineToken
      ];
      onSettingsChange({
        ...settings,
        lineFormat: newLineFormat,
      });
    }
    
    initializedRef.current = true;
  }, []); // Only run once on mount

  const ensureLineTokenAtEnd = (lineFormat: LogFormatToken[]) => {
    const lineToken = lineFormat.find(t => t.value === "%line");
    const tokensWithoutLine = lineFormat.filter(t => t.value !== "%line");
    
    if (!lineToken) {
      // Add line token if it doesn't exist
      return [
        ...tokensWithoutLine,
        { id: "line-default", type: "field", value: "%line", locked: true }
      ];
    } else if (lineToken && lineFormat[lineFormat.length - 1]?.value !== "%line") {
      // Ensure line token is at the end
      return [
        ...tokensWithoutLine,
        lineToken
      ];
    }
    
    return lineFormat;
  };

  const handleTextSizeChange = (value: number[]) => {
    onSettingsChange({
      ...settings,
      textSize: value[0],
    });
  };

  const handleTokenDragStart = (e: React.DragEvent, token: LogFormatToken) => {
    setDraggedToken(token);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleTokenDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDraggedOverIndex(index);
  };

  const handleTokenDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (!draggedToken) return;

    const newLineFormat = [...settings.lineFormat];
    
    // Remove the dragged token from its current position
    const currentIndex = newLineFormat.findIndex(t => t.id === draggedToken.id);
    if (currentIndex !== -1) {
      newLineFormat.splice(currentIndex, 1);
    }
    
    // Insert at the target position
    newLineFormat.splice(targetIndex, 0, draggedToken);
    
    // Ensure line token is always at the end
    const finalLineFormat = ensureLineTokenAtEnd(newLineFormat);
    
    onSettingsChange({
      ...settings,
      lineFormat: finalLineFormat,
    });
    
    setDraggedToken(null);
    setDraggedOverIndex(null);
  };

  const handleAvailableTokenDrop = (e: React.DragEvent, token: LogFormatToken) => {
    e.preventDefault();
    
    // Add the token to the line format
    const newLineFormat = [...settings.lineFormat, { ...token, id: `${token.id}-${Date.now()}` }];
    
    // Ensure line token is always at the end
    const finalLineFormat = ensureLineTokenAtEnd(newLineFormat);
    
    onSettingsChange({
      ...settings,
      lineFormat: finalLineFormat,
    });
  };

  const handleRemoveToken = (tokenId: string) => {
    // Don't allow removing the line token
    const token = settings.lineFormat.find(t => t.id === tokenId);
    if (token?.value === "%line") return;
    
    const newLineFormat = settings.lineFormat.filter(t => t.id !== tokenId);
    
    // Ensure line token is always at the end
    const finalLineFormat = ensureLineTokenAtEnd(newLineFormat);
    
    onSettingsChange({
      ...settings,
      lineFormat: finalLineFormat,
    });
  };

  const handleDragEnd = () => {
    setDraggedToken(null);
    setDraggedOverIndex(null);
  };

  const handleAddCustomField = () => {
    if (newCustomField.displayName && newCustomField.jsonPath) {
      const customToken: LogFormatToken = {
        id: `custom-${Date.now()}`,
        type: "custom",
        value: `%${newCustomField.displayName}`,
        customField: newCustomField.jsonPath,
      };

      const newLineFormat = [...settings.lineFormat, customToken];
      const newCustomFields = { ...settings.customFields, [newCustomField.displayName]: newCustomField.jsonPath };

      // Ensure line token is always at the end
      const finalLineFormat = ensureLineTokenAtEnd(newLineFormat);

      onSettingsChange({
        ...settings,
        lineFormat: finalLineFormat,
        customFields: newCustomFields,
      });

      setNewCustomField({ displayName: "", jsonPath: "" });
      setShowCustomFieldDialog(false);
    }
  };

  const handleRemoveCustomField = (displayName: string) => {
    const newCustomFields = { ...settings.customFields };
    delete newCustomFields[displayName];
    
    // Remove tokens that use this custom field
    const newLineFormat = settings.lineFormat.filter(t => 
      !(t.type === "custom" && t.customField === newCustomFields[displayName])
    );

    // Ensure line token is always at the end
    const finalLineFormat = ensureLineTokenAtEnd(newLineFormat);

    onSettingsChange({
      ...settings,
      lineFormat: finalLineFormat,
      customFields: newCustomFields,
    });
  };

  const handleCustomFieldDragStart = (e: React.DragEvent, displayName: string, jsonPath: string) => {
    setDraggedToken({
      id: `custom-${Date.now()}`,
      type: "custom",
      value: `%${displayName}`,
      customField: jsonPath,
    });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDiscoveredFieldDragStart = (e: React.DragEvent, field: string) => {
    setDraggedToken({
      id: `discovered-${Date.now()}`,
      type: "discovered",
      value: `%${field}`,
      customField: field,
    });
    e.dataTransfer.effectAllowed = "move";
  };

  const getTextSizeClass = (size: number) => {
    if (size < 0.3) return "text-xs";
    if (size < 0.6) return "text-sm";
    if (size < 0.9) return "text-base";
    return "text-lg";
  };

  // Create a sample log entry for preview
  const sampleLog = {
    timestamp: Date.now(),
    message: JSON.stringify({
      level: "info",
      app: "sample-app",
      source: "api-service",
      msg: "This is a sample log message for preview",
      userId: "user123",
      url: "/api/endpoint",
      metadata: {
        requestId: "req-456",
        duration: 150
      }
    })
  };

  // Format the sample log for preview
  const formatPreviewLog = () => {
    if (!settings.lineFormat.length) return "No format configured";
    
    const formatToken = (token: LogFormatToken) => {
      switch (token.value) {
        case "%time('D/MMM/YYYY:HH:mm:ss')":
          return new Date(sampleLog.timestamp).toLocaleString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        case "%time('MMM D HH:mm:ss')":
          return new Date(sampleLog.timestamp).toLocaleString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        case "%time('YYYY-MM-DD HH:mm:ss')":
          return new Date(sampleLog.timestamp).toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
        case "%time('YYYY-MM-DD HH:mm:ss.SSS')":
          return new Date(sampleLog.timestamp).toISOString().replace('T', ' ').replace('Z', '');
        case "%timestamp":
          return sampleLog.timestamp.toString();
        case "%level":
          return "info";
        case "%message":
          return sampleLog.message;
        case "%line":
          return "This is a sample log message for preview";
        default:
          // Handle custom fields
          if (token.type === "custom" && token.customField) {
            try {
              const parsed = JSON.parse(sampleLog.message);
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
      <div className="flex flex-wrap gap-2">
        {settings.lineFormat.map((token, index) => (
          <span
            key={`preview-${token.id}-${index}`}
            className={cn(
              "whitespace-nowrap text-xs",
              token.value.startsWith("%time") && "text-muted-foreground",
              token.value === "%level" && "font-semibold text-blue-500",
              token.value === "%line" && "text-foreground",
              token.type === "custom" && "text-green-600"
            )}
          >
            {formatToken(token)}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Text Size Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Text Size</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Slider
              value={[settings.textSize]}
              onValueChange={handleTextSizeChange}
              max={1}
              min={0}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Smaller</span>
              <span>Larger</span>
            </div>
            <div className="text-center">
              <span className={cn("font-mono", getTextSizeClass(settings.textSize))}>
                Sample Text Size
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line Format Section */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Line Format</CardTitle>
          <p className="text-muted-foreground">
            Configure the contents displayed for each line of the log viewer.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Line Format Display */}
          <div className="space-y-2">
            <div
              ref={lineFormatRef}
              className="min-h-[60px] w-full rounded-md border-2 border-dashed border-muted-foreground/20 bg-muted/30 p-3"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (draggedToken) {
                  if (draggedToken.type === "discovered") {
                    // Handle discovered field drop
                    const displayName = draggedToken.customField?.split('.').pop() || draggedToken.customField || '';
                    
                    // Add to custom fields
                    const newCustomFields = { 
                      ...settings.customFields, 
                      [displayName]: draggedToken.customField || '' 
                    };
                    
                    // Create the custom token for the line format
                    const customToken: LogFormatToken = {
                      id: `custom-${Date.now()}`,
                      type: "custom",
                      value: `%${displayName}`,
                      customField: draggedToken.customField || '',
                    };
                    
                    // Add to line format
                    const newLineFormat = [...settings.lineFormat, customToken];
                    const finalLineFormat = ensureLineTokenAtEnd(newLineFormat);
                    
                    onSettingsChange({
                      ...settings,
                      lineFormat: finalLineFormat,
                      customFields: newCustomFields,
                    });
                  } else {
                    // Handle regular token drop
                    handleTokenDrop(e, settings.lineFormat.length);
                  }
                  setDraggedToken(null);
                }
              }}
            >
              {settings.lineFormat.length === 0 ? (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  Drag tokens here to configure line format
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {settings.lineFormat.map((token, index) => (
                    <div
                      key={token.id}
                      className={cn(
                        "relative",
                        draggedOverIndex === index && "opacity-50"
                      )}
                      onDragOver={(e) => handleTokenDragOver(e, index)}
                      onDrop={(e) => handleTokenDrop(e, index)}
                    >
                      <Badge
                        variant={token.type === "custom" ? "default" : "secondary"}
                        className="cursor-move select-none"
                        draggable={!token.locked}
                        onDragStart={(e) => !token.locked && handleTokenDragStart(e, token)}
                        onDragEnd={handleDragEnd}
                      >
                        {token.locked ? (
                          <Lock className="mr-1 h-3 w-3" />
                        ) : (
                          <GripVertical className="mr-1 h-3 w-3" />
                        )}
                        {token.value}
                        {token.type === "custom" && (
                          <span className="ml-1 text-xs opacity-70">
                            ({token.customField})
                          </span>
                        )}
                        {!token.locked && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="ml-1 h-4 w-4 p-0 hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => handleRemoveToken(token.id)}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <p className="text-center text-sm text-muted-foreground">
              ↑ Drag tokens below to rearrange line content ↑
            </p>
          </div>

          {/* Preview Section */}
          {settings.lineFormat.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium">Preview</h4>
              <div className="rounded-md bg-muted/30 p-3 border">
                <div className={cn("font-mono", getTextSizeClass(settings.textSize))}>
                  {formatPreviewLog()}
                </div>
              </div>
            </div>
          )}

          {/* Custom Fields Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Custom Fields</h4>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCustomFieldDialog(true)}
                className="flex items-center gap-2"
              >
                <Plus className="h-3 w-3" />
                Add Field
              </Button>
            </div>
            
            {Object.keys(settings.customFields).length > 0 && (
              <div className="space-y-2">
                {Object.entries(settings.customFields).map(([displayName, jsonPath]) => (
                  <div key={displayName} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className="cursor-grab active:cursor-grabbing"
                        draggable
                        onDragStart={(e) => handleCustomFieldDragStart(e, displayName, jsonPath)}
                        onDragEnd={handleDragEnd}
                      >
                        <GripVertical className="mr-1 h-3 w-3" />
                        %{displayName}
                      </Badge>
                      <span className="text-sm text-muted-foreground">→</span>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">{jsonPath}</code>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveCustomField(displayName)}
                      className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Field Discovery */}
            {discoveredFields.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-muted-foreground">Available Fields in Logs</h5>
                <div className="max-h-32 overflow-y-auto bg-muted/20 p-2 rounded">
                  <div className="flex flex-wrap gap-1">
                    {discoveredFields.map((field) => (
                      <Badge
                        key={field}
                        variant="outline"
                        className="text-xs cursor-grab active:cursor-grabbing hover:bg-primary/10"
                        draggable
                        onDragStart={(e) => handleDiscoveredFieldDragStart(e, field)}
                        onDragEnd={handleDragEnd}
                        onClick={() => {
                          setNewCustomField({ displayName: field.split('.').pop() || field, jsonPath: field });
                          setShowCustomFieldDialog(true);
                        }}
                      >
                        <GripVertical className="mr-1 h-2 w-2" />
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Available Tokens */}
          <div className="space-y-2">
            <h4 className="font-medium">Standard Tokens</h4>
            <div className="rounded-md bg-muted/50 p-3">
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_TOKENS.map((token) => (
                  <Badge
                    key={token.id}
                    variant="outline"
                    className="cursor-grab active:cursor-grabbing"
                    draggable
                    onDragStart={(e) => handleTokenDragStart(e, token)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => handleAvailableTokenDrop(e, token)}
                  >
                    <GripVertical className="mr-1 h-3 w-3" />
                    {token.value}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Field Dialog */}
      <Dialog open={showCustomFieldDialog} onOpenChange={setShowCustomFieldDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Custom Field</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="display-name">Display Name</Label>
              <Input
                id="display-name"
                value={newCustomField.displayName}
                onChange={(e) => setNewCustomField(prev => ({ ...prev, displayName: e.target.value }))}
                placeholder="e.g., userId, requestId"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="json-path">JSON Path</Label>
              <Input
                id="json-path"
                value={newCustomField.jsonPath}
                onChange={(e) => setNewCustomField(prev => ({ ...prev, jsonPath: e.target.value }))}
                placeholder="e.g., userId, metadata.requestId"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Use dot notation for nested fields (e.g., metadata.requestId)
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCustomFieldDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCustomField} disabled={!newCustomField.displayName || !newCustomField.jsonPath}>
              Add Field
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
