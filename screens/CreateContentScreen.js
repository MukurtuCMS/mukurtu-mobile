import React from 'react';
import {StyleSheet, View} from 'react-native';
import SettingsList from 'react-native-settings-list';
import {PleaseLogin} from "../components/PleaseLogin";

export default class CreateContentScreen extends React.Component {
  static navigationOptions = {
    title: 'Create Content'
  };

  constructor(props){
    super(props);
    const { navigation, screenProps } = this.props;

    // this.onValueChange = this.onValueChange.bind(this);
    // this.state = {switchValue: false, loggedIn: false, token: false, user: {}, places: '', contentTypes: {}, placeName: '', isConnected: false, db: (screenProps.databaseName) ? SQLite.openDatabase(screenProps.databaseName) : null}
  }

  componentDidMount(){
    // this.props.navigation.addListener('willFocus', this.componentActive);
    // NetInfo.isConnected.addEventListener('connectionChange', this.handleConnectivityChange);
    if (this.props.screenProps.firstTime) {
      this.props.navigation.navigate('Login');
    }

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
}

const styles = StyleSheet.create({
  titleInfoStyle:{
    fontSize:16,
    color: '#8e8e93',
    flex: 0,
    width: '100%'
  }
});


