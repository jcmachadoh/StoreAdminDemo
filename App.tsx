import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigation } from './src/presentation/navigation/AppNavigation';
import { GlobalToast } from './src/presentation/components/shared/GlobalToast';

const App = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <AppNavigation />
        <GlobalToast /> {/* <-- AQUÍ */}
      </NavigationContainer>
    </SafeAreaProvider>
  );
};

export default App;