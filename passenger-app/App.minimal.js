import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  console.log('[App.minimal] Rendering...');
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>✅ Zubi Passenger App</Text>
      <Text style={styles.subtitle}>Minimal Version - Testing</Text>
      <Text style={styles.info}>If you see this, the app opens successfully!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  text: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#E8F5E9',
    marginBottom: 40,
    textAlign: 'center',
  },
  info: {
    fontSize: 14,
    color: '#C8E6C9',
    textAlign: 'center',
  },
});
