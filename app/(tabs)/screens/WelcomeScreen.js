import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Linking } from 'react-native';

const WelcomeScreen = ({ navigation }) => {
  const handleLinkPress = () => {
    // Replace with the URL you want to open
    Linking.openURL('https://www.example.com/more-info')
      .catch((err) => Alert.alert("Failed to open link", err.message));
  };

  return (
    <View style={styles.container}>
      {/* Apple News Icon */}
      <View style={styles.iconWrapper}>
        <View style={styles.icon}></View>
      </View>

      {/* Welcome Text */}
      <View style={styles.textWrapper}>
        <Text style={styles.title}>Welcome to</Text>
        <Text style={styles.appName}>SmartStart Speed Checker</Text>
        <Text style={styles.subtitle}>
          OVERSPEEDING kills. The best app developed for you to help check overspeeding.
        </Text>
      </View>

      {/* Information Text */}
      <View style={styles.infoWrapper}>
        <Text style={styles.infoText}>
          SmartStart is an app that’s developed to check speed of moving vehicles and detect overspeeding. However this app might not be 100% accurate. This app uses GPS and location services to check speed and therefore requires good internet connectivity.
        </Text>
        <TouchableOpacity onPress={handleLinkPress}>
          <Text style={styles.linkText}>press to read and know more...</Text>
        </TouchableOpacity>
      </View>

      {/* Continue Button */}
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    justifyContent: 'center', 
    alignItems: 'center',
  },
  iconWrapper: {
    marginBottom: 20,  
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    width: 80,
    height: 80,
    backgroundColor: '#FF2D55',
    borderRadius: 15,
  },
  textWrapper: {
    marginBottom: 30,  
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    color: '#fff',
    textAlign: 'center',
    marginBottom: 5,
  },
  appName: {
    fontSize: 35,
    fontWeight: 'bold',
    color: '#FF2D55',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 70,
  },
  infoWrapper: {
    alignItems: 'center',
    marginBottom: 30,
  },
  infoText: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
    marginBottom: 5,
  },
  linkText: {
    fontSize: 16,
    color: '#FF2D55',
    textAlign: 'center',
   
  },
  button: {
    backgroundColor: '#FF2D55',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    textAlign: 'center',
  },
});

export default WelcomeScreen;
