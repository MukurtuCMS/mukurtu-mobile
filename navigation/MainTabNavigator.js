import React from 'react';
import { Platform } from 'react-native';
import { createStackNavigator, createBottomTabNavigator } from 'react-navigation';

import TabBarIcon from '../components/TabBarIcon';
import HomeScreen from '../screens/HomeScreen';
import CreateContentScreen from '../screens/CreateContentScreen';
import CreateContentFormScreen from '../screens/CreateContentFormScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import LogoutScreen from '../screens/LogoutScreen';
import HelpScreen from '../screens/HelpScreen';
import AboutScreen from '../screens/AboutScreen';
import WebviewScreen from "../screens/WebviewScreen";
import NodeScreen from "../screens/NodeScreen";

const HomeStack = createStackNavigator({
  Home: { screen: HomeScreen },
  Node: { screen: NodeScreen}
});

HomeStack.navigationOptions = {
  tabBarLabel: 'Home',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon
      focused={focused}
      name={
        Platform.OS === 'ios'
          ? `ios-information-circle${focused ? '' : '-outline'}`
          : 'md-information-circle'
      }
    />
  ),
};

const CreateContentStack = createStackNavigator({
  Links: {screen: CreateContentScreen},
  CreateContentForm: {screen: CreateContentFormScreen}
});

CreateContentStack.navigationOptions = {
  tabBarLabel: 'Create Content',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon
      focused={focused}
      name={Platform.OS === 'ios' ? 'ios-link' : 'md-link'}
    />
  ),
};

const SettingsStack = createStackNavigator({
  Settings: { screen: SettingsScreen },
  Login: { screen: LoginScreen },
  Logout: { screen: LogoutScreen },
  Help: HelpScreen,
  About: AboutScreen
});

SettingsStack.navigationOptions = {
  tabBarLabel: 'Settings',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon
      focused={focused}
      name={Platform.OS === 'ios' ? 'ios-options' : 'md-options'}
    />
  ),
  params: {
    loginScreen: true
  }
};

const WebviewStack = createStackNavigator({
  Webview: { screen: WebviewScreen }
});

WebviewStack.navigationOptions = {
  tabBarLabel: 'Browse Site',
  tabBarIcon: ({ focused }) => (
      <TabBarIcon
          focused={focused}
          name={
            Platform.OS === 'ios'
                ? `ios-information-circle${focused ? '' : '-outline'}`
                : 'md-information-circle'
          }
      />
  ),
};



export default createBottomTabNavigator({
  HomeStack,
  CreateContentStack,
  SettingsStack,
  WebviewStack
});
