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

export class SettingsOverview extends React.Component {
  constructor(){
    super();
    this.onValueChange = this.onValueChange.bind(this);
    this.componentActive = this.componentActive.bind(this);
    this.state = {switchValue: false, loggedIn: false, token: false, user: []};
  }

  componentDidMount(){
    this.props.navigation.addListener('willFocus', this.componentActive)
  }

  componentActive(){
    fetch('http://mukurtucms.kanopi.cloud/services/session/token')
      .then((response) => {
        //Alert.alert("my json" + responseJson.movies);
        /*        Alert.alert(
         "Get response",
         "Movies query-> " +JSON.stringify(response)
         )*/
        let Token = response._bodyText;
                    Alert.alert(
         "Get response",
         JSON.stringify(Token)
         )
        this.setState({token: Token});
        let data = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': 'fjatg8GacpUYxAK01g0OrcTlUrCAnblVaNa3sbECJpc',
            'Cache-Control': 'no-cache',
            'Postman-Token': '04751bd0-9bab-ba1b-b0ac-472d3c4577f9'
          }
        };

        fetch('http://mukurtucms.kanopi.cloud/app/system/connect', data)
          .then((response) => {
            //Alert.alert("my json" + responseJson.movies);
            Alert.alert(
              "Get response",
              JSON.stringify(response)
            )
/*            if (response.user.uid === 0) {
              this.setState({loggedIn: false});
            } else {
              this.setState({loggedIn: true, user: responseJson});
            }*/
          })
          .catch((error) => {
            console.error(error);
          });
      })
      .catch((error) => {
        console.error(error);
      });
  }

  render() {
    const { navigation } = this.props;

    var bgColor = '#DCE3F4';
    return (
      <View style={{backgroundColor:'#EFEFF4',flex:1}}>
        <View style={{backgroundColor:'#EFEFF4',flex:1}}>
          <SettingsList borderColor='#c8c7cc' defaultItemSize={50}>
            {this.state.loggedIn ?
              <SettingsList.Item
                title='Log Out'
                titleInfo={this.state.user.user.name}
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
              hasSwitch={true}
              switchState={this.state.switchValue}
              switchOnValueChange={this.onValueChange}
              hasNavArrow={false}
              title='Airplane Mode'
            />
            <SettingsList.Item
              title='Wi-Fi'
              titleInfo='Bill Wi The Science Fi'
              titleInfoStyle={styles.titleInfoStyle}
              onPress={() => Alert.alert('Route to Wifi Page')}
            />
            <SettingsList.Item
              title='Blutooth'
              titleInfo='Off'
              titleInfoStyle={styles.titleInfoStyle}
              onPress={() => Alert.alert('Route to Blutooth Page')}
            />
            <SettingsList.Item
              title='Cellular'
              onPress={() => Alert.alert('Route To Cellular Page')}
            />
            <SettingsList.Item
              title='Personal Hotspot'
              titleInfo='Off'
              titleInfoStyle={styles.titleInfoStyle}
              onPress={() => Alert.alert('Route To Hotspot Page')}
            />
            <SettingsList.Header headerStyle={{marginTop:15}}/>
            <SettingsList.Item
              title='Notifications'
              onPress={() => Alert.alert('Route To Notifications Page')}
            />
            <SettingsList.Item
              title='Control Center'
              onPress={() => Alert.alert('Route To Control Center Page')}
            />
            <SettingsList.Item
              title='Do Not Disturb'
              onPress={() => Alert.alert('Route To Do Not Disturb Page')}
            />
            <SettingsList.Header headerStyle={{marginTop:15}}/>
            <SettingsList.Item
              title='General'
              onPress={() => Alert.alert('Route To General Page')}
            />
            <SettingsList.Item
              title='Display & Brightness'
              onPress={() => Alert.alert('Route To Display Page')}
            />
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
    color: '#8e8e93'
  }
});