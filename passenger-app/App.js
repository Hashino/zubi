import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import SplashScreen from './src/screens/SplashScreen';
import HomeScreen from './src/screens/HomeScreen';
import SearchScreen from './src/screens/SearchScreen';
import TripScreen from './src/screens/TripScreen';
import PaymentScreen from './src/screens/PaymentScreen';
import { P2PProvider } from './src/services/P2PService';
import { AppProvider } from '../shared/contexts/AppContext';

const Stack = createStackNavigator();

export default function App() {
  return (
    <AppProvider userType="passenger">
      <P2PProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="Splash"
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
              name="Splash" 
              component={SplashScreen}
              options={{ headerShown: false }}
            />
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
            <Stack.Screen 
              name="Payment" 
              component={PaymentScreen}
              options={{ title: 'Pagamento' }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </P2PProvider>
    </AppProvider>
  );
}
