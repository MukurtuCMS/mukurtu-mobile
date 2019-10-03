import React from 'react';
import {Platform, StatusBar, StyleSheet, View, Text, NetInfo, YellowBox} from 'react-native';
import {AppLoading} from 'expo';
import {SQLite} from 'expo-sqlite';
import {Asset} from 'expo-asset';
import * as BackgroundFetch from 'expo-background-fetch'
import Constants from 'expo-constants'
import * as Font from 'expo-font'
import * as Icon from '@expo/vector-icons'
import * as TaskManager from 'expo-task-manager'
import AppNavigator from './navigation/AppNavigator';
import {Provider} from 'react-redux';
import {LoginText} from "./components/LoginText";
import InitializingApp from "./components/InitializingApp"
import AjaxSpinner from "./components/AjaxSpinner"
import * as Sync from "./components/MukurtuSync"
import * as ManageTables from "./components/ManageTables"
import configureStore from './store';
import axios from "axios";
import {Feather} from "@expo/vector-icons";
import AppHeader from "./components/AppHeader";
import * as FileSystem from "expo-file-system";

const store = configureStore();

// create a global db for database list and last known user
const globalDB = SQLite.openDatabase('global');

BackgroundFetch.setMinimumIntervalAsync(60);
const taskName = 'mukurtu-mobile-sync';
TaskManager.defineTask(taskName, async () => {
  console.log('background fetch running');
  return BackgroundFetch.Result.NewData;
});

export default class App extends React.Component {
  _isMounted = false;


  constructor(props) {
    super(props);
    this._handleSiteUrlUpdate = this._handleSiteUrlUpdate.bind(this);
    this._handleLoginStatusUpdate = this._handleLoginStatusUpdate.bind(this);
    this._handleLogoutStatusUpdate = this._handleLogoutStatusUpdate.bind(this);
    this.setDatabaseName = this.setDatabaseName.bind(this);
    // this.syncCompleted = this.syncCompleted.bind(this);

    this.state = {
      isLoadingComplete: false,
      siteUrl: '',
      token: false,
      cookie: false,
      isConnected: false,
      databaseName: false,
      db: null,
      loggedIn: null,
      user: {},
      firstTime: false,
      sync: false,
      syncing: false,
      nodes: {}
    };
  }

  getSiteDb() {


    let databaseName = siteUrl.replace(/\./g, '_') + '_' + userBlob.user.uid;
    let db = SQLite.openDatabase(databaseName);
    return db;

  }


  setDatabaseName() {
    // let self = this;
    // // This should always be run on app initialization. It check for the previous user object or set state to first time.
    //
    // globalDB.transaction(tx => {
    //   tx.executeSql(
    //     'select * from user limit 1;',
    //     '',
    //     function (tx, result) {
    //       let user = null;
    //       let databaseName = null;
    //       let db = null;
    //       const array = result.rows._array;
    //       if (array.length > 0) {
    //         if (array[0] && array[0].user.length > 0) {
    //           const siteUrl = array[0].siteUrl;
    //           if (array[0].user) {
    //             const userBlob = JSON.parse(array[0].user);
    //             if (typeof userBlob.user === 'object' && userBlob.user.uid > 0) {
    //               user = userBlob;
    //               databaseName = siteUrl.replace(/\./g, '_') + '_' + userBlob.user.uid;
    //               db = SQLite.openDatabase(databaseName);
    //             }
    //           }
    //         }
    //       }
    //       let firstTime = false;
    //       let loggedIn = null;
    //       if (!user) {
    //         firstTime = true;
    //         databaseName = null;
    //         loggedIn = false;
    //       } else {
    //         loggedIn = true;
    //       }
    //       self.setState({user: user, databaseName: databaseName, db: db, firstTime: firstTime, loggedIn: loggedIn});
    //     }
    //   );
    //
    //
    // });
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



    // YellowBox.ignoreWarnings(['Setting a timer']);
    // YellowBox.ignoreWarnings(['Network request failed']);
    // YellowBox.ignoreWarnings(['Each child in a list']);
    // YellowBox.ignoreWarnings(['Failed prop type']);
    // console.disableYellowBox = true;
    //
    // var self = this;
    // this._isMounted = true;

    // setInterval(() => {
    //   if (self.state.db !== null && self.state.loggedIn && self.state.isConnected) {
    //     console.log('here');
    //     this.updateEntities(this.state.db, this.state);
    //     // Sync.syncContentTypes(this.state, this.syncCompleted);
    //     // Sync.syncSiteInfo(this.state);
    //   }
    //   ;
    // }, 15 * 60 * 1000);

    // delete all data and start fresh
    // this.deleteAll();

    // First, create global tables if they don't exist.
    ManageTables.createGlobalTables();

    // Then we check for

    // let's first check if this is a first time user, redirect to login
    // this.firstTimeCheck();

    // this.setDatabaseName();
    NetInfo.isConnected.addEventListener('connectionChange', this.handleConnectivityChange);
  }

