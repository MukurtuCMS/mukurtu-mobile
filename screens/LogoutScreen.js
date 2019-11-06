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
  Alert, WebView
} from 'react-native';
import {connect} from 'react-redux';
import {addPlace} from '../actions/place';
import {addUser} from '../actions/user';
import {WebBrowser} from 'expo';
import * as SQLite from 'expo-sqlite';
import Axios from "axios";
import * as Colors from "../constants/Colors";

// create a global db for database list and last known user
const globalDB = SQLite.openDatabase('global-8');

class LogoutScreen extends React.Component {

  static navigationOptions = {
    headerStyle: {
      backgroundColor: Colors.default.gold,
      marginTop: -20,
    },
    headerTintColor: '#000',
  };

  constructor(props) {
    super(props);
    const {navigation, screenProps} = this.props;
    this.state = {db: (screenProps.databaseName) ? SQLite.openDatabase(screenProps.databaseName) : null}
    this.handleLoginClick = this.handleLoginClick.bind(this);
    this.handleLogoutClick = this.handleLogoutClick.bind(this);
    // this._handleSiteUrlUpdate = screenProps._handleSiteUrlUpdate.bind(this);
    this._handleLoginStatusUpdate = screenProps._handleLoginStatusUpdate.bind(this);
    this._handleLogoutStatusUpdate = screenProps._handleLogoutStatusUpdate.bind(this);
  }

  componentDidMount() {


    // we need to remove our global user
    // globalDB.transaction(
    //   tx => {
    //     tx.executeSql('delete from user;',
    //     );
    //   }
    // );


    // this._handleLogoutStatusUpdate(false);
    // this._handleSiteUrlUpdate('');
  }


  handleLogoutClick() {
    this._handleLogoutStatusUpdate();

  }

  handleLoginClick() {
    this.props.navigation.navigate('Login');
  }




  render() {


    if (this.props.screenProps.loggedIn) {
      return (
          <View style={styles.container}>
            <Text style={{marginBottom: 20}}>You Are Logged in as {this.props.screenProps.user.user.name}</Text>
            <TouchableHighlight style={[styles.buttonContainer, styles.loginButton]}
                                onPress={() => this.handleLogoutClick()}>
              <Text style={styles.loginText}>Log Out</Text>
            </TouchableHighlight>
          </View>
      )
    }
    return (
        <View style={styles.container}>
          <Text style={{marginBottom: 20}}>You Have Been Logged Out</Text>
          <TouchableHighlight style={[styles.buttonContainer, styles.loginButton]}
                              onPress={() => this.handleLoginClick()}>
            <Text style={styles.loginText}>Log In</Text>
          </TouchableHighlight>

        </View>
    )

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


export default connect(mapStateToProps, mapDispatchToProps)(LogoutScreen)
