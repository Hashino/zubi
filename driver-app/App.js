import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';
import OnlineScreen from './src/screens/OnlineScreen';
import TripScreen from './src/screens/TripScreen';
import { DriverProvider } from './src/services/DriverService';

const Stack = createStackNavigator();

export default function App() {
  return (
    <DriverProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
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
  );
}