  // syncCompleted(sync = false) {
  //   if (sync) {
  //     this.setState({sync: false});
  //   } else {
  //   }
  // }

  componentDidUpdate(prevProps, prevState) {
    // if (!prevState.db && this.state.db && this.state.isConnected) {
    //   // We cannot create any of our unique tables until we have our unique database created and stored in state
    //   ManageTables.createUniqueTables(this.state.db);
    //   // The getAuth function is causing problems, and ultimately doesn't seem like it's needed — we're authorizing via
    //   // login
    //   // this._getAuth();
    // } else if (!prevState.db && this.state.db && !this.state.isConnected) {
    //   // db and user exist, but cannot check auth
    //   ManageTables.createUniqueTables(this.state.db);
    // }
    //
    // // We are connected, AND token was just set (via getAuth)
    // if (!prevState.token && this.state.token && this.state.isConnected && this.state.loggedIn && this.state.sync && !this.state.syncing && this.state.db) {
    //   this.setState({'syncing': true});
    //   this.updateEntities(this.state.db, this.state);
    //   // Sync.syncContentTypes(this.state, this.syncCompleted);
    //   // Sync.syncSiteInfo(this.state);
    // } else if (this.state.sync && !this.state.syncing) {
    //   console.log('sync');
    //   if (this.state.isConnected) {
    //     console.log('connected');
    //     if (!this.state.user) {
    //       console.log('inserting user');
    //       this._insertUser();
    //     } else {
    //
    //       if (!this.state.db) {
    //         console.log('set the database');
    //         this.setDatabaseName();
    //       } else {
    //         console.log('database is set');
    //         ManageTables.createUniqueTables(this.state.db);
    //         if (!this.state.loggedIn) {
    //           console.log('lets login');
    //           this._insertAuth();
    //         } else {
    //           this.setState({'syncing': true});
    //           console.log('we are logged in');
    //           this.updateEntities(this.state.db, this.state, this.syncCompleted());
    //           // Sync.syncContentTypes(this.state, this.syncCompleted);
    //           // Sync.syncSiteInfo(this.state);
    //         }
    //       }
    //     }
    //   }
    // }

  }

  handleConnectivityChange = isConnected => {
    // if (this._isMounted) {
    //   this.setState({isConnected});
    // }
  }

  componentWillUnmount() {
    NetInfo.isConnected.removeEventListener('connectionChange', this.handleConnectivityChange);
  }

  // registerBackgroundSync = async () => {
  //   await BackgroundFetch.registerTaskAsync(taskName);
  // };
  //
  // logRegisteredTasks = async () => {
  //   const registeredTasks = await TaskManager.getRegisteredTasksAsync();
  // };

  // firstTimeCheck = () => {
  //
  // }

