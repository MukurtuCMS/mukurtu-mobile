import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableHighlight, SafeAreaView,
} from 'react-native';
import {connect} from 'react-redux';
import {addPlace} from '../actions/place';
import {addUser} from '../actions/user';
import * as SQLite from 'expo-sqlite';

class LogoutScreen extends React.Component {

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


  handleLogoutClick() {
    this._handleLogoutStatusUpdate();

  }

  handleLoginClick() {
    this.props.navigation.navigate('Login');
  }


  render() {
    if (this.props.screenProps.loggedIn) {
      return (
        <SafeAreaView style={styles.container}>
          <Text style={{marginBottom: 20}}>You Are Logged in
            as {this.props.screenProps.user.user.name}</Text>
          <TouchableHighlight
            style={[styles.buttonContainer, styles.loginButton]}
            onPress={() => this.handleLogoutClick()}>
            <Text style={styles.loginText}>Log Out</Text>
          </TouchableHighlight>
        </SafeAreaView>
      )
    }
    return (
      <SafeAreaView style={styles.container}>
        <Text style={{marginBottom: 20}}>You Have Been Logged Out</Text>
        <TouchableHighlight
          style={[styles.buttonContainer, styles.loginButton]}
          onPress={() => this.handleLoginClick()}>
          <Text style={styles.loginText}>Log In</Text>
        </TouchableHighlight>

      </SafeAreaView>
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
