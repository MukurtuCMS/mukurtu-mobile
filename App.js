import React from 'react';
import {
  Platform,
  StatusBar,
  StyleSheet,
  View,
  Text,
  NetInfo,
  YellowBox,
  ScrollView,
  RefreshControl,
  Alert
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


const store = configureStore();

// create a global db for database list and last known user
const globalDB = SQLite.openDatabase('global-7');


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
      refreshing: false
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
    console.log('connection change');
    console.log(isConnected);

    this.setState({'isConnected': isConnected});
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
    // But don't run the spinner if we're refreshing — just let the refresh graphic run
    if (this.state.syncing && !this.state.refreshing) {
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
      db: this.state.db
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
          <ScrollView style={styles.container} contentContainerStyle={{flex: 1}}>
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={this._onRefresh}
            />
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

    let databaseName = url.replace(/(^\w+:|^)\/\//, '').replace(/\./g, '_') + '_' + userObject.uid + 'new3';

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
        tx.executeSql(
          'delete from auth;',
        );
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

  saveNode = (nid, data, editable) => {
    let fetchurl = this.state.siteUrl + '/app/node/' + nid + '.json';
    return fetch(fetchurl, this.buildFetchData('GET'))
      .then((response) => {
        return response.json();
      })
      .then((node) => {

        this.state.db.transaction(
          tx => {
            tx.executeSql('replace into nodes (nid, title, entity, editable) values (?, ?, ?, ?)',
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

        return node;
      })
      .then((node) => {
        // Now we need to save the paragraphs, terms, and nodes referenced within each node
        let promises = [];
        for (let field in node) {

          if (field.indexOf('field') !== -1) {

            if (node.hasOwnProperty(field)) {

              // Right now can't figure out how to distinguish field collections from paragraphs, so listing them manually. Need to fix though.
              if (field === 'field_lesson_micro_tasks') {
                if (node[field] !== null && typeof node[field].und !== 'undefined' && typeof node[field].und[0] !== 'undefined') {
                  let fid = node[field].und[0].value;
                  promises.push(this.saveFieldCollection(fid, field, node.type));
                }
              } else if (node[field] !== null && typeof node[field].und !== 'undefined' && typeof node[field].und[0] !== 'undefined' && typeof node[field].und[0]['revision_id'] !== 'undefined') {
                let pid = node[field].und[0].value;
                promises.push(this.saveParagraph(pid, field, node.type));
              } else if (node[field] !== null && typeof node[field].und !== 'undefined' && typeof node[field].und[0] !== 'undefined' && typeof node[field].und[0]['tid'] !== 'undefined') {
                data = this.buildFetchData('GET');
                promises.push(this.saveTaxonomy(node[field].und[0]['tid'], data));
              } else if (node[field] !== null && typeof node[field].und !== 'undefined' && typeof node[field].und[0] !== 'undefined' && typeof node[field].und[0]['nid'] !== 'undefined') {
                data = this.buildFetchData('GET');
                promises.push(this.saveNode(node[field].und[0]['nid'], data));
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


      })
      ;
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


      })
      ;
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

        FileSystem.downloadAsync(
          atom.file_url,
          FileSystem.documentDirectory + atom.title
        )
          .then(({ uri }) => {
            console.log('Finished downloading to ', uri);
          })
          .catch(error => {
            console.error(error);
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
            for (let i = 0; i < array.rows._array.length; i++) {
              let nid = array.rows._array[i].nid;
              let node = JSON.parse(array.rows._array[i].entity);
              nodesState[nid] = node;
            }
            this.setState({'nodes': nodesState});

            this.state.db.transaction(
              tx => {
                tx.executeSql('select * from content_types',
                  [],
                  (success, array) => {
                    console.log('content types retrieved');
                    let contentTypesState = JSON.parse(array.rows._array[0].blob);
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

  _onRefresh() {
    if (!this.state.isConnected) {
      Alert.alert(
        'Sync Not Available Offline',
        'Please connect to the internet to sync new content.',
        [
          {text: 'OK', onPress: () => console.log('OK Pressed')},
        ],
        {cancelable: false},
      );
      return;
    }
    this.setState({
        'refreshing': true,
        'nodeSyncMessages': {}
      },
      () => {
        // Push any nodes we've saved offline
        this.pushSavedOffline()
          .then(() => {
            this.newSyncEverything()
          })

      });
  }


  deleteFromQueue(id) {
    this.state.db.transaction(
      tx => {
        tx.executeSql('delete from saved_offline where id = ?;',
          [id],
          (success, array) => {
            console.log(success);
          },
          (error) => {
            console.log(error);
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


  pushSavedOffline() {

    return new Promise((resolve, reject) => {
      // If we're connected, just immediately resolve
      if (this.state.isConnected) {
        resolve();
      }

      this.state.db.transaction(
        tx => {
          tx.executeSql('select * from saved_offline',
            [],
            (success, array) => {
              console.log('pushing saved nodes');
              for (let i = 0; i < array.rows._array.length; i++) {
                let formValuesString = array.rows._array[i].blob;
                let formValues = JSON.parse(array.rows._array[i].blob);

                let currentId = array.rows._array[i].id;

                // Largely copied from Form.js method for updating existing nodes, but our state setting is different here
                if (formValues.nid) {
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
                    body: formValuesString
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
                      } else {
                        this.deleteFromQueue(currentId);
                      }
                      resolve();
                    })
                    .catch((error) => {

                    });
                } else {
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
                    body: formValuesString,
                  })
                    .then((response) => {

                      // Just skip the rest if we get a bad response
                      if (response.ok === false) {
                        this.setNodeSyncMessage('error', currentId, 'Node submission failed. Please try again.')
                      }
                      return response.json();
                    })
                    .then((responseJson) => {

                      if (responseJson.hasOwnProperty('nid')) {
                        this.updateSyncedNids(responseJson.nid);
                        // If we have a nid, we remove this from the queued nodes
                        this.deleteFromQueue(currentId);

                      }

                      if (typeof responseJson.form_errors === 'object') {

                        let error = '';
                        for (let key in responseJson.form_errors) {
                          error = error + responseJson.form_errors[key] + ' ';
                        }
                        this.setNodeSyncMessage('error', currentId, error)

                      } else {

                      }

                      resolve();

                    })
                    .catch((error) => {
                      console.log(error);
                      resolve();
                    });
                }

              }

            },
            (success, error) => {
              console.log(error);

            }
          );
        }
      );


    });


  }


  /**
   * Largely copied from Form.js postData method, but how we handle state is a bit different so we're going to live
   * with the duplication for now.
   * @param url
   * @param data
   * @param method
   */
  postData(url = '', data = {}, method = 'POST') {
    fetch(url, {
      method: method,
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
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((responseJson) => {

        if (responseJson.hasOwnProperty('nid')) {
          this.updateSyncedNids(responseJson.nid);
        }

        if (typeof responseJson.form_errors === 'object') {
          // this.setState({formErrors: responseJson.form_errors, submitting: false})
        } else {
          // this.setState({
          //   formSubmitted: true,
          //   submitting: false
          // });
          // // Submit this nid to synced entities
          //
          // if (responseJson.hasOwnProperty('nid')) {
          //   this.updateSyncedNids(responseJson.nid);
          // }

        }
      })
      .catch((error) => {
        console.log(error);
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
    this.setState({'initialized': true}); // just in case
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
          this.buildRemovalNids(nodes);


          subPromises.push(Object.keys(nodes).map((key, index) =>
            this.saveNode(key, data)
          ));
        }


        // Run the taxonomy stuff
        if (typeof responseJson.terms === 'object') {
          subPromises.push(Object.keys(responseJson.terms).map((key, index) =>
            this.saveTaxonomy(key, data)
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
              'refreshing': false
            })
          })
          .catch((error) => {
            console.log('error syncing');
            this.setState({
              'syncing': false,
              'refreshing': false
            })
            console.log(error);
          });
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
    scrollview: {
      flex: 1,
      backgroundColor: '#000',
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
