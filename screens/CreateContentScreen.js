import React from 'react';
import ContentTypes from '../endpoints/ContentTypes';
import {
  AppRegistry,
  ScrollView,
  Component,
  StyleSheet,
  Text,
  View,
  Image,
  Alert,
  NetInfo
} from 'react-native';
import SettingsList from 'react-native-settings-list';
import { connect } from 'react-redux';
import { addPlace } from '../actions/place';
import { addUser } from '../actions/user';
import axios from "axios";
import { WebBrowser} from 'expo';
import {SQLite} from 'expo-sqlite';

class CreateContentScreen extends React.Component {
  static navigationOptions = {
    title: 'Create Content'
  };

  constructor(props){
    super(props);
    const { navigation, screenProps } = this.props;
    this.onValueChange = this.onValueChange.bind(this);
    this.componentActive = this.componentActive.bind(this);
    this.state = {switchValue: false, loggedIn: false, token: false, user: {}, places: '', contentTypes: {}, placeName: '', isConnected: false, db: (screenProps.databaseName) ? SQLite.openDatabase(screenProps.databaseName) : null}
  }

  componentDidMount(){
    this.props.navigation.addListener('willFocus', this.componentActive);
    NetInfo.isConnected.addEventListener('connectionChange', this.handleConnectivityChange);
  }

  componentWillUnmount() {
    NetInfo.isConnected.removeEventListener('connectionChange', this.handleConnectivityChange);
  }

  componentActive(){
    // Immediately check if first time, and rout to login screen
    if (this.props.screenProps.firstTime) {
      this.props.navigation.navigate('Login');
    }
    if (!this.state.db) {
    } else {

      // first set content types from db, then try connecting
      this.state.db.transaction(tx => {
        tx.executeSql(
          'select blob from content_types;',
          '',
          (_, {rows: {_array}}) => this.retrieveContentTypes(_array)
        );
      });

      if (this.state.isConnected) {
        this.update();
      }
    }
  }

  handleConnectivityChange = isConnected => {
    this.setState({ isConnected });
  }

  retrieveContentTypes(array) {
    if (array[0] && array[0].blob !== undefined) {
      this.setState({contentTypes: JSON.parse(array[0].blob)});
    }
  }

  update() {

    this.state.db.transaction(tx => {
      tx.executeSql(
          'select * from auth limit 1;',
          '',
          (_, { rows: { _array } }) => this.getToken(_array)
      );
    });
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
        'Cookie': cookie
      }
    };


    fetch(this.props.screenProps.siteUrl + '/app/system/connect', data)
        .then((response) => response.json())
        .then((responseJson) => {
          if (responseJson.user.uid === 0) {
            return false;
          }
          data.method = 'GET';

          fetch(this.props.screenProps.siteUrl + '/app/creatable-types/retrieve', data)
              .then((response) => response.json())
              .then((responseJson) => {
                this.setState({contentTypes: responseJson});
              })
              .catch((error) => {
                // console.error(error);
              });
        })
        .catch((error) => {
          console.error(error);
          // this.alertNotLoggedIn(); Need to replace this with a login prompt
        });
  }

  alertNotLoggedIn() {
    // This is done inline in some places,
    // But setting it here as well as a catch to ensure state is updated.
    this.setState({loggedIn: false});
    Alert.alert(
      'Connection Issue',
      'We are having trouble reaching the servers.',
      [
        {
          text: 'Continue Offline',
          style: 'cancel',
        },
        {text: 'Log In', onPress: () => this.props.navigation.navigate('Login')},
      ],
      {cancelable: true}
    )
  }

  render() {
    const { navigation } = this.props;
    var bgColor = '#DCE3F4';

    let list = [];
    const contentTypes = this.state.contentTypes;
    // check that content types is not empty
    if (!(Object.entries(contentTypes).length === 0) && contentTypes.constructor === Object) {
      for (const [machineName, TypeObject] of Object.entries(this.state.contentTypes)) {
        list.push(
            <SettingsList.Item
                key={machineName}
                title={this.state.contentTypes[machineName].label}
                titleInfoStyle={styles.titleInfoStyle}
                onPress={() =>
                    this.props.navigation.navigate('CreateContentForm', {
                      contentType: machineName,
                      contentTypeLabel: TypeObject.label
                    })
                }
            />
        )
      }
    }
    return (
      <View style={{backgroundColor:'#EFEFF4',flex:1}}>
        <View style={{backgroundColor:'#EFEFF4',flex:1}}>
          <SettingsList borderColor='#c8c7cc' defaultItemSize={50}>
            {list}
          </SettingsList>
        </View>
      </View>

    );
  }
  toggleAuthView() {
    this.setState({toggleAuthView: !this.state.toggleAuthView});
  }
  onValueChange(value){
    this.setState({switchValue: value});
  }
}

const styles = StyleSheet.create({
  imageStyle:{
    marginLeft:15,
    alignSelf:'center',
    height:30,
    width:30
  },
  titleInfoStyle:{
    fontSize:16,
    color: '#8e8e93',
    flex: 0,
    width: '100%'
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

export default connect(mapStateToProps, mapDispatchToProps)(CreateContentScreen)
