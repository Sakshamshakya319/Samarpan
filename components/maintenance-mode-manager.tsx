"use client";

import { useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import { AlertTriangle, Clock, Shield, Zap } from 'lucide-react';

interface MaintenanceSettings {
  enabled: boolean;
  message: string;
  allowedIps: string[];
  secretKey: string | null;
  priority: 'low' | 'medium' | 'high' | 'critical';
  enabledAt?: string;
}

export function MaintenanceModeManager() {
  const [settings, setSettings] = useState<MaintenanceSettings>({
    enabled: false,
    message: '',
    allowedIps: [],
    secretKey: null,
    priority: 'medium'
  });
  const [allowedIpsInput, setAllowedIpsInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const priorityOptions = [
    { 
      value: 'low', 
      label: 'Low Priority', 
      description: 'Routine maintenance',
      icon: Clock,
      color: 'text-blue-500'
    },
    { 
      value: 'medium', 
      label: 'Medium Priority', 
      description: 'Scheduled updates',
      icon: Shield,
      color: 'text-orange-500'
    },
    { 
      value: 'high', 
      label: 'High Priority', 
      description: 'Important system changes',
      icon: AlertTriangle,
      color: 'text-red-500'
    },
    { 
      value: 'critical', 
      label: 'Critical', 
      description: 'Emergency maintenance',
      icon: Zap,
      color: 'text-red-600'
    }
  ];

  const selectedPriority = priorityOptions.find(p => p.value === settings.priority);

  useEffect(() => {
    setIsLoading(true);
    fetch('/api/admin/maintenance')
      .then((res) => res.json())
      .then((data) => {
        setSettings({
          enabled: data.enabled || false,
          message: data.message || '',
          allowedIps: data.allowedIps || [],
          secretKey: data.secretKey || null,
          priority: data.priority || 'medium',
          enabledAt: data.enabledAt
        });
        setAllowedIpsInput(data.allowedIps?.join(', ') || '');
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
      const requestData = {
        enabled: settings.enabled,
        message: settings.message.trim() || 'We are currently performing scheduled maintenance to improve your experience. Please check back shortly.',
        allowedIps: allowedIpsInput ? allowedIpsInput.split(',').map((ip) => ip.trim()).filter(ip => ip) : [],
        secretKey: settings.secretKey?.trim() || null,
        priority: settings.priority,
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
        setSettings(prev => ({ ...prev, enabledAt: responseData.enabledAt }));
        toast({
          title: 'Success',
          description: settings.enabled 
            ? 'Maintenance mode has been enabled. Users will be redirected to the maintenance page.'
            : 'Maintenance mode has been disabled. Users can now access the website normally.',
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Maintenance Mode
            {settings.enabled && (
              <Badge variant="destructive" className="animate-pulse">
                ACTIVE
              </Badge>
            )}
          </CardTitle>
          {settings.enabledAt && settings.enabled && (
            <div className="text-sm text-gray-500">
              Started: {new Date(settings.enabledAt).toLocaleString()}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Enable/Disable Switch */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div className="space-y-1">
            <Label htmlFor="maintenance-mode" className="text-base font-medium">
              Enable Maintenance Mode
            </Label>
            <p className="text-sm text-gray-600">
              When enabled, all users will be redirected to the maintenance page
            </p>
          </div>
          <Switch 
            id="maintenance-mode" 
            checked={settings.enabled} 
            onCheckedChange={(enabled) => setSettings(prev => ({ ...prev, enabled }))}
          />
        </div>

        {/* Priority Selection */}
        <div className="space-y-2">
          <Label htmlFor="priority">Maintenance Priority</Label>
          <Select 
            value={settings.priority} 
            onValueChange={(priority: 'low' | 'medium' | 'high' | 'critical') => 
              setSettings(prev => ({ ...prev, priority }))
            }
          >
            <SelectTrigger>
              <SelectValue>
                {selectedPriority && (
                  <div className="flex items-center gap-2">
                    <selectedPriority.icon className={`w-4 h-4 ${selectedPriority.color}`} />
                    <span>{selectedPriority.label}</span>
                  </div>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {priorityOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  <div className="flex items-center gap-2">
                    <option.icon className={`w-4 h-4 ${option.color}`} />
                    <div>
                      <div className="font-medium">{option.label}</div>
                      <div className="text-xs text-gray-500">{option.description}</div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Maintenance Message */}
        <div className="space-y-2">
          <Label htmlFor="maintenance-message">Maintenance Message</Label>
          <Textarea
            id="maintenance-message"
            value={settings.message}
            onChange={(e) => setSettings(prev => ({ ...prev, message: e.target.value }))}
            placeholder="We are currently performing scheduled maintenance to improve your experience. Please check back shortly."
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-gray-500">
            This message will be displayed to users on the maintenance page
          </p>
        </div>

        {/* Allowed IP Addresses */}
        <div className="space-y-2">
          <Label htmlFor="allowed-ips">Allowed IP Addresses</Label>
          <Input
            id="allowed-ips"
            value={allowedIpsInput}
            onChange={(e) => setAllowedIpsInput(e.target.value)}
            placeholder="e.g., 192.168.1.100, 10.0.0.50"
          />
          <p className="text-xs text-gray-500">
            Comma-separated list of IP addresses that can bypass maintenance mode
          </p>
        </div>

        {/* Secret Key */}
        <div className="space-y-2">
          <Label htmlFor="secret-key">Emergency Access Key</Label>
          <Input
            id="secret-key"
            value={settings.secretKey || ''}
            onChange={(e) => setSettings(prev => ({ ...prev, secretKey: e.target.value }))}
            placeholder="e.g., emergency-access-2024"
          />
          <p className="text-xs text-gray-500">
            Users can bypass maintenance by adding ?secret=your-key to any URL
          </p>
        </div>

        {/* Warning Message */}
        {settings.enabled && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <h4 className="font-medium text-red-800">Maintenance Mode is Active</h4>
                <p className="text-sm text-red-700 mt-1">
                  All users (except admins and allowed IPs) are currently being redirected to the maintenance page. 
                  The website is effectively offline for regular users.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Save Button */}
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className={`w-full ${settings.enabled ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              {settings.enabled ? 'Update Maintenance Settings' : 'Save Settings'}
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}