  render() {



    // We need to make sure our component is not rendering until we have checked offline/online and whether user is
    // logged in or not. This is because it does not want to re-render on a state change unless not rendered at all.
    // databaseName should on bu null or a WebSQLDatabase class. If false, the checks have not run yet.
    // if (this.state.databaseName === false) {
    //   return (<InitializingApp/>);
    // }

    // If we're syncing, run the ajax spinner
    if (this.state.syncing) {
      return (<AjaxSpinner/>);
    }


    let screenProps = {
      user: {},
      siteUrl: this.state.siteUrl,
      token: this.state.token,
      cookie: this.state.cookie,
      loggedIn: this.state.loggedIn,
      databaseName: this.state.databaseName,
      isConnected: this.state.isConnected,
      firstTime: this.state.firstTime,
      sync: this.state.sync,
      contentTypes: this.state.contentTypes,
      _handleSiteUrlUpdate: this._handleSiteUrlUpdate,
      _handleLoginStatusUpdate: this._handleLoginStatusUpdate,
      _handleLogoutStatusUpdate: this._handleLogoutStatusUpdate,
      deleteAllData: this.deleteAllData,
      nodes: this.state.nodes
    };
    if (this.state.user !== null && typeof this.state.user === 'object' && typeof this.state.user.user === 'object') {
      screenProps.user = this.state.user;
    } else if (typeof this.state.user === 'object') {
      screenProps.user.user = this.state.user;
    }

    // @todo: replace this with InitializingApp, keep now for debugging
    // if (!this.state.isLoadingComplete && !this.props.skipLoadingScreen) {
    //   return (
    //     <Provider store={store}>
    //       <AppLoading
    //         startAsync={this._loadResourcesAsync}
    //         onError={this._handleLoadingError}
    //         onFinish={this._handleFinishLoading}
    //       />
    //     </Provider>
    //   );
    // } else {
    return (
      <Provider store={store}>
        <View style={styles.container}>
          <AppHeader
            loggedIn={screenProps.loggedIn}
            url={screenProps.siteUrl}
            screenProps={screenProps}
          />
          <AppNavigator screenProps={screenProps}/>
        </View>
      </Provider>
    );
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
    this.setState({isLoadingComplete: true});
  };

