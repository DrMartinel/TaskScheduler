'use client';

import { useEffect } from 'react';

export default function ThemeProvider() {
  useEffect(() => {
    // Load theme mode from localStorage
    const savedTheme = localStorage.getItem('themeMode');
    const html = document.documentElement;
    
    if (savedTheme === 'light') {
      html.classList.remove('dark');
    } else if (savedTheme === 'dark') {
      html.classList.add('dark');
    }

    // Load custom colors from localStorage
    const savedColors = localStorage.getItem('themeColors');
    if (savedColors) {
      try {
        const colors = JSON.parse(savedColors);
        html.style.setProperty('--custom-light-bg', colors.lightBg);
        html.style.setProperty('--custom-light-text', colors.lightText);
        html.style.setProperty('--custom-dark-bg', colors.darkBg);
        html.style.setProperty('--custom-dark-text', colors.darkText);
        
        // Apply colors based on current theme
        const currentTheme = savedTheme || (html.classList.contains('dark') ? 'dark' : 'light');
        if (currentTheme === 'dark') {
          html.style.setProperty('--background', colors.darkBg);
          html.style.setProperty('--foreground', colors.darkText);
        } else {
          html.style.setProperty('--background', colors.lightBg);
          html.style.setProperty('--foreground', colors.lightText);
        }
      } catch (e) {
        console.error('Error loading theme colors:', e);
      }
    }
  }, []);

  return null;
}

