import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { store } from './src/store';
import './src/i18n'; 
import AuthInitializer from './src/components/AuthInitializer';
import SignUpScreen from './src/screens/SignUpScreen';
import SignInScreen from './src/screens/SignInScreen';
import HomeScreen from './src/screens/HomeScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import PersonalInformationScreen from './src/screens/PersonalInformationScreen';
import ActiveServicesScreen from './src/screens/ActiveServicesScreen';
import PaymentMethodsScreen from './src/screens/PaymentMethodsScreen';
import ChangePasswordScreen from './src/screens/ChangePasswordScreen';
import AccessByQRCodeScreen from './src/screens/AccessByQRCodeScreen';
import GenerateQRCodeScreen from './src/screens/GenerateQRCodeScreen';
import QRCodeResultScreen from './src/screens/QRCodeResultScreen';
import CameraScreen from './src/screens/CameraScreen';
import SmartIntercomScreen from './src/screens/SmartIntercomScreen';
import ElevatorScreen from './src/screens/ElevatorScreen';
import PinAccessScreen from './src/screens/PinAccessScreen';
import FaceRecognitionScreen from './src/screens/FaceRecognitionScreen';
import SubscriptionsScreen from './src/screens/SubscriptionsScreen';
import FamilyMembersScreen from './src/screens/FamilyMembersScreen';

const Stack = createNativeStackNavigator();

export default function App() {  
  return (
    <Provider store={store}>
      <AuthInitializer />
      <NavigationContainer>
        <StatusBar style="auto" />
        <Stack.Navigator
          initialRouteName="SignUp"
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Profile" component={ProfileScreen} />
          <Stack.Screen name="PersonalInformation" component={PersonalInformationScreen} />
          <Stack.Screen name="ActiveServices" component={ActiveServicesScreen} />
          <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
          <Stack.Screen name="AccessByQRCode" component={AccessByQRCodeScreen} />
          <Stack.Screen name="GenerateQRCode" component={GenerateQRCodeScreen} />
          <Stack.Screen name="QRCodeResult" component={QRCodeResultScreen} />
          <Stack.Screen name="Camera" component={CameraScreen} />
          <Stack.Screen name="SmartIntercom" component={SmartIntercomScreen} />
          <Stack.Screen name="Elevator" component={ElevatorScreen} />
          <Stack.Screen name="PinAccess" component={PinAccessScreen} />
          <Stack.Screen name="FaceRecognition" component={FaceRecognitionScreen} />
          <Stack.Screen name="Subscriptions" component={SubscriptionsScreen} />
          <Stack.Screen name="FamilyMembers" component={FamilyMembersScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </Provider>
  );
}