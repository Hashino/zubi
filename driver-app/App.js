import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import OnlineScreen from './src/screens/OnlineScreen';
import TripScreen from './src/screens/TripScreen';
import { DriverProvider } from './src/services/DriverService';
import { AppProvider } from '../shared/contexts/AppContext';

const Stack = createStackNavigator();

export default function App() {
  return (
    <AppProvider userType="driver">
      <DriverProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Splash"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#2196F3',
              },
              headerTintColor: '#fff',
              headerTitleStyle: {
                fontWeight: 'bold',
              },
            }}
          >
            <Stack.Screen 
              name="Splash" 
              component={SplashScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="Home" 
              component={HomeScreen}
              options={{ title: 'Zubi - Motorista' }}
            />
            <Stack.Screen 
              name="Online" 
              component={OnlineScreen}
              options={{ title: 'Disponível' }}
            />
            <Stack.Screen 
              name="Trip" 
              component={TripScreen}
              options={{ title: 'Viagem em Andamento' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </DriverProvider>
    </AppProvider>
  );
}
