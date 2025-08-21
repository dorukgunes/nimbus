import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusIcon, Pencil, Trash2 } from 'lucide-react';
import { AWSConnection, NewAWSConnection } from '@/types/aws';
import { toast } from 'sonner';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ResizableSidebar } from '@/components/ResizableSidebar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { cn } from '@/utils/tailwind';
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from '@/components/ui/context-menu';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  accessKey: z.string().min(1, 'Access Key is required'),
  secretKey: z.string().min(1, 'Secret Key is required'),
  sessionToken: z.string().optional(),
  region: z.string().min(1, 'Region is required'),
});

type FormData = z.infer<typeof formSchema>;

export const ConnectionPage: React.FC = () => {
  const [connections, setConnections] = useState<AWSConnection[]>([]);
  const [selectedConnection, setSelectedConnection] = useState<AWSConnection | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isTested, setIsTested] = useState(false);
  const [testResult, setTestResult] = useState<boolean | null>(null);
  const navigate = useNavigate();
    // Control if the query params has a connectionId
    const [searchParams] = useSearchParams();
    const connectionId = searchParams.get('connectionId');

  const loadConnections = async () => {
    try {
      const loadedConnections = await window.connectionAPI.getAllConnections();
      setConnections(loadedConnections);
    } catch {
      toast.error('Failed to load connections');
    }
  };

  useEffect(() => {
    loadConnections();
  }, []);


  useEffect(() => {
    if (connectionId && !selectedConnection) {
      const connection = connections.find((c) => c.id === connectionId);
      if (connection) {
        setSelectedConnection(connection);
      }
    }
  }, [connectionId, connections, selectedConnection]);

  // Form logic
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    getValues,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      accessKey: '',
      secretKey: '',
      sessionToken: '',
      region: '',
    },
  });

  // When selectedConnection or isCreating changes, update form
  useEffect(() => {
    if (isCreating) {
      reset({ name: '', accessKey: '', secretKey: '', sessionToken: '', region: '' });
      setIsTested(false);
      setTestResult(null);
    } else if (selectedConnection) {
      reset({
        name: selectedConnection.name,
        accessKey: selectedConnection.accessKey,
        secretKey: selectedConnection.secretKey,
        sessionToken: selectedConnection.sessionToken || '',
        region: selectedConnection.region,
      });
      setIsTested(false);
      setTestResult(null);
    } else {
      reset({ name: '', accessKey: '', secretKey: '', sessionToken: '', region: '' });
      setIsTested(false);
      setTestResult(null);
    }
  }, [selectedConnection, isCreating, reset]);

  const handleDelete = async (id: string) => {
    try {
      await window.connectionAPI.deleteConnection(id);
      toast.success('Connection deleted');
      if (selectedConnection && selectedConnection.id === id) {
        setSelectedConnection(null);
        setIsCreating(false);
      }
      loadConnections();
    } catch {
      toast.error('Failed to delete connection');
    }
  };

  const handleEdit = (connection: AWSConnection) => {
    setSelectedConnection(connection);
    setIsCreating(false);
  };

  const handleCreate = () => {
    setSelectedConnection(null);
    setIsCreating(true);
  };

  const testConnection = async (shouldShowToast: boolean = true): Promise<boolean> => {
    const values = getValues();
    setIsTesting(true);
    setTestResult(null);
    const start = Date.now();
    try {
      const result = await window.connectionAPI.testConnection(values);
      const elapsed = Date.now() - start;
      if (elapsed < 500) {
        await new Promise((resolve) => setTimeout(resolve, 500 - elapsed));
      }
      setTestResult(result);
      if (result) {
        if (shouldShowToast) {
          toast.success('Connection test successful');
        }
        setIsTested(true);
        return true;
      } else {
        if (shouldShowToast) {
          toast.error('Connection test failed');
        }
        return false;
      }
    } catch (error) {
      const elapsed = Date.now() - start;
      if (elapsed < 500) {
        await new Promise((resolve) => setTimeout(resolve, 500 - elapsed));
      }
      if (error instanceof Error) {
        if (shouldShowToast) {
          toast.error(error.message);
        }
      } else {
        if (shouldShowToast) {
          toast.error('An unknown error occurred');
        }
      }
      setTestResult(false);
      return false;
    } finally {
      setIsTesting(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!(await testConnection(false))) {
      return;
    }

    if (isCreating) {
      try {
        await window.connectionAPI.saveConnection(data as NewAWSConnection);
        toast.success('Connection created successfully');
        setSelectedConnection(null);
        setIsCreating(false);
        loadConnections();
      } catch (error) {
        console.error('Failed to save connection', error);
        toast.error('Failed to save connection');
      }
    } else if (selectedConnection) {
      try {
        await window.connectionAPI.updateConnection(selectedConnection.id, data);
        toast.success('Connection updated successfully');
        setSelectedConnection(null);
        setIsCreating(false);
        loadConnections();
      } catch {
        toast.error('Failed to update connection');
      }
    }
  };

  return (
    <div className="flex h-screen w-screen chat-background">
      <ResizableSidebar className="sidebar-translucent relative h-full" minWidth={280} defaultWidth={320}>
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="font-semibold text-base truncate">Connections</span>
            <Button size="icon" variant="outline" onClick={handleCreate} title="New Connection">
              <PlusIcon className="w-4 h-4" />
            </Button>
          </div>
          <ScrollArea className="flex-1">
            <div className="py-2">
              {connections.map((connection) => (
                <ContextMenu key={connection.id}>
                  <ContextMenuTrigger asChild>
                    <div
                      className={cn(
                        'flex items-center px-3 py-2 cursor-pointer group sidebar-item-hover mx-2 rounded-lg transition-colors-smooth',
                        selectedConnection && connection.id === selectedConnection.id && !isCreating && 'bg-accent text-accent-foreground',
                      )}
                      onClick={() => {
                        setSelectedConnection(connection);
                        setIsCreating(false);
                      }}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{connection.name}</div>
                        <div className="text-xs text-muted-foreground truncate">{connection.region}</div>
                      </div>
                    </div>
                  </ContextMenuTrigger>
                  <ContextMenuContent>
                    <ContextMenuItem onClick={() => handleEdit(connection)}>
                      <Pencil className="w-4 h-4 mr-2" /> Edit
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => handleDelete(connection.id)} className="text-red-600">
                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              ))}
            </div>
          </ScrollArea>
        </div>
      </ResizableSidebar>
      <div className="flex-1 flex flex-col items-center justify-center min-w-0 chat-background">
        <div className="w-full max-w-md p-4">
          {(isCreating || selectedConnection) && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-4">
                <CardTitle className="text-lg font-semibold">
                  {isCreating ? 'New Connection' : selectedConnection?.name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="accessKey">AWS Access Key</Label>
                    <Input id="accessKey" {...register('accessKey')} type="password" placeholder="AWS Access Key" />
                    {errors.accessKey && <p className="text-sm text-red-500">{errors.accessKey.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secretKey">AWS Secret Key</Label>
                    <Input id="secretKey" {...register('secretKey')} type="password" placeholder="AWS Secret Key" />
                    {errors.secretKey && <p className="text-sm text-red-500">{errors.secretKey.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sessionToken">AWS Session Token (Optional)</Label>
                    <Input id="sessionToken" {...register('sessionToken')} type="password" placeholder="AWS Session Token" />
                    {errors.sessionToken && <p className="text-sm text-red-500">{errors.sessionToken.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="region">AWS Region</Label>
                    <Input id="region" {...register('region')} placeholder="us-east-1" />
                    {errors.region && <p className="text-sm text-red-500">{errors.region.message}</p>}
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => testConnection(true)} disabled={isTesting}>
                        {isTesting ? 'Testing...' : 'Test Connection'}
                      </Button>
                      {!isCreating && selectedConnection && (
                        <Button
                          type="button"
                          variant="default"
                          onClick={async () => {
                           const testSuccess = await testConnection(false);
                           if (testSuccess) {
                            await window.connectionAPI.updateConnection(selectedConnection.id, {
                              ...getValues(),
                              status: 'active',
                            });
                            navigate(`/dashboard/${selectedConnection.id}`);
                           }
                          }}
                          disabled={isTesting}
                        >
                          Connect
                        </Button>
                      )}
                    </div>
                    {testResult !== null && (
                      <div className="mt-1">
                        <span className={`text-sm ${testResult ? 'text-green-500' : 'text-red-500'}`}>
                          {testResult ? '✓ Connection successful' : '✗ Connection failed'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name">Connection Name</Label>
                    <Input id="name" {...register('name')} placeholder="My AWS Connection" />
                    {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => { setSelectedConnection(null); setIsCreating(false); }}>
                      Cancel
                    </Button>
                    <Button type="submit" variant={isCreating ? "default" : "outline"}>
                      {isCreating ? 'Create' : 'Update'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
