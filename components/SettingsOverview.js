import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';
import SettingsList from 'react-native-settings-list';

class SettingsOverview extends React.Component {
  constructor(props){
    super(props);
    const { navigation, screenProps } = this.props;
    this.onValueChange = this.onValueChange.bind(this);
    this.componentActive = this.componentActive.bind(this);
    this.state = {switchValue: false, loggedIn: screenProps.loggedIn, token: false,  places: '', placeName: '', lastSync: null};

    if(typeof screenProps.user === 'object' && typeof screenProps.user.user === 'object') {
      this.state.user = screenProps.user.user;
    } else if(typeof screenProps.user === 'object') {
      this.state.user = screenProps.user;
    } else {
      this.state.user = {};
    }

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
            {(this.props.screenProps.loggedIn && this.props.screenProps.user) ?
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
          </SettingsList>
          {/*{lastUpdatedText}*/}
          <Text style={{textAlign:"center", color: "#ccc", fontStyle: 'italic'}}>Version: {this.props.screenProps.appVersion}</Text>
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
  titleInfoStyle:{
    fontSize:16,
    color: '#8e8e93'
  },
  lastUpdate: {
    padding: 15
  }
});

export default SettingsOverview
