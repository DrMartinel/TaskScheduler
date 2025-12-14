'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface ThemeColors {
  lightBg: string;
  lightText: string;
  darkBg: string;
  darkText: string;
}

const defaultColors: ThemeColors = {
  lightBg: '#ffffff',
  lightText: '#000000',
  darkBg: '#0a0a0a',
  darkText: '#ffffff',
};

export default function Settings() {
  const [colors, setColors] = useState<ThemeColors>(defaultColors);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    // Load saved colors from localStorage
    const savedColors = localStorage.getItem('themeColors');
    if (savedColors) {
      try {
        setColors(JSON.parse(savedColors));
      } catch (e) {
        console.error('Error loading theme colors:', e);
      }
    }

    // Check current theme
    const html = document.documentElement;
    setIsDarkMode(html.classList.contains('dark'));
  }, []);

  useEffect(() => {
    // Apply colors to CSS variables
    const root = document.documentElement;
    root.style.setProperty('--custom-light-bg', colors.lightBg);
    root.style.setProperty('--custom-light-text', colors.lightText);
    root.style.setProperty('--custom-dark-bg', colors.darkBg);
    root.style.setProperty('--custom-dark-text', colors.darkText);
    
    // Apply to Tailwind variables based on current theme
    if (isDarkMode) {
      root.style.setProperty('--background', colors.darkBg);
      root.style.setProperty('--foreground', colors.darkText);
    } else {
      root.style.setProperty('--background', colors.lightBg);
      root.style.setProperty('--foreground', colors.lightText);
    }
  }, [colors, isDarkMode]);

  const handleColorChange = (key: keyof ThemeColors, value: string) => {
    const newColors = { ...colors, [key]: value };
    setColors(newColors);
    localStorage.setItem('themeColors', JSON.stringify(newColors));
  };

  const handleReset = () => {
    setColors(defaultColors);
    localStorage.setItem('themeColors', JSON.stringify(defaultColors));
  };

  const toggleTheme = () => {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      setIsDarkMode(false);
      localStorage.setItem('themeMode', 'light');
      // Apply light mode colors
      html.style.setProperty('--background', colors.lightBg);
      html.style.setProperty('--foreground', colors.lightText);
    } else {
      html.classList.add('dark');
      setIsDarkMode(true);
      localStorage.setItem('themeMode', 'dark');
      // Apply dark mode colors
      html.style.setProperty('--background', colors.darkBg);
      html.style.setProperty('--foreground', colors.darkText);
    }
  };

  return (
    <div className="min-h-[400px] p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
            <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Settings</h2>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Customize your app appearance</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Theme Toggle */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Theme Mode</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">Switch between light and dark mode</p>
            </div>
            <button
              onClick={toggleTheme}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isDarkMode ? 'bg-gray-900 dark:bg-gray-100' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isDarkMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Current: <span className="font-medium">{isDarkMode ? 'Dark' : 'Light'}</span>
          </div>
        </div>

        {/* Light Mode Colors */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Light Mode Colors</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">Background Color</label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={colors.lightBg}
                  onChange={(e) => handleColorChange('lightBg', e.target.value)}
                  className="w-16 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={colors.lightBg}
                  onChange={(e) => handleColorChange('lightBg', e.target.value)}
                  className="flex-1"
                  placeholder="#ffffff"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">Text Color</label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={colors.lightText}
                  onChange={(e) => handleColorChange('lightText', e.target.value)}
                  className="w-16 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={colors.lightText}
                  onChange={(e) => handleColorChange('lightText', e.target.value)}
                  className="flex-1"
                  placeholder="#000000"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dark Mode Colors */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Dark Mode Colors</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">Background Color</label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={colors.darkBg}
                  onChange={(e) => handleColorChange('darkBg', e.target.value)}
                  className="w-16 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={colors.darkBg}
                  onChange={(e) => handleColorChange('darkBg', e.target.value)}
                  className="flex-1"
                  placeholder="#0a0a0a"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1.5">Text Color</label>
              <div className="flex gap-2">
                <Input
                  type="color"
                  value={colors.darkText}
                  onChange={(e) => handleColorChange('darkText', e.target.value)}
                  className="w-16 h-10 cursor-pointer"
                />
                <Input
                  type="text"
                  value={colors.darkText}
                  onChange={(e) => handleColorChange('darkText', e.target.value)}
                  className="flex-1"
                  placeholder="#ffffff"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Reset Button */}
        <div className="pt-4">
          <Button
            onClick={handleReset}
            variant="outline"
            className="w-full"
          >
            Reset to Default Colors
          </Button>
        </div>
      </div>
    </div>
  );
}

