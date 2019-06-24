import React from 'react';
import { Platform, StatusBar, StyleSheet, View, Text, NetInfo } from 'react-native';
import {AppLoading} from 'expo';
import {SQLite} from 'expo-sqlite';
import { Asset } from 'expo-asset';
import * as BackgroundFetch from 'expo-background-fetch'
import Constants from 'expo-constants'
import * as Font from 'expo-font'
import * as Icon from '@expo/vector-icons'
import * as TaskManager from 'expo-task-manager'
import AppNavigator from './navigation/AppNavigator';
import { Provider } from 'react-redux';
import {LoginText} from "./components/LoginText";
import InitializingApp from "./components/InitializingApp"
import AjaxSpinner from "./components/AjaxSpinner"
import * as Sync from "./components/MukurtuSync"
import * as ManageTables from "./components/ManageTables"

import configureStore from './store';
import axios from "axios";
import {Feather} from "@expo/vector-icons";

const store = configureStore();
const db = SQLite.openDatabase('db.db');

// create a global db for database list and last known user
const globalDB = SQLite.openDatabase('global');

BackgroundFetch.setMinimumIntervalAsync(60);
const taskName = 'mukurtu-mobile-sync';
TaskManager.defineTask(taskName, async () => {
  console.log('background fetch running');
  return BackgroundFetch.Result.NewData;
});

export default class App extends React.Component {


  constructor(props) {
    super(props);
    this._handleSiteUrlUpdate = this._handleSiteUrlUpdate.bind(this);
    this._handleLoginStatusUpdate = this._handleLoginStatusUpdate.bind(this);
    this.setDatabaseName = this.setDatabaseName.bind(this);
    this.syncCompleted = this.syncCompleted.bind(this);

    this.state = {
      isLoadingComplete: false,
      // This is the base siteUrl for testing purposes. When logging in user can set a new URL
      // This URL won't currently return the correct one time login link
      siteUrl: 'http://mukurtucms.kanopi.cloud/',
      isLoggedIn: false,
      token: false,
      cookie: false,
      isConnected: false,
      databaseName: false,
      db: null,
      loggedIn: null,
      user: {},
      firstTime: false,
      sync: false
    };
  }

  setDatabaseName() {
    // This should always be run on app initialization. It check for the previous user object or set state to first time.
    const self = this;
    globalDB.transaction(tx => {
      tx.executeSql(
        'select * from user limit 1;',
        '',
        function(tx, result){
          let user = null;
          let databaseName = null;
          let db = null;
          const array = result.rows._array;
          if (array.length > 0) {
            if (array[0] && array[0].user.length > 0) {
              const siteUrl = array[0].siteUrl;
              if (array[0].user) {
                const userBlob = JSON.parse(array[0].user);
                if (typeof userBlob.user === 'object' && userBlob.user.uid > 0) {
                  user = userBlob;
                  databaseName = siteUrl.replace(/\./g, '_') + '_' + userBlob.user.uid;
                  db = SQLite.openDatabase(databaseName);
                }
              }
            }
          }
          let firstTime = false;
          let loggedIn = null;
          if (!user) {
            firstTime = true;
            databaseName = null;
            loggedIn = false;
          } else {
            loggedIn = true;
          }
          self.setState({user: user, databaseName: databaseName, db: db, firstTime: firstTime, loggedIn: loggedIn});
        }
      );
    });
  };

  deleteAll = () => {
    // SQLite.openDatabase('global');
    const mainDB = SQLite.openDatabase('mukurtucms_kanopi_cloud_1');

    globalDB.transaction(tx => {
      tx.executeSql(
        'delete from user; delete from database;'
      );
    });
    mainDB.transaction(tx => {
      tx.executeSql(
        'delete from auth;'
      );
    });
  }

  componentDidMount() {
    // delete all data and start fresh
    // this.deleteAll();
    ManageTables.createGlobalTables();

    // let's first check if this is a first time user, redirect to login
    this.firstTimeCheck();

    this.setDatabaseName();
    NetInfo.isConnected.addEventListener('connectionChange', this.handleConnectivityChange);
  }

  syncCompleted (sync = false) {
    if (sync) {
      this.setState({sync: false});
    } else {
    }
  }

