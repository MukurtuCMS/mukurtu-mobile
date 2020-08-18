import React from 'react';
import { Platform } from 'react-native';
import {createStackNavigator} from "react-navigation-stack";
import {createBottomTabNavigator} from "react-navigation-tabs";
import TabBarIcon from '../components/TabBarIcon';
import HomeScreen from '../screens/HomeScreen';
import CreateContentScreen from '../screens/CreateContentScreen';
import CreateContentFormScreen from '../screens/CreateContentFormScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import LogoutScreen from '../screens/LogoutScreen';
import HelpScreen from '../screens/HelpScreen';
import AboutScreen from '../screens/AboutScreen';
import OfflineScreen from '../screens/OfflineScreen';
import WebviewScreen from "../screens/WebviewScreen";
import NodeScreen from "../screens/NodeScreen";
import NodeListing from "../screens/NodeListingScreen";
import CategoryScreen from "../screens/CategoryScreen";
import Colors from "../constants/Colors";

const defaultScreenOptions = {
  headerBackTitleVisible: false,
  headerStyle: {
    backgroundColor: Colors.gold,
    height: 50
  },
  headerTintColor: Colors.black
}

const HomeStack = createStackNavigator(
  {
    Home: {screen: HomeScreen},
    NodeListing: {screen: NodeListing},
    Node: {screen: NodeScreen},
    Category: {
      screen: CategoryScreen,
      navigationOptions: ({navigation}) => ({
        title: navigation.state.params.name
      })
    },
    EditContentForm: {screen: CreateContentFormScreen}
  },
  {
    defaultNavigationOptions: defaultScreenOptions
  }
);

HomeStack.navigationOptions = {
  tabBarLabel: 'View Content',
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

const CreateContentStack = createStackNavigator(
  {
    Links: {screen: CreateContentScreen},
    CreateContentForm: {screen: CreateContentFormScreen}
  },
  {
    defaultNavigationOptions: defaultScreenOptions
  }
);

CreateContentStack.navigationOptions = {
  tabBarLabel: 'Create Content',
  tabBarIcon: ({ focused }) => (
    <TabBarIcon
      focused={focused}
      name={Platform.OS === 'ios' ? 'ios-link' : 'md-link'}
    />
  ),
};

const SettingsStack = createStackNavigator(
  {
    Settings: {screen: SettingsScreen},
    Login: {screen: LoginScreen},
    Logout: {screen: LogoutScreen},
    Help: HelpScreen,
    About: AboutScreen,
    Offline: OfflineScreen
  },
  {
    defaultNavigationOptions: defaultScreenOptions
  }
);

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

const WebviewStack = createStackNavigator(
  {
    Webview: {screen: WebviewScreen}
  },
  {
    defaultNavigationOptions: defaultScreenOptions
  }
);

WebviewStack.navigationOptions = {
  tabBarLabel: 'Browse Site',
  tabBarIcon: ({focused}) => (
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
  WebviewStack,
  SettingsStack
}, {
  tabBarOptions: {
    adaptive: true,
    style: {
      paddingTop: Platform.OS === 'ios' ? 0 : 0,
      marginBottom: Platform.OS === 'ios' ? 0 : 10,

    },
    labelStyle: {
      alignSelf: "center"
    },
    // safeAreaInset: {bottom: 'never'},
  }
});
