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
import {connect} from 'react-redux';
import {addPlace} from '../actions/place';
import {addUser} from '../actions/user';
import {WebBrowser} from 'expo';
import {SQLite} from 'expo-sqlite';
import Validator from 'validator';


// create a global db for database list and last known user
const globalDB = SQLite.openDatabase('global');

const db = SQLite.openDatabase('db.db');


class LoginScreen extends React.Component {

  constructor(props) {
    super(props);
    // Pass props down from App.js, since we're not using Redux
    const {navigation, screenProps} = this.props;
    const siteUrl = screenProps.siteUrl;
    this._handleSiteUrlUpdate = screenProps._handleSiteUrlUpdate.bind(this);
    this._handleLoginStatusUpdate = screenProps._handleLoginStatusUpdate.bind(this);
    this.state = {
      url: siteUrl,
      name: false,
      password: false,
      error: false,
      places: 'b',
      db: (screenProps.databaseName) ? SQLite.openDatabase(screenProps.databaseName) : null,
      uid: 0,
      urlInvalid: false,
      loginError: false,
      loginErrorMessage: '',
    }
  }


  handleLoginError(message = '') {
    this.setState({'loginErrorMessage': message});
    this.setState({'loginError': true});
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
    if (this.state.name !== false) {
      var name = this.state.name.toLowerCase().trim();
    }
    if (this.state.password !== false) {
      var pass = this.state.password.toLowerCase().trim();
    }
    if (this.state.url === false || !Validator.isURL(this.state.url)) {
      this.setState({'urlInvalid': true});
      return;

    }

    var url = this.state.url.toLowerCase().trim();
    // Remove trailing slash from url
    url = url.replace(/\/$/, "");

    // Set a component URL state for now, then once login is complete set the app-wide URL
    this.setState({
      url: url
    }, () => {

      fetch(this.state.url + '/services/session/token')
          .then((response) => response.text())
          .then((response) => {
            let Token = response;

            let data = {
              method: 'POST',
              body: JSON.stringify({
                username: name,
                password: pass
              }),
              headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-Token': Token,
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': 0
              }
            };

            fetch(this.state.url + '/app/user/login.json', data)
                .then((response) => response.json())
                .then((responseJson) => {

                  // Check for user in response. If there's no user, the response is an error message.
                  if (typeof responseJson.user === 'undefined') {
                    this.handleLoginError(responseJson);
                  } else {
                    // remove http:// from url
                    const url = this.state.url.replace(/(^\w+:|^)\/\//, '');


                    // we need to update our global user
                    globalDB.transaction(
                        tx => {
                          tx.executeSql('delete from user;',
                          );
                        }
                    );

                    globalDB.transaction(
                        tx => {
                          tx.executeSql('insert into user (siteUrl, user) values (?, ?)',
                              [url, JSON.stringify(responseJson)],
                              (success) => {
                                this._handleSiteUrlUpdate(this.state.url, responseJson.user.uid, true);
                              },

                              (success, error) => {
                                console.log('error');
                              }
                          );
                        }
                    );

                    this.props.add(responseJson.session_name + '=' + responseJson.sessid);
                    this.props.addUserProp(responseJson);
                    this.props.navigation.navigate('Home')
                  }

                })


                .catch((error) => {
                  this.handleLoginError('Error logging in.');
                  if (error.response) {
                    // The request was made and the server responded with a status code
                    // that falls out of the range of 2xx
                    console.log(error.response.data);
                    console.log(error.response.status);
                    console.log(error.response.headers);
                  } else if (error.request) {
                    // The request was made but no response was received
                    // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
                    // http.ClientRequest in node.js
                    console.log(error.request);
                  } else {
                    // Something happened in setting up the request that triggered an Error
                    console.log('Error', error.message);
                  }
                  console.log(error.config);
                });
          })
          .catch((error) => {
            this.handleLoginError('Error logging in.');
            // console.error(error);
          });

    }, this);
  }

  render() {

    let showError = [];
    if (this.state.error.length > 0) {
      showError = <Text>{this.state.error}</Text>
    }

    let urlInvalid = '';
    if (this.state.urlInvalid) {
      urlInvalid = 'Please Enter a Valid URL';
    }


    let loginError = '';
    if (this.state.loginError) {
      loginError = this.state.loginErrorMessage;
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

          <View>
            <Text>{urlInvalid}</Text>
          </View>


          <View style={styles.inputContainer}>

            <TextInput style={styles.inputs}
                       placeholder="Url"
                       underlineColorAndroid='transparent'
                       onChangeText={
                         (url) => {
                           this.setState({url});
                           this.setState({'urlInvalid': false})
                         }
                       }/>
          </View>

          <View>
            <Text>{loginError}</Text>
          </View>

          <TouchableHighlight style={[styles.buttonContainer, styles.loginButton]}
                              onPress={() => this.onClickListener('login')}>
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
    borderRadius: 30,
    borderBottomWidth: 1,
    width: 250,
    height: 45,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center'
  },
  inputs: {
    height: 45,
    marginLeft: 16,
    borderBottomColor: '#FFFFFF',
    flex: 1,
  },
  inputIcon: {
    width: 30,
    height: 30,
    marginLeft: 15,
    justifyContent: 'center'
  },
  buttonContainer: {
    height: 45,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    width: 250,
    borderRadius: 30,
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
