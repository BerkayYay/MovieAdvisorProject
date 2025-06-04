/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import {StatusBar} from 'react-native';
import AppNavigator from './src/navigation/AppNavigator';
import {StorageProvider} from './src/context/StorageContext';

function App(): React.JSX.Element {
  return (
    <StorageProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#1a1a1a"
        translucent={false}
      />
      <AppNavigator />
    </StorageProvider>
  );
}

export default App;
