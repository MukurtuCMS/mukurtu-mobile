import React from 'react';
import { Platform, StatusBar, StyleSheet, View, Text } from 'react-native';
import {AppLoading, Asset, Font, Icon, SQLite} from 'expo';
import AppNavigator from './navigation/AppNavigator';
import { Provider } from 'react-redux';
import {LoginText} from "./components/LoginText";

import configureStore from './store';
import axios from "axios";

const store = configureStore();
const db = SQLite.openDatabase('db.db');

export default class App extends React.Component {


  constructor(props) {
    super(props);
    this._handleSiteUrlUpdate = this._handleSiteUrlUpdate.bind(this);
    this._handleLoginStatusUpdate = this._handleLoginStatusUpdate.bind(this);
    this.state = {
      isLoadingComplete: false,
      // This is the base siteUrl for testing purposes. When logging in user can set a new URL
      // This URL won't currently return the correct one time login link
      siteUrl: 'http://mukurtucms.kanopi.cloud/',
      isLoggedIn: false,
      token: false,
      cookie: false
    };
  }

  componentDidMount() {
    this.update();
  }


  render() {
    let screenProps = {
          siteUrl: this.state.siteUrl,
          isLoggedIn: this.state.isLoggedIn,
          token: this.state.token,
          cookie: this.state.cookie,
          _handleSiteUrlUpdate: this._handleSiteUrlUpdate,
          _handleLoginStatusUpdate: this._handleLoginStatusUpdate,
        };

    if (!this.state.isLoadingComplete && !this.props.skipLoadingScreen) {
      return (
        <Provider store={store}>
          <AppLoading
            startAsync={this._loadResourcesAsync}
            onError={this._handleLoadingError}
            onFinish={this._handleFinishLoading}
          />
        </Provider>
      );
    } else {
      return (
        <Provider store={store}>
          <View style={styles.container}>
            {/*{Platform.OS === 'ios' && <StatusBar barStyle="default" />}*/}
            <LoginText loggedIn={this.state.isLoggedIn} url={this.state.siteUrl} />
            <AppNavigator screenProps={screenProps} />
          </View>
        </Provider>
      );
    }
  }

  _loadResourcesAsync = async () => {
    return Promise.all([
      Asset.loadAsync([
        require('./assets/images/robot-dev.png'),
        require('./assets/images/robot-prod.png'),
      ]),
      Font.loadAsync({
        // This is the font that we are using for our tab bar
        ...Icon.Ionicons.font,
        // We include SpaceMono because we use it in HomeScreen.js. Feel free
        // to remove this if you are not using it in your app
        'space-mono': require('./assets/fonts/SpaceMono-Regular.ttf'),
      }),
    ]);
  };

  _handleLoadingError = error => {
    // In this case, you might want to report the error to your error
    // reporting service, for example Sentry
    console.warn(error);
  };

  _handleFinishLoading = () => {
    this.setState({ isLoadingComplete: true });
  };

  _handleSiteUrlUpdate = (url) => {
    this.setState({ siteUrl: url });
  };

  _handleLoginStatusUpdate = (status) => {
    this.setState({ isLoggedIn: status });
  };

  update() {
    db.transaction(tx => {
      tx.executeSql(
          'select * from auth limit 1;',
          '',
          (_, {rows: {_array}}) => this.getToken(_array)
      );
    });
  }


  getToken(array) {
    if (array === undefined || array.length < 1) {
      this.setState({
        cookie: null,
        token: null
      });
      return false;
    }

    const token = array[0].token;
    const cookie = array[0].cookie;

    // Save cookie and token so we can use them to check login status
    this.setState({
      cookie: cookie,
      token: token
    });


    // get last updated time
    db.transaction(tx => {
      tx.executeSql(
          'select * from sync limit 1;',
          '',
          (_, {rows: {_array}}) => this.setState({syncUpdated: _array})
      );
    });
    let data = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': token,
        'Cookie': cookie
      }
    };

    // @todo: Replace this with screen props once that is defined
    fetch(this.state.siteUrl + '/app/system/connect', data)
         .then((response) => response.json())
         .then((responseJson) => {
          if (responseJson.user.uid === 0) {
            this.alertNotLoggedIn();
            return false;
          }
          data.method = 'GET';


          // fetch(siteUrl + '/app/synced-nodes/retrieve', data)
          //     .then((response) => response.json())
          //     .then((responseJson) => {
          //       console.log(responseJson.digital_heritage);
          //       if (typeof responseJson.digital_heritage === 'object') {
          //         this.buildRemovalNids(responseJson.digital_heritage);
          //         for (const [nid, timestamp] of Object.entries(responseJson.digital_heritage)) {
          //           // @todo don't update all nodes but starring a node does not save
          //           // if (timestamp > this.state.syncUpdated) {
          //           this.saveNode(nid, data);
          //           this.updateSync();
          //           // }
          //         }
          //       }
          //     })
          //     .catch((error) => {
          //       console.error(error);
          //     });
        })
        .catch((error) => {
          console.error(error);
        });
  }


}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
