import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableHighlight, SafeAreaView,
} from 'react-native';
import {connect} from 'react-redux';
import {addPlace} from '../actions/place';
import {addUser} from '../actions/user';
import * as SQLite from 'expo-sqlite';
import Validator from 'validator';
import * as Colors from "../constants/Colors";
import axios from "axios";
import {PleaseLogin} from "../components/PleaseLogin";


// create a global db for database list and last known user
class LoginScreen extends React.Component {

  constructor(props) {
    super(props);
    const {navigation, screenProps} = this.props;
    const siteUrl = screenProps.siteUrl;
    // this._handleSiteUrlUpdate = screenProps._handleSiteUrlUpdate.bind(this);
    this._handleLoginStatusUpdate = screenProps._handleLoginStatusUpdate.bind(this);
    this.state = {
      url: siteUrl,
      name: '',
      password: false,
      error: false,
      places: 'b',
      db: (screenProps.databaseName) ? SQLite.openDatabase(screenProps.databaseName) : null,
      uid: 0,
      urlInvalid: false,
      loginError: false,
      loginErrorMessage: '',
      passwordEmpty: false,
      nameEmpty: false
    }
  }

  componentDidMount() {
    // Get saved info for username and URL
    const globalDB = SQLite.openDatabase('global-8');
    globalDB.transaction(
      tx => {
        tx.executeSql('select * from savedinfo;',
          '',
          (success, array) => {
            if(array.rows.length > 0) {
              let url = array.rows._array[0].url;
              let username = array.rows._array[0].username;
              this.setState({'url': url});
              this.setState({'name': username});
            }

          },
          (error) => {
            console.log(error);
          })
      });

  }


  handleLoginError(message = '') {
    this.setState({'loginErrorMessage': message});
    this.setState({'loginError': true});
  }


  onClickListener = (viewId) => {

    if (this.state.name !== '') {
      var name = this.state.name.toLowerCase().trim();
    }
    else {
      this.setState({'nameEmpty': true});
    }
    if (this.state.password !== false) {
      var pass = this.state.password.toLowerCase().trim();
    }
    else {
      this.setState({'passwordEmpty': true});
    }


    if (this.state.url === false || !Validator.isURL(this.state.url)) {
      this.setState({'urlInvalid': true});
      return;
    }

    var url = this.state.url.toLowerCase().trim();
    // Remove trailing slash from url
    url = url.replace(/\/$/, "");

    // Set a component URL state for now, then once login is complete set the
    // app-wide URL
    this.setState({
      url: url
    }, () => {


      let cookie;
      let user;
      // Fetch was caching the token, but axios seems to work
      axios.get(this.state.url + '/services/session/token')
        .then((response) => {
          return response.data;
        })
        .then((response) => {
          let Token = response;

          let data = {
            method: 'POST',
            // cache: 'no-store',
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

          // Hit logout first to ensure we're not already logged in
          return fetch(this.state.url + '/app/user/logout', data)
            .then((response) => {
              return fetch(this.state.url + '/app/user/login.json', data)
            })
            .then((response) => response.json())
            .then(async (responseJson) => {

              // this._handleSiteUrlUpdate(this.state.url, responseJson.user.uid, true);
              // Pass the token from the user, not our initial token.

              // If we don't have a user ID in the response, treat it as an error
              if(typeof responseJson.user !== 'object' || typeof responseJson.user.uid !== 'string') {
                this.handleLoginError('Error logging in.');
              }
              cookie = responseJson.session_name + '=' + responseJson.sessid;
              user = JSON.stringify(responseJson);

              const response = await axios(this.state.url + '/services/session/token', {
                method: 'GET',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json',
                  'Cookie': cookie
                }
              });

              const token = responseJson.token;
              return {response, token}

              // this._handleLoginStatusUpdate(responseJson.token, responseJson.session_name + '=' + responseJson.sessid, url, JSON.stringify(responseJson));
              // this.props.navigation.navigate('Home')
            })
            // .then((response) => response.blob())
            .then(({response, token}) => {

              if (response.status === 200) {
                this._handleLoginStatusUpdate(token, cookie, url, user);
              }
            })
            .catch((error) => {
              this.handleLoginError('Error logging in.');
              if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                console.log(error.response);
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
          console.error(error);
        });

    }, this);
  };

  render() {

    if(!this.props.screenProps.isConnected) {
      return (
        <PleaseLogin
          loginText='You need to be online to log in.'
          hideButton={true}
          navigation={this.props.navigation}
        />
      );
    }

    let showError = [];
    if (this.state.error.length > 0) {
      showError = <Text>{this.state.error}</Text>
    }

    let urlInvalid = '';
    if (this.state.urlInvalid) {
      urlInvalid = 'Please Enter a Valid URL';
    }

    let nameEmpty = '';
    if (this.state.nameEmpty) {
      nameEmpty = 'Please Enter a Valid Username';
    }

    let passwordEmpty = '';
    if (this.state.passwordEmpty) {
      passwordEmpty = 'Please Enter Your Password';
    }


    let loginError = '';
    if (this.state.loginError) {
      loginError = this.state.loginErrorMessage;
    }

    return (
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.container}>

          <View style={styles.errorTextStyle}>
            <Text>{nameEmpty}</Text>
          </View>
          <View style={styles.inputContainer}>
            {showError}
            <TextInput
              autoCapitalize={'none'}
              style={styles.inputs}
              placeholder="Username"
              underlineColorAndroid='transparent'
              placeholderTextColor="#464646"
              value={this.state.name}
              onChangeText={(name) => this.setState({name})}/>
          </View>


          <View style={styles.errorTextStyle}>
            <Text >{passwordEmpty}</Text>
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.inputs}
              placeholder="Password"
              secureTextEntry={true}
              underlineColorAndroid='transparent'
              placeholderTextColor="#464646"
              onChangeText={(password) => this.setState({password})}/>
          </View>

          <View style={styles.errorTextStyle}>
            <Text>{urlInvalid}</Text>
          </View>


          <View style={styles.inputContainer}>

            <TextInput
              autoCapitalize={'none'}
              autoCorrect={false}
              style={styles.inputs}
              placeholder="Url"
              underlineColorAndroid='transparent'
              placeholderTextColor="#464646"
              value={this.state.url}
              onChangeText={
                (url) => {
                  this.setState({url});
                  this.setState({'urlInvalid': false})
                }
              }/>
          </View>

          <View style={styles.errorTextStyle}>
            <Text>{loginError}</Text>
          </View>

          <TouchableHighlight
            style={[styles.buttonContainer, styles.loginButton]}
            onPress={() => this.onClickListener('login')}>
            <Text style={styles.loginText}>Login</Text>
          </TouchableHighlight>

        </View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f7f7',
    padding: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: Colors.default.mediumGray,
    borderRadius: 5,
    backgroundColor: '#FFF',
    marginBottom: 10,
    padding: 8,
    fontSize: 20
  },
  inputs: {
    height: 45,
    marginLeft: 0,
    flex: 1,
  },
  buttonContainer: {
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 5,
    alignSelf: 'stretch',
    marginTop: 2
  },
  loginButton: {
    backgroundColor: "#159ec4",
  },
  loginText: {
    color: 'white',
  },
  errorTextStyle: {
    color: '#000',
    marginBottom: 5,
    marginTop: 10
  },
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