  componentDidUpdate(prevProps, prevState) {
    if (!prevState.db && this.state.db && this.state.isConnected) {
      // We cannot create any of our unique tables until we have our unique database created and stored in state
      ManageTables.createUniqueTables(this.state.db);
      this._getAuth();
    } else if (!prevState.db && this.state.db && !this.state.isConnected) {
      // db and user exist, but cannot check auth
    }

    // We are connected, AND token was just set (via getAuth)
    if (!prevState.token && this.state.token && this.state.isConnected) {
      Sync.updateEntities(this.state.db, this.state);
      Sync.syncContentTypes(this.state, this.syncCompleted);
    }

    if (!prevState.sync && this.state.sync) {
      Sync.updateEntities(this.state.db, this.state);
      Sync.syncContentTypes(this.state, this.syncCompleted);
    }
    if (!prevState.isConnected && !prevState.db && this.state.isConnected && this.state.db) {
      this.registerBackgroundSync();
      this.logRegisteredTasks();
      this.createTokenTable();
    }

  }

  handleConnectivityChange = isConnected => {
    this.setState({ isConnected });
  }

  componentWillUnmount() {
    NetInfo.isConnected.removeEventListener('connectionChange', this.handleConnectivityChange);
  }

  registerBackgroundSync = async () => {
    await BackgroundFetch.registerTaskAsync(taskName);
  };

  logRegisteredTasks = async () => {
    const registeredTasks = await TaskManager.getRegisteredTasksAsync();
  };

  firstTimeCheck = () => {

  }

  render() {
    // We need to make sure our component is not rendering until we have checked offline/online and whether user is
    // logged in or not. This is because it does not want to re-render on a state change unless not rendered at all.

    // databaseName should on bu null or a WebSQLDatabase class. If false, the checks have not run yet.
    if (this.state.sync) {
      return (<AjaxSpinner />);
    }

    if (this.state.databaseName === false){
      return (<InitializingApp />);
  }
    // loggedIn state should only be false or true. If null, the checks have not run yet.
    if (this.state.loggedIn === null) {
      return (<InitializingApp />);
    }

    let screenProps = {
      user: this.state.user,
      siteUrl: this.state.siteUrl,
      isLoggedIn: this.state.isLoggedIn,
      token: this.state.token,
      cookie: this.state.cookie,
      loggedIn: this.state.loggedIn,
      databaseName: this.state.databaseName,
      firstTime: this.state.firstTime,
      sync: this.state.sync,
      _handleSiteUrlUpdate: this._handleSiteUrlUpdate,
      _handleLoginStatusUpdate: this._handleLoginStatusUpdate,
        };

    // @todo: replace this with InitializingApp, keep now for debugging
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

  _handleSiteUrlUpdate = (url, uid, sync = false) => {
      // create database and set database name state
      const siteUrl = url.replace(/(^\w+:|^)\/\//, '');
      const databaseName = siteUrl.replace(/\./g,'_') + '_' + uid;

    // we need to update our global databasename
    globalDB.transaction(
      tx => {
        tx.executeSql('replace into database (siteUrl, databaseName) values (?, ?)',
          [siteUrl, databaseName],
          (success) => {
              if (sync) {
                this.setState({sync: true})
              }
          },
          (success, error) => console.log(' ')


        );
      }
    );

    this.setState({ siteUrl: url, databaseName: databaseName});
  };

  _handleLoginStatusUpdate = (status) => {
    this.setState({ isLoggedIn: status });
  };

  // This will check the database for an existing auth from the unique database
  _getAuth() {
    this.state.db.transaction(tx => {
      tx.executeSql(
        'select * from auth limit 1;',
        '',
        (_, {rows: {_array}}) => this.connect(_array),
        (tx, error) => {this._handleAuthError(error)}
      );
    });
  }

  _handleAuthError = () => {
    if (error) {
      // There must not be auth
    }
  }
  // This will try and check if the current user is logged in. This will fail if the server or client is offline.
  // If failed, we will set the loggedIn to false so we know the connection has been attempted.
  connect(array) {

    if (array === undefined || array.length < 1) {
      this.setState({
        cookie: null,
        token: null,
        loggedIn: false
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

    let data = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': token,
        'Cookie': cookie,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': 0
      }
    };

    fetch(this.state.siteUrl + '/app/system/connect', data)
         .then((response) => response.json())
         .then((responseJson) => {
           // Who knows what COULD come back here depending on drupal site, connection. So let's try catch
           try {
             // If this uid is not 0, the user is currently authenticated
             if (responseJson.user.uid !== 0) {
               this.setState({loggedIn: true, isLoggedIn: true});
               return;
             }
           } catch(e) {

           }
        })
        .catch((error) => {
        });

    // If the user was loggedIn, we should have set the state and bounced already.
    this.setState({loggedIn: false});
  }


}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});