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
import { connect } from 'react-redux';
import { addPlace } from '../actions/place';
import { addUser } from '../actions/user';
import {SQLite, WebBrowser} from 'expo';



const db = SQLite.openDatabase('db.db');

// We'll be replacing this at some point with a dynamic variable
const siteUrl = 'http://mukurtucms.kanopi.cloud';

class LoginScreen extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      name: false,
      password: false,
      url: siteUrl,
      error: false,
      places: 'b',
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
    if(this.state.name !== false) {
      var name = this.state.name.toLowerCase().trim();
    }
    if(this.state.password !== false) {
      var pass = this.state.password.toLowerCase().trim();
    }
    if(this.state.url !== false) {
      var url = this.state.url.toLowerCase().trim();
    }

    fetch(siteUrl + '/services/session/token')
      .then((response) => {
        let Token = response._bodyText;


        // Check to see if we're logged in already.
        fetch(siteUrl, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Accept':       'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-Token': Token,
            'Cookie': this.props.places
          }
        })
            .then(function(response) {
              // When the page is loaded convert it to text
              return response.text()
            })
            .then(function(html) {

              // Might be better to use a dom parser
              if(html.includes(' logged-in')) {
                // If logged in, the app simply switches to the mobile browser tab, user will be on whatever page they were on last.
                // siteUrl is temporary
                let result = WebBrowser.openBrowserAsync(siteUrl);

              } else {
                // If not logged in, the app hits the mobile-browser-login endpoint, no params passed.
                // The endpoint provides a link w/token which functions very similarly to the one-time-login link
                // except it doesn't do a redirect to the password reset page when the user logs in
                console.log('logged out');
              }


            })
            .catch(function(err) {
              console.log('Failed to fetch page: ', err);
            });


        let data = {
          method: 'POST',
          body: JSON.stringify({
            username: name,
            password: pass
          }),
          headers: {
            'Accept':       'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-Token': Token,
            'Cookie': this.props.places
          }
        };

        fetch('http://mukurtucms.kanopi.cloud/app/user/login.json', data)
          .then((response) => response.json())
            .then(console.log(response.json()))
          .then((responseJson) => {
           //  db.transaction(
           //   tx => {
           //     tx.executeSql('delete from auth;');
           //   }
           // );
           db.transaction(
            tx => {
              tx.executeSql('delete from auth;',
              );
            }
          );
            db.transaction(
             tx => {
               tx.executeSql('insert into auth (token, cookie) values (?, ?)',
                 [responseJson.token, responseJson.session_name + '=' + responseJson.sessid],
                 (success) => {


                 },

                 (success, error) => console.log(' ')
               );
             }
           );

            this.props.add(responseJson.session_name + '=' + responseJson.sessid);
            this.props.addUserProp(responseJson);
            this.props.navigation.navigate('Settings')

          })

          .catch((error) => {
            // console.error(error);
          });
      })
      .catch((error) => {
        // console.error(error);
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
          <TextInput style={styles.inputs}
                     placeholder="Email"
                     keyboardType="email-address"
                     underlineColorAndroid='transparent'
                     onChangeText={(name) => this.setState({name})}/>
        </View>

        <View style={styles.inputContainer}>
          <TextInput style={styles.inputs}
                     placeholder="Password"
                     secureTextEntry={true}
                     underlineColorAndroid='transparent'
                     onChangeText={(password) => this.setState({password})}/>
        </View>

        <View style={styles.inputContainer}>
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

const mapStateToProps = state => {
  return {
    places: state.places.places,
    user: state.user.user
  }
}

const mapDispatchToProps = dispatch => {
  return {
    add: (name) => {
      dispatch(addPlace(name))
    },
    addUserProp: (name) => {
      dispatch(addUser(name))
    }
  }
}


export default connect(mapStateToProps, mapDispatchToProps)(LoginScreen)
