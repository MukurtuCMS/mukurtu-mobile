import React from 'react';
import { View, StyleSheet, Text, Image} from 'react-native';
import {EvilIcons} from "@expo/vector-icons";
import {SQLite} from "expo-sqlite";

export default class AppHeader extends React.Component {

  constructor(props) {
    super(props);
    const { navigation, screenProps } = this.props;
    this.state = {
      siteInfo: null,
      db: (screenProps.databaseName) ? SQLite.openDatabase(screenProps.databaseName) : null
    }
  }


  componentDidMount() {
    // if (this.state.db) {
    //   this.state.db.transaction(
    //     tx => {
    //       tx.executeSql('select * from site_info limit 1',
    //         [],
    //         (success, info) => this.setState({siteInfo: info.rows._array[0]}),
    //         (success, error) => ''
    //       );
    //     }
    //   );
    // }
  }

  render() {
    let loginBubbleStyle = styles.loginBubble;

    if (this.props.screenProps.isConnected) {
      loginBubbleStyle = styles.loginBubbleLoggedIn;
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

    return <View style={styles.container}>
      <View style={styles.siteIconView}>
        {siteLogo}
      <Text style={loginBubbleStyle}></Text>
      </View>
      <Text style={styles.siteName}>{this.props.url}</Text>
{/*      <Image
        style={styles.profileIcon}
        source={require('../assets/images/profileIcon.png')}
      />*/}
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
