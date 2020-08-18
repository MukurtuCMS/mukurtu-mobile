import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
} from 'react-native';
import SettingsList from 'react-native-settings-list';
import { connect } from 'react-redux';
import { addPlace } from '../actions/place';
import { addUser } from '../actions/user';
import * as SQLite from 'expo-sqlite';
import {PleaseLogin} from "../components/PleaseLogin";
import * as _ from 'lodash';

class HomeScreen extends React.Component {
  static navigationOptions = {
    title: 'View Content'
  };

  constructor(props){
    super(props);
    const { navigation, screenProps } = this.props;
    this.onValueChange = this.onValueChange.bind(this);
    this.state = {switchValue: false, loggedIn: false, token: false, user: {}, places: '', contentTypes: {}, placeName: '', isConnected: false, db: (screenProps.databaseName) ? SQLite.openDatabase(screenProps.databaseName) : null}
  }

  componentDidMount() {
    const { navigation } = this.props;
    this.focusListener = navigation.addListener('didBlur', () => {
      this.props.screenProps.checkLogin(true);
    });
  }

  componentWillUnmount() {
    this.focusListener.remove();
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
        const localNodeExists = _.find(this.props.screenProps.nodes, (node) => {
          return node.type === machineName;
        });
        if(localNodeExists !== undefined && this.props.screenProps.viewableTypes[machineName] !== undefined) {
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
      <SafeAreaView style={{flex: 1}}>
        <View style={{backgroundColor:'#EFEFF4',flex:1}}>
          <View style={{backgroundColor:'#EFEFF4',flex:1}}>
            <SettingsList borderColor='#c8c7cc' defaultItemSize={50}>
              {list}
            </SettingsList>
          </View>
        </View>
      </SafeAreaView>
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