  _handleSiteUrlUpdate = (url, uid, sync = false) => {
    // create database and set database name state
    const siteUrl = url.replace(/(^\w+:|^)\/\//, '');
    const databaseName = siteUrl.replace(/\./g, '_') + '_' + uid;

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
          (success, error) => {
            console.log(error);
          }
        );
      }
    );

    this.setState({siteUrl: url, databaseName: databaseName});
  };

  /**
   *
   * @param status
   * @param cookie
   * @param token
   * @private
   */
  _handleLoginStatusUpdate = (token, cookie, url, user) => {
    console.log('logging in');

    // First, we have to update our databases.
    // Insert user and database into global DB
    globalDB.transaction(tx => {
      tx.executeSql(
        'delete from user; delete from database;',
        [],
        (success) => {
          globalDB.transaction(
            tx => {
              tx.executeSql('insert into user (siteUrl, user) values (?, ?)',
                [url, user],
                (success) => {
                },
                (success, error) => {
                  console.log(error);
                }
              );
            }
          );
        },
        (success, error) => {
          console.log('error');
        });
    });

    // Then we need to create local database
    // Previously this was also done on opening the app, might still need to do that
    let databaseName = url.replace(/\./g, '_') + '_' + user.uid;
    let db = SQLite.openDatabase(databaseName);


    // Then we need to update our state to match the databases
    // If we've logged in or re-logged in, we need to update our state, and then resync everything.
    this.setState({
      url: url,
      db: db,
      loggedIn: true,
      syncing: true,
      isConnected: true,
      user: user,
      cookie: cookie,
      token: token
    }, () => {
      this.syncEverything();
    });

  };


  /**
   * Deletes all data — temporary function
   */
  deleteAllData() {
    this.state = {
      isLoadingComplete: false,
      siteUrl: '',
      isLoggedIn: false,
      token: false,
      cookie: false,
      isConnected: false,
      databaseName: false,
      db: null,
      loggedIn: null,
      user: {},
      firstTime: false,
      sync: false,
      syncing: false
    };

    globalDB.transaction(tx => {
      tx.executeSql(
        'delete from user; delete from database;'
      );
    });

    if (this.state.db) {
      this.state.db.transaction(tx => {
        tx.executeSql(
          'delete from saved_offline; delete from auth; delete from nodes; delete from content_types; delete from content_type; delete from sync; delete from user;'
        );
      });
    }
  }


  _handleLogoutStatusUpdate = (status) => {
    // Not positive if we want this — when we log out it nukes the database. Might be able to drop this if it causes
    // problems, but right now it seems like a good safeguard.
    // this.deleteAll();
    this.setState(
      {
        token: false,
        cookie: false,
        isConnected: false,
        databaseName: false,
        db: null,
        loggedIn: false,
        user: {},
        sync: false
      }
    );

    // Remove auth from site database
    if (this.state.db) {
      this.state.db.transaction(tx => {
        tx.executeSql(
          'delete from auth;'
        );
      });
    }
  };


  // This will check the database for an existing auth from the unique database
  // _getAuth() {
  //   this.state.db.transaction(tx => {
  //     tx.executeSql(
  //       'select * from auth limit 1;',
  //       '',
  //       (_, {rows: {_array}}) => this.connect(_array),
  //       (tx, error) => {
  //         this._handleAuthError(error)
  //       }
  //     );
  //   });
  // }

  _insertUser() {
    globalDB.transaction(
      tx => {
        tx.executeSql('select * from user;',
          '',
          (success, array) => {
            console.log('logging user');
            console.log(array);
            if (array.rows._array.length > 0) {
              this.setState({user: JSON.parse(array.rows._array[0].user)});
            }
          }
        );
      }
    );
  }

  _insertAuth() {
    if (this.state.user.token && this.state.user.session_name && this.state.user.sessid) {
      this.state.db.transaction(
        tx => {
          tx.executeSql('delete from auth;',
          );
        }
      );
      this.state.db.transaction(
        tx => {
          tx.executeSql('insert into auth (token, cookie) values (?, ?)',
            [this.state.user.token, this.state.user.session_name + '=' + this.state.user.sessid],
            (success) => {
              // Set site status to logged in
              this.setState({
                token: this.state.user.token,
                cookie: this.state.user.session_name + '=' + this.state.user.sessid,
                loggedIn: true,
              });

              console.log('three');
              // this.updateEntities(this.state.db, this.state, true);

            },

            (success, error) => console.log(' ')
          );
        }
      );
    }
  }

  // _doneSyncing = () => {
  //   this.setState({'sync': false})
  // }

  buildFetchData = (method = 'GET') => {
    const token = this.state.token;
    const cookie = this.state.cookie;

    const data = {
      method: method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': token,
        'Cookie': cookie,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': 0
      },
      cache: 'no-store'
    };

    return data;
  };

  buildRemovalNids = (nids) => {
    this.state.db.transaction(tx => {
      tx.executeSql(
        'select nid from nodes;',
        '',
        (_, {rows: {_array}}) => this.removeNids(_array, nids)
      );
    });
  }

  removeNids = (currentNids, newNids) => {
    for (var i = 0; i < currentNids.length; i++) {
      var currentlyStarred = false;
      for (const [nid, timestamp] of Object.entries(newNids)) {
        if (currentNids[i].nid == nid) {
          currentlyStarred = true;
        }
      }
      if (!(currentlyStarred)) {
        var currentNid = currentNids[i].nid;
        state.db.transaction(tx => {
          tx.executeSql(
            'delete from nodes where nid = ?;',
            [currentNid],
            (_, {rows: {_array}}) => console.log('')
          );
        });
      }
    }
  }

  checkStatus = (response) => {
    if (response.ok) {
      return Promise.resolve(response);
    } else {
      return Promise.reject(new Error(response.statusText));
    }
  }

  saveNode = (nid, data, editable) => {
    let fetchurl = this.state.siteUrl + '/app/node/' + nid + '.json';
    fetch(fetchurl, this.buildFetchData('GET'))
      .then((response) => {
        return response.json();
      })
      .then((node) => {
        // this.state.db.transaction(tx => {
        //   tx.executeSql(
        //     'delete from nodes where nid = ?;',
        //     [node.nid],
        //     (success) => {
        //       // unset our nodes state after they're deleted
        //       if(typeof this.state.nodes[node.nid] !== undefined) {
        //         delete this.state.nodes[node.nid];
        //       }
        //
        //     },
        //     (success, error) => {
        //       console.log('node delete error');
        //       console.log(error);
        //     }
        //   );
        // });


        this.state.db.transaction(
          tx => {
            tx.executeSql('insert into nodes (nid, title, entity, editable) values (?, ?, ?, ?)',
              [node.nid, node.title, JSON.stringify(node), editable],
              (success) => {


              },
              (success, error) => {

                console.log(error);
              }
            );
          }
        );

        let currentNodes = this.state.nodes;


        currentNodes[node.nid] = node;
        this.setState({'nodes': currentNodes});

      })
      .catch((error) => {
        console.error(error);
      });
  }

  getCreatableTypes = async (state, data, complete) => {
    data.url = state.siteUrl + '/app/creatable-types/retrieve';
    axios(data)
      .then((response) => {
        return response.data;
      })
      .then((responseJson) => {
        if (responseJson[0] && responseJson[0] === 'Access denied for user anonymous') {
          console.log('access denied');
        }
        if (typeof responseJson === 'object' && responseJson !== null) {
          state.db.transaction(
            tx => {
              tx.executeSql('delete from content_types;',
                [],
                (success) => {
                  // run this after things have been deleted
                  state.db.transaction(
                    tx => {
                      tx.executeSql('insert into content_types (id, blob) values (?, ?)',
                        [1, JSON.stringify(responseJson)],
                        (success) => '',
                        (success, error) => console.log(' ')
                      );
                    }
                  );
                },
                (success, error) => console.log(error)
              );
            }
          );


          // now let's sync all content type endpoints
          let urls = [];
          for (const [machineName, TypeObject] of Object.entries(responseJson)) {
            urls.push({url: state.siteUrl + '/app/node-form-fields/retrieve/' + machineName, machineName: machineName});
          }
          Promise.all(urls.map(url =>
            axios({method: data.method, url: url.url, headers: data.headers})
              .then((response) => {
                return response.data;
              })
              .then(this.checkStatus)
              .then((response) => this.insertContentType(response, state, url.machineName))
              .catch(error => console.log(error))
          ))
            .then(() => {
              console.log('complete');
            })
        }
      })
  }

  parseJSON = (response) => {
    return response.json();
  }

  insertContentType = (response, state, machineName) => {
    state.db.transaction(
      tx => {
        tx.executeSql('insert into content_type (machine_name, blob) values (?, ?)',
          [machineName, JSON.stringify(response)],
          (success) => () => {
            console.log('success');
            return 'success'
          },
          (success, error) => {
            console.log(error);
          }
        );
      }
    );
    return response;

  }

  saveAtom = (sid, data, state) => {
    data.url = state.siteUrl + '/app/scald/retrieve/' + sid + '.json'
    axios(data)
      .then((response) => {
        return response.data;
      })
      .then((atom) => {

        state.db.transaction(
          tx => {
            tx.executeSql('replace into atom (sid, title, entity) values (?, ?, ?)',
              [atom.sid, atom.title, JSON.stringify(atom)],
              (success) => success,
              (success, error) => ''
            );
          }
        );


        if (atom.base_entity && atom.base_entity.fid) {
          const fid = atom.base_entity.fid;
          // now grab file blob and save to filesystem
          data.url = state.siteUrl + '/app/file/' + fid + '.json';
          axios(data)
            .then((response) => {
              return response.data;
            })
            .then(async (file) => {

              // It appears that sometimes the payload is too large on these, which we'll probably have to address.
              // In the meantime catching the error so it doesn't error out the app.
              try {
                const savedFile = await FileSystem.writeAsStringAsync(FileSystem.documentDirectory + file.filename, file.file);
              } catch (error) {
                console.log(error);
              }

            })
            .catch((error) => {
              console.error(error);
            });
        }
      })
      .catch((error) => {
        console.error(error);
      });
  }

  saveTaxonomy = (tid, data, state) => {
    data.url = state.siteUrl + '/app/tax-term/' + tid + '.json';
    axios(data)
      .then((response) => {
        return response.data;
      })
      .then((term) => {

        state.db.transaction(
          tx => {
            tx.executeSql('replace into taxonomy (tid, title, entity) values (?, ?, ?)',
              [term.tid, term.name, JSON.stringify(term)],
              (success) => success,
              (success, error) => ''
            );
          }
        );
      })
      .catch((error) => {
        console.error(error);
      });
  }

  updateSync = () => {
    const time = new Date().getTime()
    this.state.db.transaction(
      tx => {
        tx.executeSql('delete from sync;',
        );
      }
    );
    this.state.db.transaction(
      tx => {
        tx.executeSql('insert into sync (id, last) values (?, ?)',
          [1, time],
          (success) => success,
          (success, error) => ''
        );
      }
    );
  }

  /**
   * Sync everything
   */
  syncEverything() {

    let data = this.buildFetchData('GET');
    data.url = this.state.siteUrl + '/app/synced-entities/retrieve';

    let state = this.state; // need to fix this in all the functions below

    //test
    axios(data)
      .then((response) => {
        return response.data;
      })
      .then((responseJson) => {

        console.log(responseJson);

        if (typeof responseJson.nodes === 'object') {
          let nodes = {};
          for (const [type, entity] of Object.entries(responseJson.nodes)) {
            if (typeof responseJson.nodes[type] === 'object') {
              for (const [nid, object] of Object.entries(responseJson.nodes[type])) {
                if (typeof responseJson.nodes[type] === 'object') {
                  nodes[nid] = object;
                }
              }
            }
          }
          this.buildRemovalNids(nodes);
          for (const [nid, object] of Object.entries(nodes)) {
            // @todo don't update all nodes but starring a node does not save
            // if (timestamp > this.state.syncUpdated) {
            this.saveNode(nid, data, object.editable);
            // }
          }

          // now lets sync the taxonomy terms as well
        }
        if (typeof responseJson.terms === 'object') {
          for (const [tid, object] of Object.entries(responseJson.terms)) {
            // @todo don't update all nodes but starring a node does not save
            // if (timestamp > this.state.syncUpdated) {
            this.saveTaxonomy(tid, data, state);
            // }
          }
        }
        if (typeof responseJson.atoms === 'object') {
          for (const [sid, object] of Object.entries(responseJson.atoms)) {
            // @todo don't update all nodes but starring a node does not save
            // if (timestamp > this.state.syncUpdated) {
            this.saveAtom(sid, data, state);
            // }
          }
        }
        this.updateSync();
      })
      .then(() => {
        let returnData = 'failure';
        const data = this.buildFetchData('GET', state);
        data.url = state.siteUrl + '/app/creatable-types/retrieve';


        axios(data)
          .then((response) => {
            return response.data;
          })
          .then((responseJson) => {
            if (responseJson[0] && responseJson[0] === 'Access denied for user anonymous') {
              console.log('access denied');
            }
            if (typeof responseJson === 'object' && responseJson !== null) {
              state.db.transaction(
                tx => {
                  tx.executeSql('delete from content_types;',
                    [],
                    (success) => {
                      // run this after things have been deleted
                      state.db.transaction(
                        tx => {
                          tx.executeSql('insert into content_types (id, blob) values (?, ?)',
                            [1, JSON.stringify(responseJson)],
                            (success) => {
                              // Set content types to state
                              this.setState({contentTypes: JSON.stringify(responseJson)})
                            },
                            (success, error) => console.log(' ')
                          );
                        }
                      );
                    },
                    (success, error) => console.log(error)
                  );
                }
              );
              // now let's sync all content type endpoints
              let urls = [];
              for (const [machineName, TypeObject] of Object.entries(responseJson)) {
                urls.push({
                  url: state.siteUrl + '/app/node-form-fields/retrieve/' + machineName,
                  machineName: machineName
                });
              }
              Promise.all(urls.map(url =>
                axios({method: data.method, url: url.url, headers: data.headers})
                  .then((response) => {
                    return response.data;
                  })
                  .then(this.checkStatus)
                  .then((response) => this.insertContentType(response, state, url.machineName))
                  .catch(error => console.log(error))
              ))
                .then(data => {
                  // complete(true);
                })
            }
          })

      })
      .then(() => {


        // Now let's do the same thing for the display modes
        data.url = state.siteUrl + '/app/viewable-types/retrieve';
        axios(data)
          .then((response) => {
            return response.data;
          })
          .then((responseJson) => {
            if (typeof responseJson === 'object' && responseJson !== null) {

              // now let's sync all content type display endpoints
              for (const [machineName, TypeObject] of Object.entries(responseJson)) {
                data.url = state.siteUrl + '/app/node-view-fields/retrieve/' + machineName;
                axios(data)
                  .then((response) => {
                    return response.data;
                  })
                  .then((responseJson) => {
                    let returnData = 'success';

                    state.db.transaction(
                      tx => {
                        tx.executeSql('replace into display_modes (machine_name, node_view) values (?, ?)',
                          [machineName, JSON.stringify(responseJson)],
                          (success) => '',
                          (success, error) => ''
                        );
                      }
                    );

                    // @todo: We will need to grab the listing display as well
                  })
                  .catch((error) => {
                    console.log('error 1');
                    console.log(error);
                  });
              }
            }
          })
          .catch((error) => {
            console.log('error 2');
            console.log(error);
          })

      })
      .then(() => {
        const data = this.buildFetchData('GET', state);
        data.url = state.siteUrl + '/app/site-info/retrieve';
        axios(data)
          .then((response) => {
            return response.data;
          })
          .then((siteInfo) => {
            if (siteInfo && siteInfo.site_name) {

              state.db.transaction(
                tx => {
                  tx.executeSql('replace into site_info (site_name, mobile_enabled, logo) values (?, ?, ?)',
                    [siteInfo.site_name, siteInfo.mukurtu_mobile_enabled, siteInfo.logo],
                    (success) => '',
                    (success, error) => ''
                  );
                }
              );
            }
          })
          .catch((error) => {
            console.log('error 3');
            console.log(error);
          });
      })
      .then(() => {
        this.setState({
          'syncing': false
        })
      })
      .catch((error) => {
        // Set our state to done syncing even if it fails
        this.setState({
          'syncing': false
        })
        console.log('error 4');
        console.error(error);
      });
  }

  _handleAuthError = () => {
    if (error) {
      // There must not be auth
    }
  }


