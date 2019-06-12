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
  constructor(props){
    super(props);
    const { navigation, screenProps } = this.props;
    this.onValueChange = this.onValueChange.bind(this);
    this.componentActive = this.componentActive.bind(this);
    this.state = {switchValue: false, loggedIn: screenProps.loggedIn, token: false, user: screenProps.user, places: '', placeName: ''};
  }

  componentDidMount(){
    this.props.navigation.addListener('willFocus', this.componentActive)
  }

  componentActive(){
  }

  render() {
    const { navigation } = this.props;
// console.log('USERR: ' + JSON.stringify(this.props.user.user.uid));
    var bgColor = '#DCE3F4';
    return (
      <View style={{backgroundColor:'#EFEFF4',flex:1}}>
        <View style={{backgroundColor:'#EFEFF4',flex:1}}>
          <SettingsList borderColor='#c8c7cc' defaultItemSize={50}>
            {(this.state.user.user && parseInt(this.state.user.user.uid) > 0) ?
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

export default SettingsOverview
