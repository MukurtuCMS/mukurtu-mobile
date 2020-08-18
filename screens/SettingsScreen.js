import React from 'react';
import SettingsOverview from '../components/SettingsOverview';
import {SafeAreaView} from "react-native";

export default class SettingsScreen extends React.Component {
  static navigationOptions = {
    title: 'Settings'
  };

  componentDidMount() {
    const { navigation } = this.props;
    this.focusListener = navigation.addListener('didBlur', () => {
      this.props.screenProps.checkLogin(true);
    });
  }

  componentWillUnmount() {
    this.focusListener.remove();
  }

  render() {
    /* Go ahead and delete ExpoConfigView and replace it with your
     * content, we just wanted to give you a quick view of your config */
    return (<SafeAreaView style={{flex: 1}}>
      <SettingsOverview
        navigation={this.props.navigation}
        screenProps={this.props.screenProps}/>
    </SafeAreaView>);
  }
}
