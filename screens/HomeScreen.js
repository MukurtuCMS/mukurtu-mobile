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

class HomeScreen extends React.Component {
  static navigationOptions = {
    title: 'View Content'
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
  //   NetInfo.isConnected.addEventListener('connectionChange', this.handleConnectivityChange);
  }



  componentActive(){
    // Immediately check if first time, and rout to login screen
    // We're assuming that there are content types if they've logged in before
    // if (!this.props.screenProps.authorized) {
    //   this.props.navigation.navigate('Login');
    // }

  }

  handleConnectivityChange = isConnected => {
    this.setState({ isConnected });
  }

  render() {


    let list = [];
    if(typeof this.props.screenProps.viewableTypes !== 'object' || Object.entries(this.props.screenProps.viewableTypes).length === 0 ) {
      return (
      <PleaseLogin
        loginText='Please Log In to Sync Content.'
        navigation={this.props.navigation}
      />
    );
    }
    const contentTypes = this.props.screenProps.viewableTypes;

    // check that content types is not empty
    if (!(Object.entries(contentTypes).length === 0) && contentTypes.constructor === Object) {
      for (const [machineName, TypeObject] of Object.entries(contentTypes)) {
        if(this.props.screenProps.viewableTypes[machineName] !== undefined) {
          list.push(
            <SettingsList.Item
              key={machineName}
              title={this.props.screenProps.viewableTypes[machineName].label}
              titleInfoStyle={styles.titleInfoStyle}
              onPress={() =>
                this.props.navigation.navigate('NodeListing', {
                  contentType: machineName,
                  contentTypeLabel: TypeObject.label
                })
              }
            />
          )
        }
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

export default connect(mapStateToProps, mapDispatchToProps)(HomeScreen)
