import { app } from 'electron';
import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { AWSConnection, NewAWSConnection, SavedQuery } from '../types/aws';
import { S3Client, ListBucketsCommand } from '@aws-sdk/client-s3';

export class ConnectionStorage {
  private storagePath: string;

  constructor() {
    this.storagePath = path.join(app.getPath('userData'), 'connections.json');
  }

  private async ensureStorageFile() {
    try {
      await fs.access(this.storagePath);
    } catch {
      await fs.writeFile(this.storagePath, JSON.stringify([]));
    }
  }

  async getAllConnections(): Promise<AWSConnection[]> {
    await this.ensureStorageFile();
    const data = await fs.readFile(this.storagePath, 'utf-8');
    return JSON.parse(data);
  }

  async saveConnection(connection: NewAWSConnection): Promise<AWSConnection> {
    const connections = await this.getAllConnections();
    const newConnection: AWSConnection = {
      ...connection,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
      status: 'active',
    };

    connections.push(newConnection);
    await fs.writeFile(this.storagePath, JSON.stringify(connections, null, 2));
    return newConnection;
  }

  async updateConnection(id: string, connection: Partial<AWSConnection>): Promise<AWSConnection | null> {
    const connections = await this.getAllConnections();
    const index = connections.findIndex((c) => c.id === id);
    
    if (index === -1) return null;

    const updatedConnection = {
      ...connections[index],
      ...connection,
      updatedAt: new Date(),
    };

    connections[index] = updatedConnection;
    await fs.writeFile(this.storagePath, JSON.stringify(connections, null, 2));
    return updatedConnection;
  }

  async deleteConnection(id: string): Promise<boolean> {
    const connections = await this.getAllConnections();
    const filteredConnections = connections.filter((c) => c.id !== id);
    
    if (filteredConnections.length === connections.length) return false;

    await fs.writeFile(this.storagePath, JSON.stringify(filteredConnections, null, 2));
    return true;
  }

  async updateLastSelectedLogGroup(connectionId: string, logGroupName: string): Promise<AWSConnection | null> {
    const connections = await this.getAllConnections();
    const index = connections.findIndex((c) => c.id === connectionId);
    
    if (index === -1) return null;

    const updatedConnection = {
      ...connections[index],
      lastSelectedLogGroup: logGroupName,
      updatedAt: new Date(),
    };

    connections[index] = updatedConnection;
    await fs.writeFile(this.storagePath, JSON.stringify(connections, null, 2));
    return updatedConnection;
  }

  async testConnection(connection: NewAWSConnection): Promise<boolean> {
    try {
      const credentials = {
        accessKeyId: connection.accessKey,
        secretAccessKey: connection.secretKey,
        ...(connection.sessionToken && { sessionToken: connection.sessionToken }),
      };

      const client = new S3Client({
        region: connection.region,
        credentials,
      });

      // Try to list buckets as a simple test
      await client.send(new ListBucketsCommand({}));
      
      return true;
    } catch (error) {
      console.error('Failed to test AWS connection:', error);
      return false;
    }
  }

  // Saved Queries Methods
  async saveQuery(connectionId: string, query: Omit<SavedQuery, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedQuery | null> {
    const connections = await this.getAllConnections();
    const index = connections.findIndex((c) => c.id === connectionId);
    
    if (index === -1) return null;

    const newQuery: SavedQuery = {
      ...query,
      id: uuidv4(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (!connections[index].savedQueries) {
      connections[index].savedQueries = [];
    }

    connections[index].savedQueries!.push(newQuery);
    connections[index].updatedAt = new Date();

    await fs.writeFile(this.storagePath, JSON.stringify(connections, null, 2));
    return newQuery;
  }

  async updateQuery(connectionId: string, queryId: string, query: Partial<Omit<SavedQuery, 'id' | 'createdAt'>>): Promise<SavedQuery | null> {
    const connections = await this.getAllConnections();
    const connectionIndex = connections.findIndex((c) => c.id === connectionId);
    
    if (connectionIndex === -1 || !connections[connectionIndex].savedQueries) return null;

    const queryIndex = connections[connectionIndex].savedQueries!.findIndex((q) => q.id === queryId);
    if (queryIndex === -1) return null;

    const updatedQuery = {
      ...connections[connectionIndex].savedQueries![queryIndex],
      ...query,
      updatedAt: new Date(),
    };

    connections[connectionIndex].savedQueries![queryIndex] = updatedQuery;
    connections[connectionIndex].updatedAt = new Date();

    await fs.writeFile(this.storagePath, JSON.stringify(connections, null, 2));
    return updatedQuery;
  }

  async deleteQuery(connectionId: string, queryId: string): Promise<boolean> {
    const connections = await this.getAllConnections();
    const connectionIndex = connections.findIndex((c) => c.id === connectionId);
    
    if (connectionIndex === -1 || !connections[connectionIndex].savedQueries) return false;

    const initialLength = connections[connectionIndex].savedQueries!.length;
    connections[connectionIndex].savedQueries = connections[connectionIndex].savedQueries!.filter((q) => q.id !== queryId);
    
    if (connections[connectionIndex].savedQueries!.length === initialLength) return false;

    connections[connectionIndex].updatedAt = new Date();
    await fs.writeFile(this.storagePath, JSON.stringify(connections, null, 2));
    return true;
  }

  async getSavedQueries(connectionId: string): Promise<SavedQuery[]> {
    const connections = await this.getAllConnections();
    const connection = connections.find((c) => c.id === connectionId);
    return connection?.savedQueries || [];
  }
} 