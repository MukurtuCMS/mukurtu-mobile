import React from 'react';
import SettingsOverview from '../components/SettingsOverview';
import * as Colors from "../constants/Colors";

export default class SettingsScreen extends React.Component {
  static navigationOptions = {
    title: 'Settings',
    headerStyle: {
      backgroundColor: Colors.default.gold,
      marginTop: -20,
    },
  };

  render() {
    /* Go ahead and delete ExpoConfigView and replace it with your
     * content, we just wanted to give you a quick view of your config */
    return <SettingsOverview navigation={this.props.navigation} screenProps={this.props.screenProps}   />;
  }
}
