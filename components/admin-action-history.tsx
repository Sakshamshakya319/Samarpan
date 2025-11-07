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
                  <pre className="text-xs">{JSON.stringify(item.details, null, 2)}</pre>
                </TableCell>
                <TableCell>{new Date(item.timestamp).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}