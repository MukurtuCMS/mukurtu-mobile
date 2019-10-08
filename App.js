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
const globalDB = SQLite.openDatabase('global-4');

// BackgroundFetch.setMinimumIntervalAsync(60);
// const taskName = 'mukurtu-mobile-sync';
// TaskManager.defineTask(taskName, async () => {
//   console.log('background fetch running');
//   return BackgroundFetch.Result.NewData;
// });

export default class App extends React.Component {
  _isMounted = false;


  constructor(props) {
    super(props);
    this._handleSiteUrlUpdate = this._handleSiteUrlUpdate.bind(this);
    this._handleLoginStatusUpdate = this._handleLoginStatusUpdate.bind(this);
    this._handleLogoutStatusUpdate = this._handleLogoutStatusUpdate.bind(this);
    // this.syncCompleted = this.syncCompleted.bind(this);

    this.state = {
      isLoadingComplete: false,
      formFields: {},
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
      terms: {},
      nodes: {},
      displayModes: {},
      listDisplayModes: {},
      viewableTypes: {},
      authorized: false,
      initialized: false
    };
  }


  componentDidMount() {


    // YellowBox.ignoreWarnings(['Setting a timer']);
    // YellowBox.ignoreWarnings(['Network request failed']);
    // YellowBox.ignoreWarnings(['Each child in a list']);
    // YellowBox.ignoreWarnings(['Failed prop type']);
    // console.disableYellowBox = true;
    //
    // var self = this;

    // First, create global tables if they don't exist.
    ManageTables.createGlobalTables();
    NetInfo.isConnected.addEventListener('connectionChange', this.handleConnectivityChange);

    // Check our login status
    this.checkLogin();
  }

  handleConnectivityChange = isConnected => {
    if (this._isMounted) {
      this.setState({isConnected});
    }
  }

  componentWillUnmount() {
    NetInfo.isConnected.removeEventListener('connectionChange', this.handleConnectivityChange);
  }

  render() {


    // We need to make sure our component is not rendering until we have checked offline/online and whether user is
    // logged in or not. This is because it does not want to re-render on a state change unless not rendered at all.
    // databaseName should on bu null or a WebSQLDatabase class. If false, the checks have not run yet.
    if (this.state.initialized === false) {
      return (<InitializingApp/>);
    }

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
      terms: this.state.terms,
      formFields: this.state.formFields,
      _handleSiteUrlUpdate: this._handleSiteUrlUpdate,
      _handleLoginStatusUpdate: this._handleLoginStatusUpdate,
      _handleLogoutStatusUpdate: this._handleLogoutStatusUpdate,
      nodes: this.state.nodes,
      displayModes: this.state.displayModes,
      listDisplayModes: this.state.listDisplayModes,
      viewableTypes: this.state.viewableTypes,
      authorized: this.state.authorized
    };
    if (this.state.user !== null && typeof this.state.user === 'object' && typeof this.state.user.user === 'object') {
      screenProps.user = this.state.user;
    } else if (typeof this.state.user === 'object') {
      screenProps.user.user = this.state.user;
    }


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

