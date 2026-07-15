"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ActionHistory {
  _id: string;
  action: string;
  details: any;
  timestamp: string;
  admin: {
    name: string;
    email: string;
  };
}

interface AdminActionHistoryProps {
  token: string;
}

export function AdminActionHistory({ token }: AdminActionHistoryProps) {
  const [history, setHistory] = useState<ActionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/admin/action-history', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setHistory(data.actions || []);
        } else {
          setError('Failed to fetch action history');
        }
      } catch (err) {
        setError('An error occurred while fetching action history');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchHistory();
    }
  }, [token]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Admin Action History</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Mobile Card View */}
        <div className="block lg:hidden space-y-4">
          {history.map((item) => (
            <Card key={item._id} className="p-4 bg-muted/50">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{item.admin.name}</p>
                    <p className="text-sm text-muted-foreground">{item.admin.email}</p>
                  </div>
                  <Badge variant="secondary">{item.action}</Badge>
                </div>
                
                <div className="text-sm">
                  <span className="text-muted-foreground block mb-1">Details:</span>
                  <div className="bg-background p-2 rounded border text-xs font-mono whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
                    {JSON.stringify(item.details, null, 2)}
                  </div>
                </div>

                <div className="text-xs text-muted-foreground pt-2 border-t">
                  {new Date(item.timestamp).toLocaleString()}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>
                    <div>{item.admin.name}</div>
                    <div className="text-sm text-gray-500">{item.admin.email}</div>
                  </TableCell>
                  <TableCell>
                    <Badge>{item.action}</Badge>
                  </TableCell>
                  <TableCell>
                    <pre className="text-xs whitespace-pre-wrap break-all max-w-md max-h-40 overflow-y-auto">
                      {JSON.stringify(item.details, null, 2)}
                    </pre>
                  </TableCell>
                  <TableCell>{new Date(item.timestamp).toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}