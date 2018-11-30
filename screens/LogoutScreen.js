import React from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  TextInput,
  TouchableHighlight,
  Alert
} from 'react-native';
import { WebBrowser } from 'expo';
import {userAuth} from '../services/userAuth';

import { MonoText } from '../components/StyledText';

export default class LogoutScreen extends React.Component {

  constructor(props) {
    super(props);
  }

  onClickListener = (viewId) => {

    fetch('http://mukurtucms.kanopi.cloud/services/session/token')
      .then((response) => {
        //Alert.alert("my json" + responseJson.movies);
/*        Alert.alert(
          "Get response",
          "Movies query-> " +JSON.stringify(response)
        )*/
        let Token = response._bodyText;
        let data = {
          method: 'POST',
          headers: {
            'Accept':       'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-Token': Token
          }
        };

        fetch('http://mukurtucms.kanopi.cloud/app/user/logout', data)
          .then((response) => response.json())
          .then((responseJson) => {
            //Alert.alert("my json" + responseJson.movies);
            Alert.alert(
              JSON.stringify(responseJson)
            );
            this.props.navigation.navigate('Settings');
          })
          .catch((error) => {
            console.error(error);
          });
      })
      .catch((error) => {
        console.error(error);
      });
  }

  render() {

    return (
      <View style={styles.container}>

        <TouchableHighlight style={[styles.buttonContainer, styles.loginButton]} onPress={() => this.onClickListener('login')}>
          <Text style={styles.loginText}>Logout</Text>
        </TouchableHighlight>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#DCDCDC',
  },
  inputContainer: {
    borderBottomColor: '#F5FCFF',
    backgroundColor: '#FFFFFF',
    borderRadius:30,
    borderBottomWidth: 1,
    width:250,
    height:45,
    marginBottom:20,
    flexDirection: 'row',
    alignItems:'center'
  },
  inputs:{
    height:45,
    marginLeft:16,
    borderBottomColor: '#FFFFFF',
    flex:1,
  },
  inputIcon:{
    width:30,
    height:30,
    marginLeft:15,
    justifyContent: 'center'
  },
  buttonContainer: {
    height:45,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom:20,
    width:250,
    borderRadius:30,
  },
  loginButton: {
    backgroundColor: "#00b5ec",
  },
  loginText: {
    color: 'white',
  }
});