  _handleSiteUrlUpdate = (url, uid, sync = false) => {
    // create database and set database name state
    const siteUrl = url.replace(/(^\w+:|^)\/\//, '');
    const databaseName = siteUrl.replace(/\./g, '_') + '_' + uid + 'new2';

    globalDB.transaction(
      tx => {
        tx.executeSql('delete from database',
          [],
          (success) => {
            // we need to update our global databasename
            globalDB.transaction(
              tx => {
                tx.executeSql('insert into database (siteUrl, databaseName) values (?, ?)',
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

    let userObject = JSON.parse(user).user;

    // Then we need to create local database
    // Previously this was also done on opening the app, might still need to do that
     let dburl = url.replace(/(^\w+:|^)\/\//, '');
    let databaseName = dburl.replace(/\./g, '_') + '_' + userObject.uid + 'new2';
    let db = SQLite.openDatabase(databaseName);

    ManageTables.createUniqueTables(db);


    // Then we need to update our state to match the databases
    // If we've logged in or re-logged in, we need to update our state, and then resync everything.
    this.setState({
      url: url,
      db: db,
      loggedIn: true,
      syncing: true,
      isConnected: true,
      user: userObject,
      cookie: cookie,
      token: token,
      terms: {},
      nodes: {},
      displayModes: {},
      listDisplayModes: {},
      viewableTypes: {},
    }, () => {
      this.newSyncEverything();
    });

  };


  _handleLogoutStatusUpdate = () => {

    // Remove info from global db
    globalDB.transaction(
      tx => {
        tx.executeSql('delete from database; delete from user;')
      });

    // Remove auth from site database
    if (this.state.db) {
      this.state.db.transaction(tx => {
        tx.executeSql(
          'delete from auth;',
        );
      });
    }

    this.setState(
      {
        token: false,
        cookie: false,
        isConnected: false,
        databaseName: false,
        db: null,
        loggedIn: false,
        user: {},
        sync: false,
        terms: {},
        nodes: {},
        displayModes: {},
        listDisplayModes: {},
        viewableTypes: {},
        contentTypes: {}
      }
    );


  };


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

  saveNode = (nid, data, editable) => {
    let fetchurl = this.state.siteUrl + '/app/node/' + nid + '.json';
    fetch(fetchurl, this.buildFetchData('GET'))
      .then((response) => {
        return response.json();
      })
      .then((node) => {

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

  insertContentType = (response, machineName) => {
   this.state.db.transaction(
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


  insertViewableType = (response) => {
    this.state.db.transaction(
      tx => {
        tx.executeSql('insert into viewable_types (blob) values (?)',
          [JSON.stringify(response)],
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
  }

  saveAtom = (sid, data) => {
    let state = this.state;
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

  saveTaxonomy = (tid, data) => {
    let state = this.state;
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

        let currentTerms = this.state.terms;
        currentTerms[term.tid] = term;
        this.setState({'terms': currentTerms});
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


  // Retrieves and sets state from db
  retrieveEverythingFromDb() {

    this.state.db.transaction(
      tx => {
        tx.executeSql('select * from nodes',
          [],
          (success, array) => {
            console.log('nodes retreieved');
            let nodesState = {};
            for(let i = 0; i < array.rows._array.length; i ++) {
              let nid = array.rows._array[i].nid;
              let node = JSON.parse(array.rows._array[i].entity);
              nodesState[nid] = node;
            }
            this.setState({'nodes': nodesState});
          },
          (success, error) => {
            console.log(error);
          }
        );
      }
    );

    this.state.db.transaction(
      tx => {
        tx.executeSql('select * from content_types',
          [],
          (success, array) => {
            console.log('content types retrieved');
            let contentTypesState = JSON.parse(array.rows._array[0].blob);
            this.setState({'contentTypes': contentTypesState});
          },
          (success, error) => {
            console.log(error);
          }
        );
      }
    );

    this.state.db.transaction(
      tx => {
        tx.executeSql('select * from taxonomy',
          [],
          (success, array) => {
            let termsState = {};
            for(let i = 0; i < array.rows._array.length; i ++) {
              let tid = array.rows._array[i].tid;
              let term = JSON.parse(array.rows._array[i].entity);
             termsState[tid] = term;
            }
            this.setState({'terms': termsState});
          },
          (success, error) => {
            console.log(error);
          }
        );
      }
    );

    this.state.db.transaction(
      tx => {
        tx.executeSql('select * from display_modes',
          [],
          (success, array) => {
          console.log('display modes retreived');
            let displayState = {};
            for(let i = 0; i < array.rows._array.length; i ++) {
              let machine_name = array.rows._array[i].machine_name;
              let node_view= JSON.parse(array.rows._array[i].node_view);
              displayState[machine_name] = node_view;
            }
            this.setState({'displayModes': displayState});
          },
          (success, error) => {
            console.log(error);
          }
        );
      }
    );

    this.state.db.transaction(
      tx => {
        tx.executeSql('select * from list_display_modes',
          [],
          (success, array) => {
            console.log('list_display modes retreived');
            let displayState = {};
            for(let i = 0; i < array.rows._array.length; i ++) {
              let machine_name = array.rows._array[i].machine_name;
              let node_view = JSON.parse(array.rows._array[i].node_view);
              displayState[machine_name] = node_view;
            }
           this.setState({'listDisplayModes': displayState});
          },
          (success, error) => {
            console.log(error);
          }
        );
      }
    );


    this.state.db.transaction(
      tx => {
        tx.executeSql('select * from viewable_types',
          [],
          (success, array) => {

            if(array.rows._array.length > 0) {
             this.setState({'viewableTypes': JSON.parse(array.rows._array[0].blob)});
            }

          },
          (success, error) => {
            console.log(error);
          }
        );
      }
    );




    this.setState({
      'initialized': true,
      'syncing': false
    });
  }


  newSyncEverything() {
    this.setState({'initialized': true}); // just in case
    let data = this.buildFetchData('GET');
    data.url = this.state.siteUrl + '/app/synced-entities/retrieve';

    // Set up the node request
    let noderequest = axios(data)
      .then((response) => {
        return response.data;
      })
      .then((responseJson) => {
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
          Promise.all(Object.keys(nodes).map((key, index) =>
            this.saveNode(key, data)
          ))
            .then((response) => {
              // this.setState({'nodes': nodes});
              console.log('done syncing nodes');
            });


          // Run the taxonomy stuff
          if (typeof responseJson.terms === 'object') {
            Promise.all(Object.keys(responseJson.terms).map((key, index) =>
              this.saveTaxonomy(key, data)
            ))
              .then((response) => {
                this.setState({'terms': responseJson.terms});
                console.log('done syncing terms');
              });

          }

          // Run the atoms
          if (typeof responseJson.atoms === 'object') {
            Promise.all(Object.keys(responseJson.atoms).map((key, index) =>
              // @todo don't update all nodes but starring a node does not save
              this.saveAtom(key, data)
            ))
              .then((response) => {
                this.setState({'atoms': responseJson.atoms});
                console.log('done syncing atoms');
            });
          }

          this.updateSync();

        }
      })
      .then((t) => {
        console.log('done fetching');
      });


    // set up the creatable types request
    data.url = this.state.siteUrl + '/app/creatable-types/retrieve';
    let creatableTypes = axios(data)
      .then((response) => {
        return response.data;
      })
      .then((responseJson) => {
        if (responseJson[0] && responseJson[0] === 'Access denied for user anonymous') {
          console.log('access denied');
        }
        if (typeof responseJson === 'object' && responseJson !== null) {
          this.state.db.transaction(
            tx => {
              tx.executeSql('delete from content_types;',
                [],
                (success) => {
                  // run this after things have been deleted
                  this.state.db.transaction(
                    tx => {
                      tx.executeSql('insert into content_types (id, blob) values (?, ?)',
                        [1, JSON.stringify(responseJson)],
                        (success) => {

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
          // Set content types to state
          this.setState({contentTypes: responseJson});
          // now let's sync all content type endpoints
          let urls = [];
          for (const [machineName, TypeObject] of Object.entries(responseJson)) {
            urls.push({
              url: this.state.siteUrl + '/app/node-form-fields/retrieve/' + machineName,
              machineName: machineName
            });
          }
          return Promise.all(urls.map(url =>
            axios({method: data.method, url: url.url, headers: data.headers})
              .then((response) => {
                return response.data;
              })
              .then((response) => this.insertContentType(response, url.machineName))
              .then((response) => {
                let currentFormFieldsState = this.state.formFields;
                currentFormFieldsState[url.machineName] = response;
                this.setState({'formFields': currentFormFieldsState});
                console.log('done with this promise')
              })
              .catch(error => {
                console.log('error with this promise')
                console.log(error)
              })
          ))
        }
      })
      .then((response) => {
        console.log('done syncing creatable types');
    });

    // Set up request for viewable types
    data.url = this.state.siteUrl + '/app/viewable-types/retrieve';
    let viewableTypes = axios(data)
      .then((response) => {
        return response.data;
      })
      .then((responseJson) => {
        if (typeof responseJson === 'object' && responseJson !== null) {



          this.setState({'viewableTypes': responseJson});
          this.insertViewableType(responseJson);



          // now let's sync all content type display endpoints
          let retrieveFieldsFetch = [];
          let retrieveListFieldsFetch = []
          for (const [machineName, TypeObject] of Object.entries(responseJson)) {
            data.url = this.state.siteUrl + '/app/node-view-fields/retrieve/' + machineName;
           retrieveFieldsFetch.push(axios(data)
              .then((response) => {
                return response.data;
              })
              .then((responseJson) => {

                let displayModesState = this.state.displayModes;
                displayModesState[machineName] = responseJson;
                this.setState({'displayModes': displayModesState});

                this.state.db.transaction(
                  tx => {
                    tx.executeSql('replace into display_modes (machine_name, node_view) values (?, ?)',
                      [machineName, JSON.stringify(responseJson)],
                      (success) => '',
                      (success, error) => ''
                    );
                  }
                );
              })
              .catch((error) => {
                console.log('error 1');
                console.log(error);
              })
          );
            // Now do the list view fields display
            data.url = this.state.siteUrl + '/app/list-view-fields/retrieve/' + machineName;
            retrieveListFieldsFetch.push(axios(data)
              .then((response) => {
                return response.data;
              })
              .then((responseJson) => {

                let listDisplayModesState = this.state.listDisplayModes;
                listDisplayModesState[machineName] = responseJson;
                this.setState({'listDisplayModes': listDisplayModesState});

                this.state.db.transaction(
                  tx => {
                    tx.executeSql('insert into list_display_modes (machine_name, node_view) values (?, ?)',
                      [machineName, JSON.stringify(responseJson)],
                      (success) => '',
                      (success, error) => ''
                    );
                  }
                );
              }));

          }

          let retrieveAllFieldsFetch = retrieveFieldsFetch.concat(retrieveListFieldsFetch);

          return Promise.all(retrieveAllFieldsFetch)
            .then(()=> {
              console.log('done syncing viewable types')
            });

        }
      })
      .catch((error) => {
        console.log('error 2');
        console.log(error);
      });

    // Set up site info fetch
    data.url = this.state.siteUrl + '/app/site-info/retrieve';
    let siteInfo = axios(data)
      .then((response) => {
        return response.data;
      })
      .then((siteInfo) => {
        if (siteInfo && siteInfo.site_name) {
          this.state.db.transaction(
            tx => {
              tx.executeSql('replace into site_info (site_name, mobile_enabled, logo) values (?, ?, ?)',
                [siteInfo.site_name, siteInfo.mukurtu_mobile_enabled, siteInfo.logo],
                (success) => '',
                (success, error) => ''
              );
            }
          );
          this.setState({'siteInfo': siteInfo});
          console.log('done syncing site info')
        }
      })
      .catch((error) => {
        console.log('error 3');
        console.log(error);
      });




    // Run all the requests
    Promise.all([noderequest, creatableTypes, viewableTypes, siteInfo])
      .then((values) => {
        console.log('done syncing everything');
        this.setState({'syncing': false})
      })
      .catch((error) => {
        console.log('error syncing');
        this.setState({'syncing': false})
        console.log(error);
      });
  }


  // This checks to see if we're logged in on the site.
  // If we're offline, but we do have authorization token in the db, we'll set login state to false and authorized to true
  // If we have both, both are true.
  checkLogin() {

    // First, get our global db info
    globalDB.transaction(
      tx => {
        tx.executeSql('select * from database;',
          '',
          (success, array) => {
            console.log('database selected');
            // There might be multiple databases, so we get the last one, assuming it's most recent
            if(array.rows.length > 0) {
              let index = array.rows.length - 1;
              let dbName = array.rows._array[index].databaseName;
              let db = SQLite.openDatabase(dbName);

              let siteUrl = array.rows._array[index].siteUrl;
              // Set our site URL state
              this.setState({'siteUrl': siteUrl});
              this.setState({'db': db});

            } else {
              // If there's no rows, just return
              this.setState({
                loggedIn: false,
                authorized: false,
                initialized: true,
              });
              return;
            }



            globalDB.transaction(
              tx => {
                tx.executeSql('select * from user;',
                  '',
                  (success, array) => {

                    // There might be multiple databases, so we just get the first one
                    if(array.rows.length > 0) {
                      // Now, if we're not connected but do have user info, we set our status to authorized so that content can be created/viewed
                      // if(!this.state.connected) {
                      //   this.setState({'authorized': true});
                      //   return;
                      // }
                      let index = array.rows.length - 1;

                      // If we are connected, check to see if we're authorized
                      let user = JSON.parse(array.rows._array[index].user);

                      // Now we need to get our cookie
                      let cookie = user.session_name + '=' + user.sessid;
                      let token = user.token;

                      // let databaseName = this.state.siteUrl.replace(/\./g, '_') + '_' + user.uid;
                      // let db = SQLite.openDatabase(dbname);

                      // Now we check our connection
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

                      // Append http to this. Might need to save original protocol to db
                      // data.url = 'http://' + this.state.siteUrl + '/app/system/connect';
                      fetch('http://' + this.state.siteUrl + '/app/system/connect', data)
                        .then((response) => {
                          return response.json()
                        })
                        .then((responseJson) => {
                          // Who knows what COULD come back here depending on drupal site, connection. So let's try catch
                          try {
                            // If this uid is not 0, the user is currently authenticated
                            if (responseJson.user.uid !== 0) {
                              this.setState({
                                loggedIn: true,
                                syncing: true,
                                isConnected: true,
                                authorized: true,
                                user: user,
                                cookie: cookie,
                                token: token
                              }, () => {this.retrieveEverythingFromDb()}); // Should probably do a new sync

                            }
                          } catch (e) {
                            this.setState({
                              loggedIn: false,
                              authorized: true,
                              syncing: true
                            }, () => this.retrieveEverythingFromDb());
                          }
                        })
                        .catch((error) => {
                          this.setState({
                            loggedIn: false,
                            authorized: true,
                            syncing: true
                          }, () => this.retrieveEverythingFromDb());
                        });



                    } else {
                      this.setState({'initialized': true});
                    }
                  },
                  (success, error) => {
                    this.setState({'initialized': true});
                  }
                );
              }
            );


          }



        );
      }
    );

  }




  checkLoginOld() {

    // First, get our global db info
    // tx.executeSql('replace into database (siteUrl, databaseName) values (?, ?)',


    globalDB.transaction(
      tx => {
        tx.executeSql('select * from database;',
          '',
          (success, array) => {
          console.log('database selected');

          }
        );
      }
    );

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

    data.url = this.state.siteUrl + '/app/system/connect';
    axios(data)
      .then((response) => {
        return response.data;
      })
      .then((responseJson) => {
        // Who knows what COULD come back here depending on drupal site, connection. So let's try catch
        try {
          // If this uid is not 0, the user is currently authenticated
          if (responseJson.user.uid !== 0) {
            this.setState({loggedIn: true, isLoggedIn: true});
            return;
          }
        } catch (e) {
          this.setState({loggedIn: false});
        }
      })
      .catch((error) => {
        this.setState({loggedIn: false});
      });

  }


}

const
  styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
  });
