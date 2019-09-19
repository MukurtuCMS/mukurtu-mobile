import React from 'react';
import {
  AppRegistry,
  Component,
  StyleSheet,
  Text,
  View,
  Image,
  Alert,
} from 'react-native';
import SettingsList from 'react-native-settings-list';
import { connect } from 'react-redux';
import { addPlace } from '../actions/place';
import { addUser } from '../actions/user';
import {SQLite} from "expo-sqlite";


class SettingsOverview extends React.Component {
  constructor(props){
    super(props);
    const { navigation, screenProps } = this.props;
    this.onValueChange = this.onValueChange.bind(this);
    this.componentActive = this.componentActive.bind(this);
    this.state = {db: (screenProps.databaseName) ? SQLite.openDatabase(screenProps.databaseName) : null, switchValue: false, loggedIn: screenProps.loggedIn, token: false, user: (screenProps.user) ? screenProps.user : {}, places: '', placeName: '', lastSync: null};
  }

  componentDidMount(){
    this.props.navigation.addListener('willFocus', this.componentActive);
  }

  componentActive(){
    if (this.state.db) {
      this.state.db.transaction(tx => {
        tx.executeSql(
          'select * from sync limit 1;',
          '',
          (_, {rows: {_array}}) => {
            if (_array.length > 0) {
              if (_array[0]) {
                this.setState({lastSync: _array[0].last});
              }
            }
          }
        );
      });
    }
  }

  render() {
    const { navigation } = this.props;
// console.log('USERR: ' + JSON.stringify(this.props.user.user.uid));
    var bgColor = '#DCE3F4';

    let lastUpdatedText = [];
    if (this.state.lastSync) {
      var lastSyncTime = new Date(this.state.lastSync);
      var lastSyncDate = new Date(this.state.lastSync).toLocaleDateString('en-US', {
        day:'numeric',
        month: 'numeric',
        year: 'numeric',
      });
      lastUpdatedText = <Text style={styles.lastUpdate}>
        Last Sync: {lastSyncDate + ' ' + this.formatStandardTime(lastSyncTime)}
      </Text>
    }
    return (
      <View style={{backgroundColor:'#EFEFF4',flex:1}}>
        <View style={{backgroundColor:'#EFEFF4',flex:1}}>
          <SettingsList borderColor='#c8c7cc' defaultItemSize={50}>
            {(this.props.screenProps.isLoggedIn && this.props.screenProps.user && parseInt(this.props.screenProps.user.uid) > 0) ?
              <SettingsList.Item
                title='Log Out'
                titleInfo={this.state.user.name}
                titleInfoStyle={styles.titleInfoStyle}
                onPress={() =>
                  this.props.navigation.navigate('Logout')
                }
              />
              :
              <SettingsList.Item
                title='Log In'
                titleInfo=''
                titleInfoStyle={styles.titleInfoStyle}
                onPress={() =>
                  this.props.navigation.navigate('Login')
                }
              />
            }
            <SettingsList.Item
              title='Queue'
              onPress={() => this.props.navigation.navigate('Offline')}
            />
            {lastUpdatedText}
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
  formatStandardTime = (date) => {
    let time = date.toLocaleTimeString();
    time = time.split(':'); // convert to array

    // fetch
    var hours = Number(time[0]);
    var minutes = Number(time[1]);
    var seconds = Number(time[2]);

    // calculate
    var timeValue;

    if (hours > 0 && hours <= 12) {
      timeValue= "" + hours;
    } else if (hours > 12) {
      timeValue= "" + (hours - 12);
    } else if (hours == 0) {
      timeValue= "12";
    }

    timeValue += (minutes < 10) ? ":0" + minutes : ":" + minutes;  // get minutes
    timeValue += (hours >= 12) ? " P.M." : " A.M.";  // get AM/PM
    return timeValue
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
    color: '#8e8e93'
  },
  lastUpdate: {
    padding: 15
  }
});

export default SettingsOverview
