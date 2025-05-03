import React, { createContext, useState, useEffect, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { Provider as PaperProvider } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme } from '../utils/theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const deviceTheme = useColorScheme();
  const [theme, setTheme] = useState('system');
  const [paperTheme, setPaperTheme] = useState(
    deviceTheme === 'dark' ? darkTheme : lightTheme
  );

  // Load saved theme preference
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme) {
          setTheme(savedTheme);
          updateTheme(savedTheme, deviceTheme);
        }
      } catch (error) {
        console.error('Failed to load theme preference:', error);
      }
    };

    loadTheme();
  }, [deviceTheme]);

  // Update theme when device theme changes
  useEffect(() => {
    if (theme === 'system') {
      setPaperTheme(deviceTheme === 'dark' ? darkTheme : lightTheme);
    }
  }, [deviceTheme, theme]);

  const updateTheme = (newTheme, systemTheme = deviceTheme) => {
    setTheme(newTheme);
    
    switch (newTheme) {
      case 'light':
        setPaperTheme(lightTheme);
        break;
      case 'dark':
        setPaperTheme(darkTheme);
        break;
      case 'system':
      default:
        setPaperTheme(systemTheme === 'dark' ? darkTheme : lightTheme);
        break;
    }
    
    // Save theme preference
    AsyncStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme, isDark: paperTheme === darkTheme }}>
      <PaperProvider theme={paperTheme}>
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);