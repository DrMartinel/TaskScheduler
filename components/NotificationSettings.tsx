'use client';

import { useState, useEffect } from 'react';

export default function NotificationSettings() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isNotificationSupported, setIsNotificationSupported] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Check if we're in the browser environment and if Notification API is supported
    const isBrowser = typeof window !== 'undefined';
    const supported = isBrowser && 'Notification' in window;
    setIsNotificationSupported(supported);
    
    // Check browser support and get current permission status
    if (supported) {
      setPermission(Notification.permission);
    }
  }, []);

  // Listen for permission changes (in case user changes it in browser settings)
  useEffect(() => {
    if (!isNotificationSupported || !isMounted) {
      return;
    }

    // Check permission periodically (browsers don't provide a direct event for permission changes)
    const interval = setInterval(() => {
      if (isNotificationSupported) {
        const currentPermission = Notification.permission;
        if (currentPermission !== permission) {
          setPermission(currentPermission);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [permission, isNotificationSupported, isMounted]);

  const requestPermission = async () => {
    // Check browser support for the Notifications Web API
    // Reference: https://developer.mozilla.org/en-US/docs/Web/API/Notification
    if (!isNotificationSupported) {
      alert('This browser does not support desktop notifications');
      return;
    }

    try {
      // Request permission (returns a Promise)
      // This must be called in response to a user gesture (button click)
      const perm = await Notification.requestPermission();
      setPermission(perm);

      // Update permission state in parent component if needed
      // The permission state is automatically synced via Notification.permission
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const getPermissionStatus = () => {
    switch (permission) {
      case 'granted':
        return { text: 'Enabled', color: 'text-green-600 dark:text-green-400', bg: 'bg-green-100 dark:bg-green-900/30' };
      case 'denied':
        return { text: 'Blocked', color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/30' };
      default:
        return { text: 'Not Set', color: 'text-gray-600 dark:text-gray-400', bg: 'bg-gray-100 dark:bg-gray-800' };
    }
  };

  const triggerTestNotification = () => {
    if (!isNotificationSupported) {
      alert('This browser does not support desktop notifications');
      return;
    }

    const currentPermission = Notification.permission;
    if (currentPermission !== 'granted') {
      alert('Please enable notifications first');
      return;
    }

    try {
      const now = new Date();
      const timeString = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      });

      const notification = new Notification('Test Notification', {
        body: `This is a test notification. Current time: ${timeString}`,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'test-notification',
        requireInteraction: false,
        silent: false,
      });

      // Auto-close notification after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      // Handle click event on notification
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
      };

      // Handle error event
      notification.onerror = (error) => {
        console.error('Notification error:', error);
        alert('Failed to show notification. Please check your browser settings.');
      };
    } catch (error) {
      console.error('Error creating notification:', error);
      alert('Failed to show notification. Please check your browser settings.');
    }
  };

  const status = getPermissionStatus();

  // Don't render until mounted (prevents SSR issues)
  if (!isMounted || !isNotificationSupported) {
    return null; // Notifications not supported or not yet mounted
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        title="Notification Settings"
      >
        <svg
          className={`w-4 h-4 ${status.color}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        <span className={`text-xs font-medium ${status.color}`}>
          {status.text}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-800 z-20 p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Notifications
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                  You'll receive notifications 30 seconds before tasks start.
                </p>
                <div className={`px-3 py-2 rounded-lg ${status.bg}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Status:
                    </span>
                    <span className={`text-xs font-semibold ${status.color}`}>
                      {status.text}
                    </span>
                  </div>
                </div>
              </div>

              {permission !== 'granted' && (
                <button
                  onClick={requestPermission}
                  className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  {permission === 'denied'
                    ? 'Enable in Browser Settings'
                    : 'Enable Notifications'}
                </button>
              )}

              {permission === 'denied' && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Notifications are blocked. Please enable them in your browser settings.
                </p>
              )}

              {permission === 'granted' && (
                <button
                  onClick={triggerTestNotification}
                  className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white text-xs font-medium rounded-lg transition-colors border border-gray-200 dark:border-gray-700"
                >
                  Test Notification
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
