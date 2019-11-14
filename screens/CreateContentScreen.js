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
import * as SQLite from 'expo-sqlite';
import * as Colors from "../constants/Colors";
import {PleaseLogin} from "../components/PleaseLogin";

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
    this.props.navigation.addListener('willFocus', this.componentActive)
    // NetInfo.isConnected.addEventListener('connectionChange', this.handleConnectivityChange);
    if (this.props.screenProps.firstTime) {
      this.props.navigation.navigate('Login');
    }
  }

  componentWillUnmount() {
    NetInfo.isConnected.removeEventListener('connectionChange', this.handleConnectivityChange);
  }



  render() {

    if(!this.props.screenProps.loggedIn || typeof this.props.screenProps.contentTypes === 'undefined') {
      return (
        <PleaseLogin
          loginText='Please Log In to Create Content.'
          navigation={this.props.navigation}
        />
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
                      editWord: 'Create',
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


