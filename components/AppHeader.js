import React from 'react';
import { View, StyleSheet, Text, Image} from 'react-native';
import {EvilIcons} from "@expo/vector-icons";

export default class AppHeader extends React.Component {


  render() {
    let loginBubbleStyle = styles.loginBubble;
    let profileLink = 'Login';

    if (this.props.loggedIn) {
      loginBubbleStyle = styles.loginBubbleLoggedIn;
      let profileLink = 'Logout';
    }

    return <View style={styles.container}>
      <View style={styles.siteIconView}>
      <Image
        style={styles.siteIcon}
        source={require('../assets/images/profileIcon.png')}
      />
      <Text style={loginBubbleStyle}></Text>
      </View>
      <Text style={styles.siteName}>Site Name</Text>
      <Image
        style={styles.profileIcon}
        source={require('../assets/images/profileIcon.png')}
      />
    </View>;
  }
}

const styles = StyleSheet.create({
   container: {
      backgroundColor: "#FFF",
      flex: 0,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      height: 46,
      marginTop: 25
   },
  profileIcon: {
    height: 20,
    width: 20,
    flex: 0,
    justifyContent: 'flex-end',
    marginRight: 10
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
  }
});