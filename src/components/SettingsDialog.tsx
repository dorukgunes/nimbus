import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { LogFormatter, LogFormatterSettings } from './LogFormatter';
import { AWSConnection } from '@/types/aws';
import { cn } from '@/lib/utils';

interface SettingsDialogProps {
  children?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  connection?: AWSConnection | null;
  logGroupName?: string | null;
  onSaveSettings?: (logGroupName: string, settings: LogFormatterSettings) => Promise<void>;
  sampleLogs?: Array<{ timestamp: number; message: string }>;
}

const DEFAULT_LOG_FORMATTER_SETTINGS: LogFormatterSettings = {
  textSize: 0.5,
  lineFormat: [
    { id: "time-default", type: "time", value: "%time('D/MMM/YYYY:HH:mm:ss')" },
    { id: "level", type: "field", value: "%level" },
    { id: "line", type: "field", value: "%line", locked: true },
  ],
  customFields: {},
};

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ 
  children, 
  open: externalOpen, 
  onOpenChange,
  connection,
  logGroupName,
  onSaveSettings,
  sampleLogs
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'log-format'>('log-format');
  const [logFormatterSettings, setLogFormatterSettings] = useState<LogFormatterSettings>(DEFAULT_LOG_FORMATTER_SETTINGS);
  
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  const handleSave = () => {
    if (logGroupName && onSaveSettings) {
      onSaveSettings(logGroupName, logFormatterSettings);
    }
    setOpen(false);
  };

  const handleCancel = () => {
    // Reset to current settings
    loadCurrentSettings();
    setOpen(false);
  };

  const loadCurrentSettings = () => {
    if (connection && logGroupName) {
      // Load actual settings from connection
      const existingSettings = connection.logGroupSettings?.[logGroupName]?.logFormatter;
      if (existingSettings) {
        setLogFormatterSettings(existingSettings);
      } else {
        setLogFormatterSettings(DEFAULT_LOG_FORMATTER_SETTINGS);
      }
    } else {
      setLogFormatterSettings(DEFAULT_LOG_FORMATTER_SETTINGS);
    }
  };

  useEffect(() => {
    if (open) {
      loadCurrentSettings();
    }
  }, [open, connection, logGroupName]);

  const handleLogFormatterSettingsChange = (settings: LogFormatterSettings) => {
    setLogFormatterSettings(settings);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Settings
            {logGroupName ? ` - ${logGroupName}` : ' - Global'}
          </DialogTitle>
          {logGroupName && (
            <p className="text-sm text-muted-foreground">
              Configure settings specifically for the &ldquo;{logGroupName}&rdquo; log group
            </p>
          )}
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Navigation Tabs */}
          <div className="flex space-x-1 border-b">
         
            <button
              onClick={() => setActiveTab('log-format')}
              className={cn(
                "px-3 py-2 text-sm font-medium transition-colors",
                activeTab === 'log-format' 
                  ? "border-b-2 border-primary text-primary" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Log Format
            </button>
          </div>

          {/* Tab Content */}
          <div className="min-h-[400px]">    
            {activeTab === 'log-format' && (
              <LogFormatter
                settings={logFormatterSettings}
                onSettingsChange={handleLogFormatterSettingsChange}
                sampleLogs={sampleLogs}
              />
            )}
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Settings
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};