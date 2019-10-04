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
import * as Colors from "../constants/Colors";

export default class CreateContentScreen extends React.Component {
  static navigationOptions = {
    title: 'Create Content',
    headerStyle: {
      backgroundColor: Colors.default.gold,
      marginTop: -20,
    },
    headerTintColor: '#000',
  };

  constructor(props){
    super(props);
    const { navigation, screenProps } = this.props;
    // this.onValueChange = this.onValueChange.bind(this);
    // this.componentActive = this.componentActive.bind(this);
    // this.state = {switchValue: false, loggedIn: false, token: false, user: {}, places: '', contentTypes: {}, placeName: '', isConnected: false, db: (screenProps.databaseName) ? SQLite.openDatabase(screenProps.databaseName) : null}
  }

  componentDidMount(){
    // this.props.navigation.addListener('willFocus', this.componentActive);
    // NetInfo.isConnected.addEventListener('connectionChange', this.handleConnectivityChange);
    if (this.props.screenProps.firstTime) {
      this.props.navigation.navigate('Login');
    }
  }

  componentWillUnmount() {
    NetInfo.isConnected.removeEventListener('connectionChange', this.handleConnectivityChange);
  }

  componentActive(){
    // Immediately check if first time, and rout to login screen

      // first set content types from db, then try connecting
      // this.props.screenProps.db.transaction(tx => {
      //   tx.executeSql(
      //     'select blob from content_types;',
      //     '',
      //     (_, {rows: {_array}}) => this.retrieveContentTypes(_array)
      //   );
      // });

      // if (this.props.screenProps.isConnected) {
      //   this.update();
      // }
  }

  // handleConnectivityChange = isConnected => {
  //   this.setState({ isConnected });
  // }

  // retrieveContentTypes(array) {
  //   if (array[0] && array[0].blob !== undefined) {
  //     this.setState({contentTypes: JSON.parse(array[0].blob)});
  //   }
  // }

  // update() {
  //   //
  //   //   this.state.db.transaction(tx => {
  //   //     tx.executeSql(
  //   //         'select * from auth limit 1;',
  //   //         '',
  //   //         (_, { rows: { _array } }) => this.getToken(_array)
  //   //     );
  //   //   });
  //   // }

  // getToken(array) {
  //   let token;
  //   let cookie;
  //   if(this.props.screenProps.token && this.props.screenProps.cookie) {
  //     token = this.props.screenProps.token;
  //     cookie = this.props.screenProps.cookie;
  //   } else {
  //     if (array === undefined || array.length < 1) {
  //       return false;
  //     }
  //      token = array[0].token;
  //     cookie = array[0].cookie;
  //   }
  //
  //
  //   let data = {
  //     method: 'POST',
  //     headers: {
  //       'Accept':       'application/json',
  //       'Content-Type': 'application/json',
  //       'X-CSRF-Token': token,
  //       'Cookie': cookie
  //     }
  //   };
  //
  //
  //   fetch(this.props.screenProps.siteUrl + '/app/system/connect', data)
  //       .then((response) => response.json())
  //       .then((responseJson) => {
  //         if (responseJson.user.uid === 0) {
  //           return false;
  //         }
  //         data.method = 'GET';
  //
  //         fetch(this.props.screenProps.siteUrl + '/app/creatable-types/retrieve', data)
  //             .then((response) => response.json())
  //             .then((responseJson) => {
  //               this.setState({contentTypes: responseJson});
  //             })
  //             .catch((error) => {
  //               // console.error(error);
  //             });
  //       })
  //       .catch((error) => {
  //         console.error(error);
  //         // this.alertNotLoggedIn(); Need to replace this with a login prompt
  //       });
  // }


  render() {

    if(!this.props.screenProps.loggedIn || typeof this.props.screenProps.contentTypes === 'undefined') {
      return (
        <View style={{backgroundColor:'#EFEFF4',flex:1}}>
          <Text>Please log in to create content.</Text>
        </View>

      );
    }

    let list = [];
    const contentTypes = this.props.screenProps.contentTypes;
    // check that content types is not empty
    if (!(Object.entries(contentTypes).length === 0) && contentTypes.constructor === Object) {
      // key is content type machine name
      for (let key in this.props.screenProps.contentTypes) {
        list.push(
            <SettingsList.Item
                key={key}
                title={this.props.screenProps.contentTypes[key].label}
                titleInfoStyle={styles.titleInfoStyle}
                onPress={() =>
                    this.props.navigation.navigate('CreateContentForm', {
                      contentType: key,
                      contentTypeLabel: this.props.screenProps.contentTypes[key].label
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


