import React from 'react';
import {
  Platform,
  StatusBar,
  StyleSheet,
  YellowBox,
  ScrollView,
  RefreshControl,
  Alert, SafeAreaView, View
} from 'react-native';
import * as SQLite from 'expo-sqlite';
import AppNavigator from './navigation/AppNavigator';
import {Provider} from 'react-redux';
import InitializingApp from "./components/InitializingApp"
import AjaxSpinner from "./components/AjaxSpinner"
import * as ManageTables from "./components/ManageTables"
import configureStore from './store';
import axios from "axios";
import AppHeader from "./components/AppHeader";
import * as FileSystem from "expo-file-system";
import NetInfo from '@react-native-community/netinfo';
import {sanitizeFormValues} from "./components/FormAPI/formUtils";
import AsyncStorage from '@react-native-community/async-storage';
import _ from 'lodash';


const store = configureStore();

// create a global db for database list and last known user
const globalDB = SQLite.openDatabase('global-8');


export default class App extends React.Component {

  constructor(props) {
    super(props);
    this._handleLoginStatusUpdate = this._handleLoginStatusUpdate.bind(this);
    this._handleLogoutStatusUpdate = this._handleLogoutStatusUpdate.bind(this);
    this.updateSyncedNids = this.updateSyncedNids.bind(this);
    this.saveNode = this.saveNode.bind(this);
    this.saveTaxonomy = this.saveTaxonomy.bind(this);
    this.setNodeSyncMessage = this.setNodeSyncMessage.bind(this);
    this._onRefresh = this._onRefresh.bind(this);
    this.logScrollPosition = this.logScrollPosition.bind(this);
    this.checkLogin = this.checkLogin.bind(this);
    this.netEventListener = null;

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
      initialized: false,
      paragraphData: {},
      fieldCollectionsData: {},
      nodeSyncMessages: {},
      refreshing: false,
      editable: {},
      syncText: '',
      skipInBrowse: [],
      disableRefresh: false
    };
  }


  componentDidMount() {


    // YellowBox.ignoreWarnings(['Setting a timer']);
    // YellowBox.ignoreWarnings(['Network request failed']);
    // YellowBox.ignoreWarnings(['Each child in a list']);
    // YellowBox.ignoreWarnings(['Failed prop type']);
    YellowBox.ignoreWarnings([
      'Warning: componentWillReceiveProps has been renamed, and is not recommended for use. See https://fb.me/react-async-component-lifecycle-hooks for details.',
      'Warning: componentWillMount has been renamed, and is not recommended for use. See https://fb.me/react-async-component-lifecycle-hooks for details.',
      'Remote debugger',
      'VirtualizedLists should never be nested inside plain ScrollViews with the same orientation',
      'Warning: DatePicker'
    ]);

    console.ignoredYellowBox = [
      'Warning: componentWillReceiveProps',
      'Warning: componentWillMount',
      'VirtualizedLists should never be nested inside plain ScrollViews with the same orientation',
      'Warning: DatePickerIOS'
    ];

    this.netEventListener = NetInfo.addEventListener(state => {
      this.handleConnectivityChange(state.isConnected);
    });


    // console.disableYellowBox = true;
    //
    // var self = this;

    // First, create global tables if they don't exist.
    ManageTables.createGlobalTables()
      .then(() => this.checkLogin());

    // NetInfo.isConnected.addEventListener('connectionChange', this.handleConnectivityChange);

    // Check our login status
    this.checkLogin();
  }

  handleConnectivityChange = isConnected => {
    console.log('is connected:', isConnected);

    this.setState({'isConnected': isConnected});
  }

  componentWillUnmount() {
    // NetInfo.isConnected.removeEventListener('connectionChange', this.handleConnectivityChange);
    this.netEventListener();
  }

  render() {

    // We need to make sure our component is not rendering until we have checked offline/online and whether user is
    // logged in or not. This is because it does not want to re-render on a state change unless not rendered at all.
    // databaseName should on bu null or a WebSQLDatabase class. If false, the checks have not run yet.
    if (this.state.initialized === false) {
      return (<InitializingApp/>);
    }

    // If we're syncing, run the ajax spinner
    // But don't run the spinner if we're refreshing - just let the refresh
    // graphic run
    if (this.state.syncing && !this.state.refreshing) {
      return (
        <AjaxSpinner
          text={this.state.syncText} />
      );
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
      _handleLoginStatusUpdate: this._handleLoginStatusUpdate,
      _handleLogoutStatusUpdate: this._handleLogoutStatusUpdate,
      updateSyncedNids: this.updateSyncedNids,
      saveNode: this.saveNode,
      nodes: this.state.nodes,
      displayModes: this.state.displayModes,
      listDisplayModes: this.state.listDisplayModes,
      viewableTypes: this.state.viewableTypes,
      authorized: this.state.authorized,
      paragraphData: this.state.paragraphData,
      fieldCollectionsData: this.state.fieldCollectionsData,
      nodeSyncMessages: this.state.nodeSyncMessages,
      editable: this.state.editable,
      db: this.state.db,
      documentDirectory: FileSystem.documentDirectory,
      appVersion: '2020-08-28_1345',
      refreshing: this.state.refreshing,
      logScrollPosition: this.logScrollPosition,
      checkLogin: this.checkLogin,
      skipInBrowse: this.state.skipInBrowse
    };
    // Not sure if this is necessary any longer, but leaving it just in case.
    if (this.state.user !== null && typeof this.state.user === 'object' && typeof this.state.user.user === 'object') {
      screenProps.user = this.state.user;
    } else if (typeof this.state.user === 'object') {
      screenProps.user.user = this.state.user;
    }



    return (
      <Provider store={store}>
        <View style={styles.container}>
          <StatusBar barStyle="dark-content" />
          <ScrollView style={styles.container} contentContainerStyle={{flex: 1}}
            refreshControl={<RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={this._onRefresh}
              title={this.state.syncText}
              enabled={!this.state.disableRefresh}
            />}
          >

            <AppHeader
              loggedIn={this.state.loggedIn}
              url={this.state.siteUrl}
              screenProps={screenProps}
              styles={styles.header}
            />

            <AppNavigator
              screenProps={screenProps}
              style={styles.appnavigator}
            />

          </ScrollView>
        </View>

      </Provider>
    );
  }


  /**
   *
   * @param status
   * @param cookie
   * @param token
   * @private
   */
  _handleLoginStatusUpdate = (token, cookie, url, user) => {
    console.log('logging in');

    let userObject = JSON.parse(user).user;

    let databaseName = url.replace(/(^\w+:|^)\/\//, '').replace(/\./g, '_') + '_' + userObject.uid + 'new4';

    // First update the username and url in the saved data so it can persist if user logs out
    globalDB.transaction(
      tx => {
        tx.executeSql('delete from savedinfo',
          [],
          (success) => {
            globalDB.transaction(
              tx => {
                tx.executeSql('replace into savedinfo (url, username) values (?, ?)',
                  [url, userObject.name],
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
            console.log(error);
          }
        );
      }
    );


    // Then update the url and database name in the global db
    globalDB.transaction(
      tx => {
        tx.executeSql('delete from database',
          [],
          (success) => {
            // we need to update our global databasename
            globalDB.transaction(
              tx => {
                tx.executeSql('replace into database (siteUrl, databaseName) values (?, ?)',
                  [url, databaseName],
                  (success) => {
                    // this.setState({siteUrl: url, databaseName: databaseName});
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


    // First, we have to update our databases.
    // Insert user and database into global DB
    globalDB.transaction(tx => {
      tx.executeSql(
        'delete from user; delete from database;',
        [],
        (success) => {
          globalDB.transaction(
            tx => {
              tx.executeSql('replace into user (siteUrl, user) values (?, ?)',
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


    //  let dburl = url.replace(/(^\w+:|^)\/\//, '');
    // Then we need to create local database
    // Previously this was also done on opening the app, might still need to do that
    let db = SQLite.openDatabase(databaseName);
    ManageTables.createUniqueTables(db);

    // Then we need to update our state to match the databases
    // If we've logged in or re-logged in, we need to update our state, and then resync everything.
    this.setState({
      siteUrl: url,
      databaseName: databaseName,
      db: db,
      loggedIn: true,
      syncing: true,
      isConnected: true,
      user: userObject,
      cookie: cookie,
      token: token,
      terms: {},
      nodes: {},
      paragraphData: {},
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
        tx.executeSql('delete from auth;');
        // Clear the queue and all offline saved content, otherwise it will come back.
        tx.executeSql('delete from saved_offline;');
        tx.executeSql('delete from nodes;');
      });
    }

    this.setState(
      {
        token: false,
        cookie: false,
        isConnected: true,
        databaseName: false,
        db: null,
        loggedIn: false,
        user: {},
        sync: false,
        terms: {},
        nodes: {},
        paragraphData: {},
        displayModes: {},
        listDisplayModes: {},
        viewableTypes: {},
        contentTypes: {},
        siteUrl: ''
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
        this.state.db.transaction(tx => {
          tx.executeSql(
            'delete from nodes where nid = ?;',
            [currentNid],
            (_, {rows: {_array}}) => console.log('')
          );
        });
      }
    }
  }

  saveNode = (nid, data, overwriteEditable) => {
    let editable = false;
    if (overwriteEditable != null) {
      editable = overwriteEditable;
    }
    else if (this.state.editable[nid] != null) {
      editable = this.state.editable[nid];
    }

    let fetchurl = this.state.siteUrl + '/app/node/' + nid + '.json';
    return fetch(fetchurl, this.buildFetchData('GET'))
      .then((response) => {
        return response.json();
      })
      .then((node) => {
        this.setState({'syncText': 'Retrieving content: ' + node.title});

        this.state.db.transaction(
          tx => {
            tx.executeSql('replace into nodes (nid, title, entity, editable) values (?, ?, ?, ?)',
              [nid, node.title, JSON.stringify(node), editable],
              (success) => {
              },
              (success, error) => {
                console.log(error);
              }
            );
          }
        );

        this.setState((state) => {
          const newNodes = {...state.nodes};
          newNodes[node.nid] = node;
          return {'nodes': newNodes};
        });

        return {node, syncData: data};
      })
      .then(({node, syncData}) => {
        // Now we need to save the paragraphs, terms, and nodes referenced within each node

        const nodeIds = _.get(syncData, ['nodeIds'], []);
        const termIds = _.get(syncData, ['termIds'], []);

        let promises = [];
        for (let field in node) {

          if (field.indexOf('field') !== -1) {

            if (node.hasOwnProperty(field)) {

              // Right now can't figure out how to distinguish field collections from paragraphs, so listing them manually. Need to fix though.
              if (field === 'field_lesson_micro_tasks') {
                if (node[field] !== null && typeof node[field].und !== 'undefined' && typeof node[field].und[0] !== 'undefined') {
                  Object.keys(node[field].und).forEach((id) => {
                    let fid = node[field].und[id].value;
                    promises.push(this.saveFieldCollection(fid, field, node.type));
                  });
                }
              } else if (node[field] !== null && typeof node[field].und !== 'undefined' && typeof node[field].und[0] !== 'undefined' && typeof node[field].und[0]['revision_id'] !== 'undefined') {
                Object.keys(node[field].und).forEach((id) => {
                  let pid = node[field].und[id].value;
                  promises.push(this.saveParagraph(pid, field, node.type));
                });
              } else if (node[field] !== null && typeof node[field].und !== 'undefined' && typeof node[field].und[0] !== 'undefined' && typeof node[field].und[0]['tid'] !== 'undefined') {
                Object.keys(node[field].und).forEach((id) => {
                  if (!termIds.includes(node[field].und[id]['tid'])) {
                    data = this.buildFetchData('GET');
                    promises.push(this.saveTaxonomy(node[field].und[id]['tid'], data));
                  }
                });
              } else if (node[field] !== null && typeof node[field].und !== 'undefined' && typeof node[field].und[0] !== 'undefined' && typeof node[field].und[0]['nid'] !== 'undefined') {
                Object.keys(node[field].und).forEach((id) => {
                  if (!nodeIds.includes(node[field].und[id]['nid'])) {
                    data = this.buildFetchData('GET');
                    promises.push(this.saveNode(node[field].und[id]['nid'], data));
                  }
                });
              }
            }
          }
        }

        return Promise.all(promises);

      })

      .catch((error) => {
        console.error(error);
      });
  }


  saveParagraph(pid, fieldName, contentType) {
    let data = this.buildFetchData('GET');

    data.url = this.state.siteUrl + '/app/paragraph/retrieve/' + pid;

    return axios(data)
      .then((response) => {
        return response.data;
      })
      .then((responsejson) => {

        let fields = responsejson;
        let paragraphData = fields;
        paragraphData.pid = pid;


        if (fieldName === 'field_lesson_micro_tasks') {
          console.log('here');
        }

        // // If there are referenced nodes, we need to retrieve them to get their titles
        if (typeof this.state.displayModes[contentType] === 'object' && typeof this.state.displayModes[contentType][fieldName] == 'object') {
          for (let [key, value] of Object.entries(this.state.displayModes[contentType][fieldName]['fields'])) {
            if (fields[pid][key]) {
              // Node reference
              if (typeof fields[pid][key] !== 'undefined' &&
                typeof fields[pid][key]['und'] !== 'undefined' &&
                typeof fields[pid][key]['und']['0']['target_id'] !== 'undefined'
              ) {
                for (let i = 0; i < fields[pid][key]['und'].length; i++) {
                  let nid = fields[pid][key]['und'][i]['target_id'];


                  // These nids won't necessarily be in our synced nodes, so we have to fetch it and then get the title
                  data.url = this.state.siteUrl + '/app/node/' + nid + '.json';
                  paragraphData.nodeTitles = {};
                  axios(data)
                    .then((response) => response.data)
                    .then((node) => {
                      paragraphData.nodeTitles[nid] = node.title;
                    })
                    .catch((error) => {
                      console.error(error);
                    });
                }

              }
              // Get our taxonomy term titles
              else if (typeof fields[pid][key] !== 'undefined' &&
                typeof fields[pid][key]['und'] !== 'undefined' &&
                typeof fields[pid][key]['und']['0']['tid'] !== 'undefined'
              ) {
                for (let i = 0; i < fields[pid][key]['und'].length; i++) {
                  let tid = fields[pid][key]['und'][i]['tid'];

                  data.url = this.state.siteUrl + '/app/tax-term/' + tid + '.json'
                  paragraphData.termNames = {};
                  axios(data)
                    .then((response) => response.data)
                    .then((term) => {
                      paragraphData.termNames[tid] = term.name;
                    })
                    .catch((error) => {
                      console.error(error);
                    });


                }
              }
            }
          }
        }
        return paragraphData;
      })
      .then((paragraphData) => {

        let currentParagraphData = this.state.paragraphData;
        currentParagraphData[paragraphData.pid] = paragraphData[paragraphData.pid];
        this.setState({'paragraphData': currentParagraphData});

        // Now we insert this into paragraph data
        this.state.db.transaction(
          tx => {
            tx.executeSql('replace into paragraphs (pid, blob) values (?, ?)',
              [paragraphData.pid, JSON.stringify(paragraphData[paragraphData.pid])],
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


      });
  }

  saveFieldCollection(fid, fieldName, contentType) {
    let data = this.buildFetchData('GET');
    data.url = this.state.siteUrl + '/app/field-collection/' + fid;

    return axios(data)
      .then((response) => {
        return response.data;
      })

      .then((fieldCollectionsData) => {

        let currentfieldCollectionsData = this.state.fieldCollectionsData;
        currentfieldCollectionsData[fieldCollectionsData.item_id] = fieldCollectionsData;
        this.setState({'fieldCollectionsData': currentfieldCollectionsData});

        // Now we insert this into fieldcollections data
        this.state.db.transaction(
          tx => {
            tx.executeSql('replace into fieldcollections (fid, blob) values (?, ?)',
              [fid, JSON.stringify(fieldCollectionsData)],
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


      });
  }


  insertContentType = (response, machineName) => {
    this.state.db.transaction(
      tx => {
        tx.executeSql('replace into content_type (machine_name, blob) values (?, ?)',
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
        tx.executeSql('replace into viewable_types (blob) values (?)',
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

        this.setState({'syncText': 'Retrieving Media ' + atom.title});

        state.db.transaction(
          tx => {
            tx.executeSql('replace into atom (sid, title, entity) values (?, ?, ?)',
              [atom.sid, atom.title, JSON.stringify(atom)],
              (success) => success,
              (success, error) => ''
            );
          }
        );

        return atom;
      })
      .then((atom) => {

        // Skip further processing for remote media items
        const remoteProvider = ['scald_youtube', 'scald_soundcloud', 'scald_vimeo', 'scald_dailymotion'];
        if (remoteProvider.includes(atom.provider)) {
          return;
        }

        let sanitizedFileName = atom.title.replace(/ /g,"_");
        if (_.has(atom, ['base_entity', 'filename'])) {
          sanitizedFileName = atom.base_entity.filename.replace(/ /g,"_");
        }

        FileSystem.downloadAsync(
          atom.file_url,
          FileSystem.documentDirectory + sanitizedFileName
        )
          .then(( uri ) => {
            // If we have a video, just save it — we don't base 64 those
            if(uri.headers['Content-Type'].indexOf('video') !== -1 || uri.headers['Content-Type'].indexOf('application') !== -1) {
              return null;
            } else {
              let options = {encoding: FileSystem.EncodingType.Base64};
              return FileSystem.readAsStringAsync(uri.uri, options)
            }
          })
          .then((filestring) => {
            if(filestring === null) {
              return null;
            }
            let options = { encoding: FileSystem.EncodingType.Base64 };
            return FileSystem.writeAsStringAsync(FileSystem.documentDirectory + sanitizedFileName, filestring, options)
          })
          .catch((error) =>{
            console.log(error);
            console.log('error syncing file')
          });



        // RNFetchBlob.config({
        //   fileCache: true
        // })
        //   .fetch("GET", atom.file_url)
        //   .then(()=>{
        //     console.log('test');
        //     });
        // the image is now dowloaded to device's storage
        // .then(resp => {
        //   // the image path you can use it directly with Image component
        //   let imagePath = resp.path();
        //   return resp.readFile("base64");
        // })
        // .then(base64Data => {
        //   // here's base64 encoded image
        //   console.log(base64Data);
        //   // remove the file from storage
        //   return fs.unlink(imagePath);
        // }


        // const test = await FileSystem.writeAsStringAsync(FileSystem.documentDirectory + atom.title, atom.file_url);
        // test.then((response)=> {
        //   console.log('yep');
        // });

        //atom.file_url
        // if (atom.base_entity && atom.base_entity.fid) {
        //   const fid = atom.base_entity.fid;
        //   // now grab file blob and save to filesystem
        //   data.url = state.siteUrl + '/app/file/' + fid + '.json';
        //   axios(data)
        //     .then((response) => {
        //       return response.data;
        //     })
        //     .then(async (file) => {
        //
        //       // It appears that sometimes the payload is too large on these, which we'll probably have to address.
        //       // In the meantime catching the error so it doesn't error out the app.
        //       try {
        //         const savedFile = await FileSystem.writeAsStringAsync(FileSystem.documentDirectory + file.filename, file.file);
        //       } catch (error) {
        //         console.log(error);
        //       }
        //
        //     })
        //     .catch((error) => {
        //       console.error(error);
        //     });
        // }
      })
      .catch((error) => {
        console.error(error);
      });
  }

  saveTaxonomy = (tid, data) => {
    let state = this.state;
    data.url = state.siteUrl + '/app/tax-term/' + tid + '.json';
    return axios(data)
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
        console.log('term ' + term.name + ' saved');
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
        tx.executeSql('replace into sync (id, last) values (?, ?)',
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
            let editableState = this.state.editable;
            for (let i = 0; i < array.rows._array.length; i++) {
              let nid = array.rows._array[i].nid;
              let node = JSON.parse(array.rows._array[i].entity);
              nodesState[nid] = node;
              editableState[nid] = array.rows._array[i].editable;
            }
            this.setState({
              'nodes': nodesState,
              'editable': editableState
            });

            try {
              AsyncStorage.getItem('@mukurtu_skip_browse')
                .then((val) => {
                  const skipValues = val != null ? JSON.parse(val) : [];
                  this.setState({'skipInBrowse': skipValues});
                });
            }
            catch (e) {
              console.log('Could not read from asyncStorage', e);
            }

            this.state.db.transaction(
              tx => {
                tx.executeSql('select * from content_types',
                  [],
                  (success, array) => {
                    console.log('content types retrieved');
                    let contentTypesState = array.rows._array[0] !== undefined ? JSON.parse(array.rows._array[0].blob) : {};
                    this.setState({'contentTypes': contentTypesState});


                    this.state.db.transaction(
                      tx => {
                        tx.executeSql('select * from content_type',
                          [],
                          (success, array) => {
                            console.log('content TYPE retrieved');
                            let formFieldsState = {};
                            for (let i = 0; i < array.rows._array.length; i++) {
                              let machineName = array.rows._array[i]['machine_name'];
                              let formFields = JSON.parse(array.rows._array[i]['blob']);
                              formFieldsState[machineName] = formFields;
                            }
                            this.setState({'formFields': formFieldsState});
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
                            for (let i = 0; i < array.rows._array.length; i++) {
                              let tid = array.rows._array[i].tid;
                              let term = JSON.parse(array.rows._array[i].entity);
                              termsState[tid] = term;
                            }
                            this.setState({'terms': termsState});
                            this.state.db.transaction(
                              tx => {
                                tx.executeSql('select * from display_modes',
                                  [],
                                  (success, array) => {
                                    console.log('display modes retreived');
                                    let displayState = {};
                                    for (let i = 0; i < array.rows._array.length; i++) {
                                      let machine_name = array.rows._array[i].machine_name;
                                      let node_view = JSON.parse(array.rows._array[i].node_view);
                                      displayState[machine_name] = node_view;
                                    }
                                    this.setState({'displayModes': displayState});

                                    this.state.db.transaction(
                                      tx => {
                                        tx.executeSql('select * from list_display_modes',
                                          [],
                                          (success, array) => {
                                            console.log('list_display modes retreived');
                                            let displayState = {};
                                            for (let i = 0; i < array.rows._array.length; i++) {
                                              let machine_name = array.rows._array[i].machine_name;
                                              let node_view = JSON.parse(array.rows._array[i].node_view);
                                              displayState[machine_name] = node_view;
                                            }
                                            this.setState({'listDisplayModes': displayState});


                                            this.state.db.transaction(
                                              tx => {
                                                tx.executeSql('select * from viewable_types',
                                                  [],
                                                  (success, array) => {
                                                    console.log('viewable types retrieved');

                                                    if (array.rows._array.length > 0) {
                                                      this.setState({'viewableTypes': JSON.parse(array.rows._array[0].blob)});
                                                    }


                                                    this.state.db.transaction(
                                                      tx => {
                                                        tx.executeSql('select * from paragraphs',
                                                          [],
                                                          (success, array) => {
                                                            console.log('paragraphs retreived');
                                                            let paragraphState = {};
                                                            if (array.rows._array.length > 0) {
                                                              for (let i = 0; i < array.rows._array.length; i++) {
                                                                let pid = array.rows._array[i].pid;
                                                                let data = JSON.parse(array.rows._array[i]['blob']);
                                                                paragraphState[pid] = data;
                                                              }
                                                              this.setState({'paragraphData': paragraphState});


                                                              this.state.db.transaction(
                                                                tx => {
                                                                  tx.executeSql('select * from fieldcollections',
                                                                    [],
                                                                    (success, array) => {
                                                                      console.log('field collections retrieved');
                                                                      let fieldCollectionsState = {};
                                                                      if (array.rows._array.length > 0) {
                                                                        for (let i = 0; i < array.rows._array.length; i++) {
                                                                          let fid = array.rows._array[i].fid;
                                                                          let data = JSON.parse(array.rows._array[i]['blob']);
                                                                          fieldCollectionsState[fid] = data;
                                                                        }
                                                                        this.setState({'fieldCollectionsData': fieldCollectionsState});

                                                                        console.log('everything retrieved');
                                                                      }

                                                                    },
                                                                    (success, error) => {
                                                                      console.log(error);
                                                                    }
                                                                  );
                                                                }
                                                              );

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

  refreshAlert() {
    // This isn't ideal, but setting the alert immediately causes the refresh indicator to hang. Setting it on a timeout
    // prevents this.
    setTimeout(
      function() {
        Alert.alert(
          'Sync Not Available Offline',
          'Please connect to the internet to sync new content.',
          [
            {text: 'OK', onPress: () => {}},
          ],
          {cancelable: false},
        );
      }
        .bind(this),
      1000
    );
  }

  _onRefresh() {
    if (!this.state.isConnected) {
      this.refreshAlert();
      return;
    }
    this.setState(
      {
        'refreshing': true,
        'nodeSyncMessages': {}
      },
      () => {
        // Push any nodes we've saved offline
        try {
          this.pushSavedOffline()
            .then(() => {
              console.log('finished pushing');
              this.newSyncEverything()
            })
        }
        catch(error) {
          console.log(error);
          this.resetSyncMessage();
        }
      });
  }

  logScrollPosition(position) {
    if (position.nativeEvent.contentOffset.y > 20) {
      if (!this.state.disableRefresh) {
        this.setState({disableRefresh: true})
      }
    } else {
      if (this.state.disableRefresh) {
        this.setState({disableRefresh: false})
      }
    }
  }

  resetSyncMessage() {
    this.setState(
      {
        'refreshing': false,
        'nodeSyncMessages': {}
      });
  }


  deleteFromQueue(id) {
    this.state.db.transaction(
      tx => {
        tx.executeSql('delete from saved_offline where id = ?;',
          [id],
          (success, array) => {
            console.log('Node removed from offline queue');
          },
          (_, error) => {
            console.log("Could not remove node from offline queue", error);
          });
      });
  }


  setNodeSyncMessage(type, id, message) {
    let nodeSyncMessages = this.state.nodeSyncMessages;
    nodeSyncMessages[id] = {
      'type': type,
      'message': message
    }

    this.setState({'nodeSynceMessages': nodeSyncMessages});
  }


  pushOfflineAtoms = async (formValues, offlineId) => {
    console.log('Checking for offline media');
    const formData = JSON.parse(JSON.stringify(formValues));
    if (formData._tmp_atom == null) {
      return formData;
    }
    for (let key of Object.keys(formData._tmp_atom)) {
      console.log(`Offline item ${formData.title}: ${key}`);
      const keyParts = key.split('.');

      // const test = await this.queryDB('select * from atom', '');

      const tmpAtoms = await this.queryDB('select * from atom WHERE sid = ?', [formData._tmp_atom[key]]);
      const atom = tmpAtoms[0];
      if (atom != null) {
        console.log('Found offline media');
        const uri = FileSystem.documentDirectory + atom.title;
        var fd = new FormData();
        fd.append("files", {
          uri: Platform.OS === "android" ? uri : uri.replace("file:/", ""),
          name: atom.title,
          type: "multipart/form-data"
        });
        try {
          const fileUpload = await axios({
            method: 'post',
            url: this.state.siteUrl + '/app/file/create_raw',
            data: fd,
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'multipart/form-data',
              'X-CSRF-Token': this.state.token,
              'Cookie': this.state.cookie
            }
          });
          let fid = fileUpload.data[0].fid;

          // Now we submit the file to create the atom
          const data = {
            method: 'post',
            mode: 'cors',
            cache: 'no-cache',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'X-CSRF-Token': this.state.token,
              'Cookie': this.state.cookie
            },
            redirect: 'follow',
            referrer: 'no-referrer',
          };

          let url = this.state.siteUrl;

          const createdScald = await fetch(url + '/app/scald/create?id=' + fid, data)
            .then((response) => response.json())
            .catch(e => console.log('Issue uploading the file:', e));

          data.method = 'GET';
          const scaldData = await fetch(url + '/app/scald/retrieve/' + createdScald.sid + '.json', data)
            .then((response) => response.json())
            .catch(e => console.log('Issue creating the scald:', e));

          await this.queryDB(
            'replace into atom (sid, title, entity) values (?, ?, ?)',
            [scaldData.sid, scaldData.title, JSON.stringify(scaldData)])
            .then(() => console.log('Replaced local DB'))
            .catch((e) => console.log('Issue writing the DB', e));

          await this.queryDB(
            'DELETE FROM atom WHERE sid = ?',
            [formData._tmp_atom[key]])
            .then(() =>  console.log('Removed temp entry'))
            .catch((e) => console.log('Issue writing the DB', e));

          if (formData[keyParts[0]].und != null) {
            formData[keyParts[0]].und[keyParts[1]].sid = scaldData.sid;
          }
          else if (formData[keyParts[0]][keyParts[0]] != null) {
            formData[keyParts[0]][keyParts[1]].sid = scaldData.sid;
          }

          // Save the blob again in case the file was uploaded, but the node fails
          await this.queryDB(
            'replace into saved_offline (blob, id, saved) values (?, ?, 0)',
            [JSON.stringify(formData), offlineId])
            .then(() =>  console.log('Updated offline entry'))
            .catch((e) => console.log('Issue writing the DB', e));
        }
        catch (e) {
          console.log('Error trying to upload offline media:', e);
        }
      }
      else {
        console.log('No local entry found');
      }


      // await this.state.db.transaction(tx => {
      //   tx.executeSql(`select * from atom WHERE sid = ?`, formData._tmp_atom[key],
      //     async (trx, atoms) => {
      //       const atom = atoms.rows._array[0];
      //       if (atom != null) {
      //         console.log('Found offline media');
      //         const uri = this.state.documentDirectory + atom.title;
      //         var fd = new FormData();
      //         fd.append("files", {
      //           uri: Platform.OS === "android" ? uri : uri.replace("file:/", ""),
      //           name: filename,
      //           type: "multipart/form-data"
      //         });
      //         try {
      //           const fileUpload = await axios({
      //             method: 'post',
      //             url: this.state.url + '/app/file/create_raw',
      //             data: fd,
      //             headers: {
      //               'Accept': 'application/json',
      //               'Content-Type': 'multipart/form-data',
      //               'X-CSRF-Token': this.state.token,
      //               'Cookie': this.state.cookie
      //             }
      //           });
      //           let fid = fileUpload.data[0].fid;
      //
      //           // Now we submit the file to create the atom
      //           const data = {
      //             method: 'post',
      //             mode: 'cors',
      //             cache: 'no-cache',
      //             headers: {
      //               'Accept': 'application/json',
      //               'Content-Type': 'application/json',
      //               'X-CSRF-Token': this.props.token,
      //               'Cookie': this.props.cookie
      //             },
      //             redirect: 'follow',
      //             referrer: 'no-referrer',
      //           };
      //
      //           let url = this.state.url;
      //
      //           const createdScald = await fetch(url + '/app/scald/create?id=' + fid, data)
      //             .then((response) => response.json())
      //             .catch(e => console.log('Issue uploading the file:', e));
      //
      //           data.method = 'GET';
      //           const scaldData = await fetch(url + '/app/scald/retrieve/' + createdScald.sid + '.json', data)
      //             .then((response) => response.json())
      //           .catch(e => console.log('Issue creating the scald:', e));
      //
      //           tx.executeSql(
      //             'replace into atom (sid, title, entity) values (?, ?, ?)',
      //             [scaldData.sid, scaldData.title, JSON.stringify(scaldData)],
      //             (_, success) => console.log('Replaced local DB'),
      //             (_, error) => console.log('Issue writing the DB', error)
      //           );
      //           tx.executeSql(
      //             'DELETE FROM atom WHERE sid = ?',
      //             formData._tmp_atom[key],
      //             (_, success) => console.log('Removed temp entry'),
      //             (_, error) => console.log('Issue writing the DB', error)
      //           );
      //
      //           if (formData[keyParts[0]].und != null) {
      //             formData[keyParts[0]].und[keyParts[1]] = scaldData.sid;
      //           }
      //           else if (formData[keyParts[0]][keyParts[0]] != null) {
      //             formData[keyParts[0]][keyParts[1]] = scaldData.sid;
      //           }
      //         }
      //         catch (e) {
      //           console.log('Error trying to upload offline media:', e);
      //         }
      //       }
      //       else {
      //         console.log('No local entry found');
      //       }
      //     });
      // });
    }
    return formData;
  };

  queryDB = (query, args) => {
    return new Promise((resolve, reject) => {
      this.state.db.transaction(tx => {
        tx.executeSql(
          query,
          args,
          (_, result) => resolve(result.rows._array),
          (_, error) => reject(error)
        );
      });
    });
  };

  pushSavedOffline() {

    return new Promise((resolve, reject) => {
      // If we're  not connected, just immediately resolve
      if (!this.state.isConnected) {
        resolve();
      }
      this.state.db.transaction(tx => {
        tx.executeSql('select * from saved_offline',
          [],
          (_, array) => {
            console.log('pushing saved nodes');
            if (array.rows._array.length === 0) {
              resolve();
            }
            const promises = [];
            for (let i = 0; i < array.rows._array.length; i++) {
              console.log('iterating through');
              let formValuesString = array.rows._array[i].blob;
              let offlineId = array.rows._array[i].id;
              promises.push(this.pushOfflineAtoms(JSON.parse(formValuesString), offlineId)
                .then((formValues) => {
                  //  START
                  let currentId = array.rows._array[i].id;

                  // Largely copied from Form.js method for updating existing
                  // nodes, but our state setting is different here
                  const sanitizedValues = sanitizeFormValues(formValues, {formFields: this.state.formFields});
                  if (formValues.nid) {
                    console.log('here');
                    const token = this.state.token;
                    const cookie = this.state.cookie;
                    const data = {
                      method: 'PUT',
                      mode: 'cors',
                      cache: 'no-cache',
                      headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': token,
                        'Cookie': cookie
                      },
                      redirect: 'follow',
                      referrer: 'no-referrer',
                      body: JSON.stringify(sanitizedValues)
                    };

                    fetch(this.state.siteUrl + '/app/node/' + formValues.nid + '.json', data)
                      .then((response) => response.json())
                      .then((responseJson) => {

                        if (typeof responseJson.form_errors === 'object') {
                          let error = '';
                          for (let key in responseJson.form_errors) {
                            error = error + responseJson.form_errors[key] + ' ';
                          }
                          this.setNodeSyncMessage('error', currentId, error)
                        }
                        else {
                          this.deleteFromQueue(currentId);
                        }
                        // resolve();
                        return true;
                      })
                      .catch((error) => {
                        console.log(error);
                        // resolve();
                        return false;
                      });
                  }
                  else {
                    console.log('there');
                    fetch(this.state.siteUrl + '/app/node.json', {
                      method: 'POST',
                      mode: 'cors',
                      cache: 'no-cache',
                      // credentials: 'same-origin',
                      headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'X-CSRF-Token': this.state.token,
                        'Cookie': this.state.cookie
                      },
                      redirect: 'follow',
                      referrer: 'no-referrer',
                      body: JSON.stringify(sanitizedValues),
                    })
                      .then((response) => {

                        // Just skip the rest if we get a bad response
                        if (response.ok === false) {
                          this.setNodeSyncMessage('error', currentId, 'Node submission failed. Please try again.')
                        }
                        return response.json();
                      })
                      .then((responseJson) => {
                        console.log('ok');

                        if (responseJson.hasOwnProperty('nid')) {
                          this.updateSyncedNids(responseJson.nid);
                        }

                        if (typeof responseJson.form_errors === 'object') {

                          let error = '';
                          for (let key in responseJson.form_errors) {
                            error = error + responseJson.form_errors[key] + ' ';
                          }
                          this.setNodeSyncMessage('error', currentId, error)

                        }
                        else {
                          this.deleteFromQueue(currentId);
                        }

                        // resolve();
                        return true;
                      })
                      .catch((error) => {
                        console.log(error);
                        // resolve();
                        return false;
                      });
                  }

                  //  FINISH
                })
              );


            }
            Promise.all(promises).then(res => resolve());

          },
          (_, error) => {
            console.log(error);
            reject();
          }
        );
      });


    });


  }


  updateSyncedNids(nid) {

    fetch(this.state.siteUrl + '/app/synced-entities/create', {
      method: 'post',

      mode: 'cors',
      cache: 'no-cache',
      // credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.state.token,
        'Cookie': this.state.cookie
      },
      redirect: 'follow',
      referrer: 'no-referrer',
      body: nid,
    })
      .then((response) => {

      })
      .then((responseJson) => {

      });

  }


  newSyncEverything() {
    this.setState({
      'initialized': true,
      'syncText': 'Retrieving Synced Content',
      'editable': {}
    });

    let data = this.buildFetchData('GET');
    data.url = this.state.siteUrl + '/app/synced-entities/retrieve';

    // Set up the node request
    let noderequest = axios(data)
      .then((response) => {
        return response.data;
      })
      .then((responseJson) => {
        let subPromises = [];
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


          let nodeIds = Object.keys(nodes);
          let termIds = [];
          if (typeof responseJson.terms === 'object') {
            termIds = Object.keys(responseJson.terms);
          }
          const syncIds = {nodeIds, termIds};


          this.buildRemovalNids(nodes);

          // Build the editable array once based on info from the API.
          let editableNodes = Object.keys(nodes).reduce((acc, cur) => {
            acc[cur] = nodes[cur].editable;
            return acc;
          }, {});

          const skipInBrowse = Object.keys(nodes).filter(id => nodes[id].skip_in_browse_view);
          try {
            AsyncStorage.setItem('@mukurtu_skip_browse', JSON.stringify(skipInBrowse));
          }
          catch (e) {
            console.log('Error saving in asyncStorage', e);
          }

          this.setState({
            'editable': editableNodes,
            'skipInBrowse': skipInBrowse
          });


          subPromises.push(Object.keys(nodes).map((key, index) => {
            this.saveNode(key, syncIds);
          }));
        }


        // Run the taxonomy stuff
        if (typeof responseJson.terms === 'object') {
          subPromises.push(Object.keys(responseJson.terms).map((key, index) => {
            if (key !== "") {
              this.saveTaxonomy(key, data)
            }
          }
          ));
          // this.setState({'terms': responseJson.terms});
        }

        // Run the atoms
        if (typeof responseJson.atoms === 'object') {
          subPromises.push(Object.keys(responseJson.atoms).map((key, index) =>
            // @todo don't update all nodes but starring a node does not save
            this.saveAtom(key, data)
          ));
          // this.setState({'atoms': responseJson.atoms});
        }

        this.updateSync();

        console.log('starting group sync');
        return Promise.all(subPromises);


      })
      .then((t) => {
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
                          tx.executeSql('replace into content_types (id, blob) values (?, ?)',
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
                        tx.executeSql('replace into list_display_modes (machine_name, node_view) values (?, ?)',
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
                .then(() => {
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
            this.setState({
              'syncing': false,
              'refreshing': false,
              'syncText': ''
            })
          })
          .catch((error) => {
            console.log('error syncing');
            this.setState({
              'syncing': false,
              'refreshing': false,
              'syncText': ''
            })
            console.log(error);
          });
      })
      .catch((error) => {
        console.log(error);
        this.setState({
          'syncing': false,
          'refreshing': false,
          'syncText': ''
        })
      });

  }


  // This checks to see if we're logged in on the site.
  // If we're offline, but we do have authorization token in the db, we'll set login state to false and authorized to true
  // If we have both, both are true.
  checkLogin(statusCheck = false) {
    console.log('Check login');

    // Don't perform a status check if there is no connection.
    if (!this.state.isConnected && statusCheck) {
      return false;
    }

    // First, get our global db info
    globalDB.transaction(
      tx => {
        tx.executeSql('select * from database;',
          '',
          (success, array) => {
            console.log('database selected');
            // There might be multiple databases, so we get the last one, assuming it's most recent
            if (array.rows.length > 0) {
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
                    if (array.rows.length > 0) {
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
                      console.log('checking connect');
                      console.log(this.state.siteUrl);
                      fetch(this.state.siteUrl + '/app/system/connect', data)
                        .then((response) => {
                          return response.json()
                        })
                        .then((responseJson) => {
                          // Who knows what COULD come back here depending on drupal site, connection. So let's try catch
                          console.log('test');
                          try {
                            // If this uid is not 0, the user is currently authenticated
                            if (responseJson.user.uid !== 0) {

                              // If this is just a status check, we return early.
                              if (statusCheck) {
                                return true
                              }
                              console.log('authenticate');
                              this.setState({
                                loggedIn: true,
                                syncing: true,
                                isConnected: true,
                                authorized: true,
                                user: user,
                                cookie: cookie,
                                token: token
                              }, () => {
                                this.retrieveEverythingFromDb()
                              }); // Should probably do a new sync

                            } else {
                              this.setState({
                                loggedIn: false,
                                authorized: false,
                                syncing: false,
                                initialized: true
                              });
                            }
                          } catch (e) {
                            this.setState({
                              loggedIn: false,
                              authorized: false,
                              syncing: false,
                              initialized: true
                            });
                          }
                        })
                        .catch((error) => {
                          this.setState({
                            loggedIn: false,
                            authorized: false,
                            syncing: false,
                            initialized: true
                          });
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

}

const
  styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    appnavigator: {
      height: '500',
      flex: 1,
      backgroundColor: 'blue',
    },
    header: {
      flex: 1,
      backgroundColor: 'green',
    },

  });
