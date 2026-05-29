import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigation } from './src/presentation/navigation/AppNavigation';
import { GlobalToast } from './src/presentation/components/shared/GlobalToast';
import { useSettingsStore } from './src/presentation/store/useSettingsStore';

const App = () => {
  useEffect(() => {
    useSettingsStore.getState().inicializarAjustes();
  }, []);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigation />
        <GlobalToast />
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;