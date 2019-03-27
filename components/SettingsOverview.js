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

class SettingsOverview extends React.Component {
  constructor(){
    super();
    this.onValueChange = this.onValueChange.bind(this);
    this.componentActive = this.componentActive.bind(this);
    this.state = {switchValue: false, loggedIn: false, token: false, user: {}, places: '', placeName: ''};
  }

  componentDidMount(){
    this.props.navigation.addListener('willFocus', this.componentActive)
  }

  componentActive(){
    fetch('http://mukurtucms.kanopi.cloud/services/session/token')
      .then((response) => {
        let Token = response._bodyText;
        this.setState({token: Token});
        let data = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': this.props.user.token,
            'Cache-Control': 'no-cache',
            'Cookie': this.props.user.session_name + '=' + this.props.user.sessid
          }
        };

        fetch('http://mukurtucms.kanopi.cloud/app/system/connect', data)
          .then((response) => response.json())
          .then((responseJson) => {
            //Alert.alert("my json" + responseJson.movies);
            // console.log('SESS ID: ' + JSON.stringify(responseJson.sessid));
            // console.log('SESS Name: ' + JSON.stringify(responseJson.session_name));
            // console.log('Current Status' + JSON.stringify(responseJson));
            var session = responseJson.session_name + '=' + responseJson.sessid;
            this.props.add(responseJson.session_name + '=' + responseJson.sessid);
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
// console.log('USERR: ' + JSON.stringify(this.props.user.user.uid));
    var bgColor = '#DCE3F4';
    return (
      <View style={{backgroundColor:'#EFEFF4',flex:1}}>
        <View style={{backgroundColor:'#EFEFF4',flex:1}}>
          <SettingsList borderColor='#c8c7cc' defaultItemSize={50}>
            {parseInt(this.props.user.user.uid) > 0 ?
              <SettingsList.Item
                title='Log Out'
                titleInfo={this.props.user.user.name}
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
              title='Help'
              onPress={() => this.props.navigation.navigate('Help')}
            />
            <SettingsList.Item
              title='About'
              onPress={() => this.props.navigation.navigate('About')}
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

export default connect(mapStateToProps, mapDispatchToProps)(SettingsOverview)
