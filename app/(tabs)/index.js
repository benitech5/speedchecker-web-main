import { NavigationContainer,NavigationIndependentTree } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import WelcomeScreen from './screens/WelcomeScreen';
import HomeScreen from './screens/HomeScreen';
import CheckerScreen from './screens/CheckerScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationIndependentTree>
    <NavigationContainer independent={true}>
      <Stack.Navigator screenOptions={{headerShown:false}}  initialRouteName="Welcome" >
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Checker" component={CheckerScreen} />
      </Stack.Navigator>
    </NavigationContainer>
    </NavigationIndependentTree>
  );
};

export default App;