// This will try and check if the current user is logged in. This will fail if the server or client is offline.
// If failed, we will set the loggedIn to false so we know the connection has been attempted.
//   connect(array) {
//
//     // There's something going wrong with retrieving the auth data, but sometimes this is already set in state
//     if (!this.state.cookie && !this.state.token) {
//       if (array === undefined || array.length < 1) {
//         this.setState({
//           cookie: null,
//           token: null,
//           loggedIn: false
//         });
//
//         return false;
//       }
//     }
//
//     let token = this.state.token;
//     let cookie = this.state.cookie;
//
//     if (!this.state.cookie && !this.state.token) {
//       token = array[0].token;
//       cookie = array[0].cookie;
//     }
//
//
//     // Save cookie and token so we can use them to check login status
//     this.setState({
//       cookie: cookie,
//       token: token
//     });
//
//     let data = {
//       method: 'POST',
//       headers: {
//         'Accept': 'application/json',
//         'Content-Type': 'application/json',
//         'X-CSRF-Token': token,
//         'Cookie': cookie,
//         'Cache-Control': 'no-cache, no-store, must-revalidate',
//         'Pragma': 'no-cache',
//         'Expires': 0
//       }
//     };
//
//     data.url = this.state.siteUrl + '/app/system/connect';
//     axios(data)
//       .then((response) => {
//         return response.data;
//       })
//       .then((responseJson) => {
//         // Who knows what COULD come back here depending on drupal site, connection. So let's try catch
//         try {
//           // If this uid is not 0, the user is currently authenticated
//           if (responseJson.user.uid !== 0) {
//             this.setState({loggedIn: true, isLoggedIn: true});
//             return;
//           }
//         } catch (e) {
//           this.setState({loggedIn: false});
//         }
//       })
//       .catch((error) => {
//         this.setState({loggedIn: false});
//       });
//
//   }


}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
