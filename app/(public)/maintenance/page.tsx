"use client";

import { useEffect, useState } from 'react';
import { Clock, Settings, AlertTriangle, RefreshCw } from 'lucide-react';

export default function MaintenancePage() {
  const [message, setMessage] = useState('We’re updating our website to serve you better. Please check back shortly!');
  const [enabledAt, setEnabledAt] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Fetch maintenance settings
    fetch('/api/admin/maintenance')
      .then((res) => res.json())
      .then((data) => {
        if (data.enabled) {
          setMessage(data.message);
          setEnabledAt(data.enabledAt);
        }
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Failed to fetch maintenance settings:', error);
        setIsLoading(false);
      });

    // Auto-refresh countdown
    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // Auto-refresh page when countdown reaches 0
          window.location.reload();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, []);

  return (
    <div className="min-h-screen text-white relative overflow-hidden">
      {/* Background image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        // style={{ backgroundImage: 'url(/maintenance.svg)' }}
      />
      
      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"></div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center p-4">
        <div className="max-w-4xl text-center space-y-8">
          {/* Loading state */}
          {isLoading ? (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="w-16 h-16 bg-gradient-to-r from-gray-600 to-gray-700 rounded-full flex items-center justify-center animate-pulse">
                  <Settings className="w-8 h-8 text-gray-400 animate-spin" />
                </div>
              </div>
              <div className="space-y-4">
                <div className="h-12 bg-gray-700 rounded-lg animate-pulse mx-auto w-3/4"></div>
                <div className="h-6 bg-gray-700 rounded-lg animate-pulse mx-auto w-1/2"></div>
              </div>
              <div className="h-32 bg-gray-700 rounded-xl animate-pulse mx-auto w-full max-w-md"></div>
            </div>
          ) : (
            <>
              {/* Header section */}
              <div className="space-y-4">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center animate-pulse">
                      <Settings className="w-10 h-10 text-white animate-spin" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center animate-bounce">
                      <AlertTriangle className="w-4 h-4 text-white" />
                    </div>
                  </div>
                </div>
                
                <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent">
                  Under Maintenance
                </h1>
                
                <p className="text-xl md:text-2xl text-gray-300 max-w-2xl mx-auto leading-relaxed">
                  {message}
                </p>
              </div>

          {/* Maintenance info cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            {/* Time info */}
            {enabledAt && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <div className="flex items-center justify-center mb-3">
                  <Clock className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Maintenance Started</h3>
                <p className="text-gray-300 text-sm">
                  {new Date(enabledAt).toLocaleString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}

            {/* Auto-refresh countdown */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <div className="flex items-center justify-center mb-3">
                <RefreshCw className="w-6 h-6 text-green-400 animate-spin" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Auto Refresh</h3>
              <p className="text-gray-300 text-sm">
                Page will refresh in <span className="text-green-400 font-bold">{countdown}</span> seconds
              </p>
            </div>
          </div>

          {/* Maintenance illustration */}
          <div className="mt-8">
            <img 
              src="/maintenance.svg" 
              alt="Maintenance Illustration" 
              className="max-w-md mx-auto opacity-80 hover:opacity-100 transition-opacity duration-300"
            />
          </div>

          {/* Footer message */}
          <div className="pt-8">
            <p className="text-gray-400 text-sm">
              Thank you for your patience. We'll be back online shortly.
            </p>
            <p className="text-gray-500 text-xs mt-2">
              This page will automatically refresh when the website is available again.
            </p>
          </div>
        </>
      )}
        </div>
      </div>

      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none"></div>
    </div>
  );
}