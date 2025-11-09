"use client";

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';

export function MaintenanceModeManager() {
  const [isEnabled, setIsEnabled] = useState(false);
  const [message, setMessage] = useState('');
  const [allowedIps, setAllowedIps] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setIsLoading(true);
    fetch('/api/admin/maintenance')
      .then((res) => res.json())
      .then((data) => {
        setIsEnabled(data.enabled);
        setMessage(data.message || '');
        setAllowedIps(data.allowedIps?.join(', ') || '');
        setSecretKey(data.secretKey || '');
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load maintenance settings:', error);
        toast({
          title: 'Error',
          description: 'Failed to load maintenance settings.',
          variant: 'destructive',
        });
        setIsLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Prepare the data
      const requestData = {
        enabled: isEnabled,
        message: message.trim(),
        allowedIps: allowedIps ? allowedIps.split(',').map((ip) => ip.trim()).filter(ip => ip) : [],
        secretKey: secretKey.trim() || null,
      };

      console.log('Sending maintenance settings:', requestData);

      const res = await fetch('/api/admin/maintenance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      const responseData = await res.json();
      console.log('Maintenance update response:', responseData);

      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Maintenance mode settings updated successfully.',
        });
      } else {
        toast({
          title: 'Error',
          description: responseData.error || 'Failed to update maintenance mode settings.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Save maintenance settings error:', error);
      toast({
        title: 'Error',
        description: 'Network error while saving maintenance settings.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Maintenance Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p>Loading maintenance settings...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Maintenance Mode</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch id="maintenance-mode" checked={isEnabled} onCheckedChange={setIsEnabled} />
          <Label htmlFor="maintenance-mode">Enable Maintenance Mode</Label>
        </div>
        <div>
          <Label htmlFor="maintenance-message">Message</Label>
          <Input
            id="maintenance-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="The website is currently under maintenance. We will be back shortly."
          />
        </div>
        <div>
          <Label htmlFor="allowed-ips">Allowed IP Addresses (comma-separated)</Label>
          <Input
            id="allowed-ips"
            value={allowedIps}
            onChange={(e) => setAllowedIps(e.target.value)}
            placeholder="e.g., 192.168.1.100, 10.0.0.50"
          />
        </div>
        <div>
          <Label htmlFor="secret-key">Secret Key</Label>
          <Input
            id="secret-key"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            placeholder="e.g., emergency-access-2024"
          />
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            'Save Settings'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}