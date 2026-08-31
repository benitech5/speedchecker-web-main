import React, { useState, useEffect, useRef } from 'react';
import { Text, View, StyleSheet, FlatList, ScrollView, Pressable, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Location from 'expo-location';
import haversine from 'haversine';
import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { Audio } from 'expo-av';

const CheckerScreen = ({ route }) => {
  const { driverName, carNumber, driverSex, speedLimit } = route.params;
  const navigation = useNavigation();
  const [location, setLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [lat1, setLat1] = useState(null);
  const [long1, setLong1] = useState(null);
  const [lat2, setLat2] = useState(null);
  const [long2, setLong2] = useState(null);
  const [seconds, setSeconds] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [speed, setSpeed] = useState(0);
  const [overspeed, setOverspeed] = useState(false);
  const [speedLog, setSpeedLog] = useState([]);
  const [sessionEnded, setSessionEnded] = useState(false);

  const [warningSound, setWarningSound] = useState(null);
  const [isPlayingSound, setIsPlayingSound] = useState(false);

  const addLog = (speedValue, distanceValue, isOverspeeding) => {
    console.log('addLog called with:', { speedValue, distanceValue, isOverspeeding });
    // Always log every 10 seconds, but indicate if it's likely GPS noise
    if (distanceValue !== null) {
      const logEntry = {
        speed: speedValue.toFixed(2),
        distance: distanceValue.toFixed(6), // Show more decimals for tiny movements
        overspeed: isOverspeeding ? 'Yes' : 'No',
      };
      console.log('Adding log entry:', logEntry);
      setSpeedLog((prevLog) => {
        const newLog = [...prevLog, logEntry];
        console.log('New speed log length:', newLog.length);
        return newLog;
      });
      return true; // Log was added
    } else {
      console.log('Adding timeout entry');
      setSpeedLog((prevLog) => [...prevLog, { speed: 'Timed Out', distance: 'Timed Out', overspeed: 'Timed Out' }]);
      return true;
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.logRow}>
      <Text style={styles.logItem}>{item.distance}</Text>
      <Text style={styles.logItem}>{item.speed}</Text>
      <Text style={[styles.logItem, item.overspeed === 'Yes' && styles.overspeed]}>
        {item.overspeed}
      </Text>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.logRow}>
      <Text style={styles.logHeader}>Distance</Text>
      <Text style={styles.logHeader}>Speed</Text>
      <Text style={styles.logHeader}>Overspeed</Text>
    </View>
  );

  const calculateDistance = (lat1, long1, lat2, long2) => {
    const start = { latitude: lat1, longitude: long1 };
    const end = { latitude: lat2, longitude: long2 };
    return haversine(start, end, { unit: 'km' });
  };

  // Initialize audio on component mount
  useEffect(() => {
    const initializeSound = async () => {
      try {
        console.log('Initializing sound...');
        const { sound } = await Audio.Sound.createAsync(require('../screens/warning.mp3'));
        setWarningSound(sound);
        console.log('Sound initialized successfully');
      } catch (error) {
        console.error('Error initializing sound:', error);
      }
    };
    
    initializeSound();
    return () => {
      // Cleanup sound when component unmounts
      if (warningSound) {
        warningSound.unloadAsync();
      }
    };
  }, []);

  // Request location permission and start session
  useEffect(() => {
    (async () => {
      console.log('Requesting location permissions...');
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
        setErrorMsg('Permission to access location was denied');
        return;
      }
      console.log('Location permission granted, starting session');
      setIsActive(true);
    })();
  }, []);

  // Timer logic
  useEffect(() => {
    let interval;
    if (isActive && !sessionEnded) {
      console.log('Timer is active, starting interval');
      interval = setInterval(() => {
        setSeconds((prevSeconds) => {
          const newSeconds = prevSeconds + 1;
          console.log('Timer tick:', newSeconds);
          return newSeconds;
        });
      }, 1000);
    }
    if (seconds === 10) {
      console.log('Timer reached 10, resetting to 0');
      setSeconds(0);
    } else if (!isActive && seconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isActive, seconds, sessionEnded]);

  // Main logic - runs when seconds hits 1 (every 10 seconds)
  useEffect(() => {
    if (seconds === 1 && isActive && !sessionEnded) {
      console.log('Timer hit 1 second, processing location...');
      const processLocationAndSpeed = async () => {
        try {
          // Get current location
          console.log('Getting current location...');
          let location = await Location.getCurrentPositionAsync({ 
            accuracy: Location.Accuracy.Highest,
            mayShowUserSettingsDialog: false
          });
          setLocation(location);
          console.log('Got location:', location.coords.latitude, location.coords.longitude);

          // Update coordinates
          let newLat1 = lat1, newLong1 = long1, newLat2 = lat2, newLong2 = long2;
          
          if (lat1 === null && lat2 === null) {
            newLat1 = location.coords.latitude;
            newLong1 = location.coords.longitude;
            setLat1(newLat1);
            setLong1(newLong1);
            console.log('First GPS reading, no speed calculation yet');
            return; // First reading, can't calculate speed yet
          } else if (lat1 !== null && lat2 === null) {
            newLat2 = location.coords.latitude;
            newLong2 = location.coords.longitude;
            setLat2(newLat2);
            setLong2(newLong2);
            console.log('Second GPS reading');
          } else {
            // Shift coordinates
            newLat1 = lat2;
            newLong1 = long2;
            newLat2 = location.coords.latitude;
            newLong2 = location.coords.longitude;
            setLat1(newLat1);
            setLong1(newLong1);
            setLat2(newLat2);
            setLong2(newLong2);
            console.log('Shifted coordinates for new calculation');
          }

          // Calculate distance and speed
          if (newLat1 && newLong1 && newLat2 && newLong2) {
            const distanceValue = calculateDistance(newLat1, newLong1, newLat2, newLong2);
            console.log('Calculated distance:', distanceValue, 'km');
            setDistance(distanceValue);
            
            const speedValue = parseFloat((distanceValue / (10 / 3600)).toFixed(2));
            console.log('Calculated speed:', speedValue, 'km/h');
            setSpeed(speedValue);
            
            const isOverspeeding = speedValue > parseFloat(speedLimit);
            console.log('Is overspeeding?', isOverspeeding, '(limit:', speedLimit, ')');
            setOverspeed(isOverspeeding);

            // Add log entry
            addLog(speedValue, distanceValue, isOverspeeding);
            
            // Handle sound based on actual movement and overspeed
            if (distanceValue > 0.005 && isOverspeeding) { // 5m threshold for sound
              console.log('Playing warning sound - significant movement and overspeeding');
              playWarningSound();
            } else {
              console.log('Stopping warning sound - no significant movement or not overspeeding');
              stopWarningSound();
            }
          }
        } catch (error) {
          console.error('Error processing location:', error);
          setErrorMsg('Error getting location');
        }
      };

      processLocationAndSpeed();
    }
  }, [seconds, isActive, sessionEnded, lat1, long1, lat2, long2, speedLimit]);

  const playWarningSound = async () => {
    if (!warningSound || sessionEnded || isPlayingSound) return;
    
    try {
      console.log('Attempting to play warning sound');
      setIsPlayingSound(true);
      await warningSound.setIsLoopingAsync(true);
      await warningSound.playAsync();
      console.log('Warning sound started playing');
    } catch (error) {
      console.error('Error playing sound:', error);
      setIsPlayingSound(false);
    }
  };

  const stopWarningSound = async () => {
    if (!warningSound || !isPlayingSound) return;
    
    try {
      console.log('Stopping warning sound');
      await warningSound.stopAsync();
      setIsPlayingSound(false);
      console.log('Warning sound stopped');
    } catch (error) {
      console.error('Error stopping sound:', error);
    }
  };

  const handleEndSession = () => {
    Alert.alert(
      "End Session",
      "Are you sure you want to end the session?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Yes",
          onPress: async () => {
            Alert.alert("Session Ended", "The session has been ended.");
            setIsActive(false);
            setSessionEnded(true);
            setLat1(null);
            setLong1(null);
            setLat2(null);
            setLong2(null);
            setDistance(null);
            setSpeed(0);
            setOverspeed(false);
            setSeconds(0);
            await stopWarningSound(); // Ensure sound is stopped when session ends
          },
        },
      ],
      { cancelable: false }
    );
  };

  const handleDownloadLogs = async () => {
    const htmlContent = `
      <h1>Speed Logs</h1>
      <h2>Driver Details</h2>
      <p><strong>Name:</strong> ${driverName}</p>
      <p><strong>Car Number:</strong> ${carNumber}</p>
      <p><strong>Sex:</strong> ${driverSex}</p>
      <p><strong>Speed Limit:</strong> ${speedLimit} km/h</p>
      <h2>Logs</h2>
      <table border="1" style="width:100%; border-collapse: collapse;">
        <tr>
          <th>Distance (km)</th>
          <th>Speed (km/h)</th>
          <th>Overspeed</th>
        </tr>
        ${speedLog
          .map(
            (log) => `
          <tr>
            <td>${log.distance}</td>
            <td>${log.speed}</td>
            <td>${log.overspeed}</td>
          </tr>`
          )
          .join('')}
      </table>
    `;

    try {
      const { uri: tempUri } = await Print.printToFileAsync({ html: htmlContent });
      const fileUri = FileSystem.documentDirectory + 'SpeedLogs.pdf';

      await FileSystem.moveAsync({
        from: tempUri,
        to: fileUri,
      });

      await Sharing.shareAsync(fileUri);
    } catch (error) {
      Alert.alert('Error', 'There was an error creating or sharing the PDF.');
    }
  };

  const handleExit = () => {
    navigation.navigate('Home');
  };

  let text = 'Waiting..';
  let text1 = 'Waiting..';
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    text = `Start Location: ${lat1}, ${long1}`;
    text1 = `End Location: ${lat2}, ${long2}`;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.appName}>SmartStart Speed Checker</Text>
      </View>
      <View style={styles.formContainer}>
        <Text style={styles.paragraph}>{text}</Text>
        <Text style={styles.paragraph}>{text1}</Text>
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{seconds}</Text>
        </View>
        <Text style={styles.speedLogs}>Speed Logs</Text>
        {distance !== null && <Text style={styles.paragraph}>Distance: {distance.toFixed(2)} km</Text>}
        <Text style={styles.paragraph}>Speed: {speed} km/h</Text>
        <Text style={styles.paragraph}>Overspeed: {overspeed ? 'Yes' : 'No'}</Text>
      </View>
      <View style={styles.listContainer}>
        <FlatList
          data={speedLog}
          renderItem={renderItem}
          keyExtractor={(item, index) => index.toString()}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.logList}
        />
      </View>
      <View style={styles.buttonContainer}>
        {sessionEnded ? (
          <>
            <Pressable
              style={styles.endSessionButton}
              onPress={handleDownloadLogs}
            >
              <Text style={styles.endSessionButtonText}>
                Download Speed Logs
              </Text>
            </Pressable>
            <Pressable
              style={styles.exitButton}
              onPress={handleExit}
            >
              <Text style={styles.exitButtonText}>Exit</Text>
            </Pressable>
          </>
        ) : (
          <Pressable
            style={styles.endSessionButton}
            onPress={handleEndSession}
          >
            <Text style={styles.endSessionButtonText}>
              End Session
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    backgroundColor: 'black',
    paddingVertical: 20,
    alignItems: 'center',
  },
  appName: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FF2D55',
    textAlign: 'center',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  formContainer: {
    alignItems: 'center',
    padding: 20,
  },
  listContainer: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  speedLogs: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF2D55',
    textAlign: 'center',
    marginVertical: 10,
  },
  timerContainer: {
    height: 100,
    width: 100,
    borderColor: 'black',
    borderWidth: 3,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: 48,
  },
  paragraph: {
    fontSize: 18,
    textAlign: 'center',
    color: 'black',
  },
  logRow: {
    flexDirection: 'row',
    margin: 8,
    width: '100%',
    justifyContent: 'space-between',
  },
  logItem: {
    fontSize: 13,
    textAlign: 'center',
    width: '33%',
  },
  logHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    width: '33%',
  },
  overspeed: {
    color: 'red',
  },
  logList: {
    flexGrow: 1,
    alignItems: 'center',
  },
  endSessionButton: {
    marginTop: 20,
    backgroundColor: '#FF2D55',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    alignSelf: 'center',
  },
  endSessionButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  exitButton: {
    marginTop: 20,
    backgroundColor: '#FF2D55',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    width: '80%',
    alignSelf: 'center',
  },
  exitButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default CheckerScreen;
