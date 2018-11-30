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

export default class LoginScreen extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      name: false,
      password: false,
      url: false,
      error: false,
    }
  }

  onClickListener = (viewId) => {
/*    userAuth(this.state.name, this.state.password, this.state.url)
      .then((res) => {
        Alert(res.message);
        if(res.message === 'Not Found') {
          this.setState({
            error: 'User not found'
          });
        }
        else {
          this.props.navigator.push({
            title: res.name || 'No Title',
            passProps: {userInfo: res}
          });
          this.setState({
            error: false,
            username: ''
          })
        }
      });*/
    var name = this.state.name.toLowerCase().trim();
    var pass = this.state.password.toLowerCase().trim();
    var url = this.state.url.toLowerCase().trim();

    fetch('http://mukurtucms.kanopi.cloud/services/session/token')
      .then((response) => {
        //Alert.alert("my json" + responseJson.movies);
/*        Alert.alert(
          "Get response",
          "Movies query-> " +JSON.stringify(response)
        )*/
        let Token = response._bodyText;
        Alert.alert(
          "Get response",
          Token
        )
        let data = {
          method: 'POST',
          body: JSON.stringify({
            username: name,
            password: pass
          }),
          headers: {
            'Accept':       'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-Token': Token
          }
        };

        fetch('http://mukurtucms.kanopi.cloud/app/user/login.json', data)
          .then((response) => response.json())
          .then((responseJson) => {
            Alert.alert(
              "Get response",
              "Movies query-> " +JSON.stringify(responseJson)
            )
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

    let showError = [];
    if (this.state.error.length > 0) {
      showError = <Text>{this.state.error}</Text>
    }
    return (
      <View style={styles.container}>
        <View style={styles.inputContainer}>
          {showError}
          <Image style={styles.inputIcon} source={{uri: 'https://png.icons8.com/message/ultraviolet/50/3498db'}}/>
          <TextInput style={styles.inputs}
                     placeholder="Email"
                     keyboardType="email-address"
                     underlineColorAndroid='transparent'
                     onChangeText={(name) => this.setState({name})}/>
        </View>

        <View style={styles.inputContainer}>
          <Image style={styles.inputIcon} source={{uri: 'https://png.icons8.com/key-2/ultraviolet/50/3498db'}}/>
          <TextInput style={styles.inputs}
                     placeholder="Password"
                     secureTextEntry={true}
                     underlineColorAndroid='transparent'
                     onChangeText={(password) => this.setState({password})}/>
        </View>

        <View style={styles.inputContainer}>
          <Image style={styles.inputIcon} source={{uri: 'https://png.icons8.com/key-2/ultraviolet/50/3498db'}}/>
          <TextInput style={styles.inputs}
                     placeholder="Url"
                     underlineColorAndroid='transparent'
                     onChangeText={(url) => this.setState({url})}/>
        </View>

        <TouchableHighlight style={[styles.buttonContainer, styles.loginButton]} onPress={() => this.onClickListener('login')}>
          <Text style={styles.loginText}>Login</Text>
        </TouchableHighlight>

        <TouchableHighlight style={styles.buttonContainer} onPress={() => this.onClickListener('restore_password')}>
          <Text>Forgot your password?</Text>
        </TouchableHighlight>

        <TouchableHighlight style={styles.buttonContainer} onPress={() => this.onClickListener('register')}>
          <Text>Register</Text>
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
