import React from 'react';
import {
  View,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import Colors from "../constants/Colors";
import SettingsList from "react-native-settings-list";

export default class AppHeader extends React.Component {

  constructor(props) {
    super(props);
    const { navigation, screenProps } = this.props;
    this.state = {
      siteInfo: null,
    }
  }

  render() {
    let loginBubbleStyle = styles.loginBubble;

    let pullDownText;
    if (this.props.screenProps.isConnected && this.props.screenProps.loggedIn) {
      loginBubbleStyle = styles.loginBubbleLoggedIn;
      pullDownText = <Text style={styles.smallText}>Pull Down to Sync Content</Text>;
    }

    let siteLogo = <Image
      style={styles.siteIcon}
      source={require('../assets/images/profileIcon.png')}
    />;

    if (this.state.siteInfo && this.state.siteInfo.logo.length > 0) {
      siteLogo = <Image
        style={styles.siteIcon}
        source={{uri: 'data:image/png;base64,' + this.state.logo}}
      />;
    }

    return <SafeAreaView>
      <View style={styles.container}>
        <View style={styles.siteIconView}>
          {siteLogo}
          <Text style={loginBubbleStyle}></Text>
        </View>
        <View style={styles.siteName}>
          <Text>{this.props.url}</Text>
          {pullDownText}
        </View>
      </View>
    </SafeAreaView>;
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    flex: 0,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    height: 46,
    marginTop: 0
  },
  siteIcon: {
    height: 26,
    width: 26
  },
  siteName: {
    flex: 1,
    justifyContent: 'flex-start',
    marginLeft: 20
  },
  siteIconView: {
    height: 26,
    width: 26,
    flex: 0,
    justifyContent: 'flex-start',
    marginLeft: 10
  },
  loginBubble: {
    height: 10,
    width: 10,
    flex: 0,
    position: 'absolute',
    right: -3,
    bottom: -3,
    backgroundColor: '#e64949',
    borderRadius: 100
  },
  loginBubbleLoggedIn: {
    height: 10,
    width: 10,
    flex: 0,
    position: 'absolute',
    right: -3,
    bottom: -3,
    backgroundColor: '#87c415',
    borderRadius: 100
  },
  smallText: {
    fontSize: 12
  },
  loginButton: {
    color: Colors.primary,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 3,
    paddingTop: 3,
    paddingBottom: 3,
    paddingLeft: 6,
    paddingRight: 6,
    textAlign: 'center',
    marginRight: 10
  },
  loginButtonText: {
    color: Colors.primary,
    textTransform: 'uppercase',
    textAlign: 'center'
  }
});
