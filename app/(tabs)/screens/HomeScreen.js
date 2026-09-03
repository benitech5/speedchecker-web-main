import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform
} from 'react-native';

const HomeScreen = ({ navigation }) => {
  // State variables to hold form input values
  const [driverName, setDriverName] = useState('');
  const [carNumber, setCarNumber] = useState('');
  const [driverSex, setDriverSex] = useState('');
  const [selectedOption, setSelectedOption] = useState('default');
  const [speedLimit, setSpeedLimit] = useState('');

  // Handle speed limit input with validation
  const handleSpeedLimitChange = (value) => {
    const numericValue = parseFloat(value);

    if (value === '' || isNaN(numericValue)) {
      setSpeedLimit(value); // Allow clearing the input
    } else if (numericValue > 160) {
      Alert.alert('Invalid Input', 'Speed limit cannot exceed 160.');
    } else {
      setSpeedLimit(value);
    }
  };

  const renderCustomText = () => {
    switch (selectedOption) {
      case 'default':
        return <Text style={styles.customText}>Default mode: This mode provides a general speed limit check based on standard settings.</Text>;
      case 'personalized':
        return <Text style={styles.customText}>Personalized mode: This mode allows you to set a specific speed limit based on your preferences. Should only be used for testing and educational purposes only!</Text>;
      default:
        return null;
    }
  };

  const handleStartSpeedCheck = () => {
    // Check if required fields are not empty
    if (!driverName.trim() || !carNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter both Driver Name and Car Number.');
      return; // Exit the function if validation fails
    }

    // Set default speed limit if 'default' option is selected
    const effectiveSpeedLimit = selectedOption === 'default' ? '80' : speedLimit;

    // Navigate to CheckerScreen with parameters
    navigation.navigate('Checker', {
      driverName,
      carNumber,
      driverSex,
      speedLimit: effectiveSpeedLimit,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.innerContainer}>
          <Text style={styles.appName}>FleetMonitor Speed Checker</Text>
          <View style={styles.formContainer}>
            <TextInput
              style={styles.input}
              placeholder="Driver Name"
              placeholderTextColor="#888"
              value={driverName}
              onChangeText={setDriverName}
            />
            <TextInput
              style={styles.input}
              placeholder="Car Number"
              placeholderTextColor="#888"
              value={carNumber}
              onChangeText={setCarNumber}
            />
            <TextInput
              style={styles.input}
              placeholder="Sex (M/F)"
              placeholderTextColor="#888"
              value={driverSex}
              onChangeText={setDriverSex}
            />
            <Text style={styles.radioTitle}>Select Mode:</Text>
            <View style={styles.radioContainer}>
              <TouchableOpacity
                style={styles.radioButton}
                onPress={() => setSelectedOption('default')}
              >
                <View style={[styles.radioCircle, selectedOption === 'default' && styles.selectedRadioCircle]} />
                <Text style={styles.radioText}>Default</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.radioButton}
                onPress={() => setSelectedOption('personalized')}
              >
                <View style={[styles.radioCircle, selectedOption === 'personalized' && styles.selectedRadioCircle]} />
                <Text style={styles.radioText}>Personalized</Text>
              </TouchableOpacity>
            </View>
            {renderCustomText()}
            {selectedOption === 'personalized' && (
              <TextInput
                style={styles.input}
                placeholder="Enter Speed Limit"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={speedLimit}
                onChangeText={handleSpeedLimitChange}
              />
            )}
            <Button
              title="Start Speed Check"
              onPress={handleStartSpeedCheck}
              color="#FF2D55"
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  appName: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FF2D55',
    textAlign: 'center',
    marginTop: 60,
    marginBottom: 10
  },
  formContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: 'white',
    padding: 20,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  input: {
    height: 40,
    borderColor: '#FF2D55',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 15,
    color: 'black',
  },
  radioTitle: {
    fontSize: 18,
    marginBottom: 10,
    color: '#000',
  },
  radioContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  radioButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#FF2D55',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  selectedRadioCircle: {
    backgroundColor: '#FF2D55',
  },
  radioText: {
    fontSize: 16,
    color: '#000',
  },
  customText: {
    fontSize: 16,
    color: '#333',
    marginVertical: 10,
    textAlign: 'center',
  },
});

export default HomeScreen;
