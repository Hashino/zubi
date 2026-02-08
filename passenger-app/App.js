import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import TripScreen from './src/screens/TripScreen';
import { P2PProvider } from './src/services/P2PService';

const Stack = createStackNavigator();

export default function App() {
  return (
    <P2PProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: {
              backgroundColor: '#4CAF50',
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
            options={{ title: 'Zubi - Passageiro' }}
          />
          <Stack.Screen 
            name="Search" 
            component={SearchScreen}
            options={{ title: 'Buscar Motorista' }}
          />
          <Stack.Screen 
            name="Trip" 
            component={TripScreen}
            options={{ title: 'Em Viagem' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </P2PProvider>
  );
}
