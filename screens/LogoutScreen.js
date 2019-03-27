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
import { WebBrowser, SQLite } from 'expo';

const db = SQLite.openDatabase('db.db');

class LogoutScreen extends React.Component {

  constructor(props) {
    super(props);
  }

  getToken(array) {
    if (array === undefined || array.length < 1) {
      return false;
    }
    const token = array[0].token;
    const cookie = array[0].cookie;
    let data = {
      method: 'POST',
      headers: {
        'Accept':       'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': token,
        'Cache-Control': 'no-cache',
        'Cookie': cookie
      }
    };
    console.log(data);
    fetch('http://mukurtucms.kanopi.cloud/app/user/logout')
    .then((response) => response.json())
    .then((responseJson) => {

        db.transaction(
         tx => {
           tx.executeSql('delete from auth;',
           );
         }
       );
      })
      .catch((error) => {
        console.error(error);
      });
  }

  onClickListener = (viewId) => {
    let _array = [];
    db.transaction(tx => {
      tx.executeSql(
        `select * from auth limit 1;`,
        '',
        (_, { rows: { _array } }) => this.getToken(_array)
      );
    });

  }

  render() {

    return (
      <View style={styles.container}>
        <Text>username: {this.props.user.user.name}</Text>
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
