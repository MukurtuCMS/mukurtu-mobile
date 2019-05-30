import React from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  Button,
  Linking, NetInfo
} from 'react-native';
import {WebBrowser, SQLite} from 'expo';
import axios from 'axios';
import {FontAwesome} from '@expo/vector-icons';
import {MonoText} from '../components/StyledText';
import JSONTree from 'react-native-json-tree'
import SettingsList from "react-native-settings-list";
import NodeTeaser from "../components/Displays/nodeTeaser";

const db = SQLite.openDatabase('db.db');

export default class HomeScreen extends React.Component {
  constructor(props) {
    super(props);
    const { navigation, screenProps } = this.props;
    this.state = {
      contentList: [],
      result: null,
      syncUpdated: [],
      removeNodes: [],
      redirectUrl: null,
      loggedIn: false,
      token: null,
      cookie: null,
      isConnected: true,
      nodes: []
    }

  }

  static navigationOptions = {
    header: null,
  };

  componentDidMount() {
    this.props.navigation.addListener('willFocus', this.componentActive);
    // Add listener for internet connection change
    NetInfo.isConnected.addEventListener('connectionChange', this.handleConnectivityChange);
  }

  componentWillUnmount() {
    NetInfo.isConnected.removeEventListener('connectionChange', this.handleConnectivityChange);
  }

  handleConnectivityChange = isConnected => {
    this.setState({ isConnected });
  }

  componentActive = () => {
    this.createNodesTable();
    this.createTokenTable();
    this.createSyncTable();
    this.createNodesSavedTable();
    this.createContentTypesTable();
    this.createContentTypeTable();
    this.update();
    this.syncContentTypes();

    db.transaction(tx => {
      tx.executeSql(
          'select * from nodes limit 10;',
          '',
          (_, { rows: { _array } }) => this.updateNodes(_array)
      );
    });
  }

  updateNodes(array) {
    // let's parse the json blobs before setting state
    for (var i = 0; i < array.length; i++) {
      array[i].entity = JSON.parse(array[i].entity);
    }
    this.setState({nodes: array});
  }

  createTokenTable() {
    db.transaction(tx => {
      tx.executeSql(
          'create table if not exists auth (id integer primary key, token text, cookie text);'
      );
    });
  }

  createSyncTable() {
    db.transaction(tx => {
      tx.executeSql(
          'create table if not exists sync (id integer primary key, last integer);'
      );
    });
  }

  createNodesTable() {
    db.transaction(tx => {
      tx.executeSql(
          'create table if not exists nodes (nid integer primary key, title text, entity text);'
      );
    });
  }

  // this will be a store for any nodes that need to be uploaded next sync
  createNodesSavedTable() {
    db.transaction(tx => {
      tx.executeSql(
          'create table if not exists nodes_saved (nid integer primary key, title text, entity text);'
      );
    });
  }

  // this will be a store the content types overview endpoint
  createContentTypesTable() {
    db.transaction(tx => {
      tx.executeSql(
          'create table if not exists content_types (id integer primary key, blob text);'
      );
    });
  }

  // this will be a store the content type endpoint
  createContentTypeTable() {
    db.transaction(tx => {
      tx.executeSql(
          'create table if not exists content_type (machine_name text primary key, blob text);'
      );
    });
  }

  update() {
    db.transaction(tx => {
      tx.executeSql(
          'select * from auth limit 1;',
          '',
          (_, {rows: {_array}}) => this.getToken(_array)
      );
    });
  }


  alertNotLoggedIn() {
    // This is done inline in some places,
    // But setting it here as well as a catch to ensure state is updated.
    this.setState({loggedIn: false});
    Alert.alert(
        'Connection Issue',
        'We are having trouble reaching the servers.',
        [
          {
            text: 'Continue Offline',
            style: 'cancel',
          },
          {text: 'Log In', onPress: () => this.props.navigation.navigate('Login')},
        ],
        {cancelable: true}
    )
  }

  getToken(array) {
    if (array === undefined || array.length < 1) {

      this.alertNotLoggedIn();
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
    let data = this.buildFetchData('POST');


    fetch('http://mukurtucms.kanopi.cloud' + '/app/system/connect', data)
        .then((response) => response.json())
        .then((responseJson) => {
          if (responseJson.user.uid === 0) {
            this.alertNotLoggedIn();
            return false;
          }
          this.setState({loggedIn: true});
          data.method = 'GET';


          fetch('http://mukurtucms.kanopi.cloud' + '/app/synced-nodes/retrieve', data)
              .then((response) => response.json())
              .then((responseJson) => {
                if (typeof responseJson.digital_heritage === 'object') {
                  this.buildRemovalNids(responseJson.digital_heritage);
                  for (const [nid, timestamp] of Object.entries(responseJson.digital_heritage)) {
                    // @todo don't update all nodes but starring a node does not save
                    // if (timestamp > this.state.syncUpdated) {
                    this.saveNode(nid, data);
                    this.updateSync();
                    // }
                  }
                }
              })
              .catch((error) => {
                console.error(error);
              });
        })
        .catch((error) => {
          this.setState({loggedIn: false})
          this.alertNotLoggedIn();
        });
  }


  /**
   * Handler for button that switches to browser
   * @param event
   * @returns {Promise<void>}
   * @private
   */
  _handlePressButtonAsync = async (url) => {

    let isLoggedInBrowser = this._checkBrowserLoginStatus(url);

    if (this.state.loggedIn === true) {

      if (isLoggedInBrowser) {
        let result = WebBrowser.openBrowserAsync(url);
      } else {
        // // If we're not logged in in the browser, get one time login link and then use it
        let data = {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-Token': this.state.token,
            'Cookie': this.state.cookie
          }
        };

        fetch(url + '/app/one-time-login/retrieve', data)
            .then((response) => response.json())
            .then((responseText) => {

              let result = WebBrowser.openBrowserAsync(responseText[0]);
            })
            .catch((error) => {
              console.error(error);
            });
      }

    } else {
      // If user is not logged into app but is logged into browser, hit logout page with redirect to homepage
      // That way login status stays in sync
      if (isLoggedInBrowser) {
        let result = WebBrowser.openBrowserAsync(url + '/user/logout?destination=' + url);
      } else {
        // If user not logged into app, and we're not logged into the browser, go to the homepage
        let result = WebBrowser.openBrowserAsync(url);
      }
    }
  };

  /**
   * Checks browser login status by fetching the homepage HTML and checking for logged-in class
   * @returns {boolean}
   * @private
   */
  _checkBrowserLoginStatus(url) {
    let loggedIn = false;

    fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.state.token,
      }
    })
        .then((response) => {
          // When the page is loaded convert it to text
          return response.text()
        })
        .then((html) => {
          // Might be better to use a dom parser
          loggedIn = html.includes(' logged-in');
        })
        .catch((error) => {
          console.error(error);
        });

    return loggedIn;
  }

  saveNode(nid, data) {
    fetch(this.props.screenProps.siteUrl + '/app/node/' + nid + '.json', data)
        .then((response) => response.json())
        .then((node) => {
          db.transaction(tx => {
            tx.executeSql(
                'delete from nodes where nid = ?;',
                [node.nid],
                (_, {rows: {_array}}) => ''
            );
          });

          db.transaction(
              tx => {
                tx.executeSql('insert into nodes (nid, title, entity) values (?, ?, ?)',
                    [node.nid, node.title, JSON.stringify(node)],
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

  updateSync() {
    const time = new Date().getTime()
    db.transaction(
        tx => {
          tx.executeSql('delete from sync;',
          );
        }
    );
    db.transaction(
        tx => {
          tx.executeSql('insert into sync (id, last) values (?, ?)',
              [1, time],
              (success) => success,
              (success, error) => ''
          );
        }
    );
  }

  buildRemovalNids(nids) {
    db.transaction(tx => {
      tx.executeSql(
          'select nid from nodes;',
          '',
          (_, {rows: {_array}}) => this.removeNids(_array, nids)
      );
    });
  }

  removeNids(currentNids, newNids) {
    const db2 = SQLite.openDatabase('db.db');
    for (var i = 0; i < currentNids.length; i++) {
      var currentlyStarred = false;
      for (const [nid, timestamp] of Object.entries(newNids)) {
        if (currentNids[i].nid == nid) {
          currentlyStarred = true;
        }
      }
      if (!(currentlyStarred)) {
        var currentNid = currentNids[i].nid;
        db2.transaction(tx => {
          tx.executeSql(
              'delete from nodes where nid = ?;',
              [currentNid],
              (_, {rows: {_array}}) => console.log('')
          );
        });
      }
    }
  }

  syncContentTypes() {
    if (!this.state.loggedIn) {
      return false;
    }
    const data = this.buildFetchData();
    fetch('http://mukurtucms.kanopi.cloud/app/creatable-types/retrieve', data)
        .then((response) => response.json())
        .then((responseJson) => {
          if (typeof responseJson === 'object' && responseJson !== null) {
            db.transaction(
                tx => {
                  tx.executeSql('delete from content_types;',
                  );
                }
            );
            db.transaction(
                tx => {
                  tx.executeSql('insert into content_types (id, blob) values (?, ?)',
                      [1, JSON.stringify(responseJson)],
                      (success) => '',
                      (success, error) => console.log(' ')
                  );
                }
            );

            // now let's sync all content type endpoints
            for (const [machineName, TypeObject] of Object.entries(responseJson)) {
              fetch('http://mukurtucms.kanopi.cloud/app/node-form-fields/retrieve/' + machineName, data)
                  .then((response) => response.json())
                  .then((responseJson) => {
                    db.transaction(
                        tx => {
                          tx.executeSql('delete from content_type;',
                          );
                        }
                    );

                    db.transaction(
                        tx => {
                          tx.executeSql('insert into content_type (machine_name, blob) values (?, ?)',
                              [machineName, JSON.stringify(responseJson)],
                              (success) => '',
                              (success, error) => ''
                          );
                        }
                    );
                  })
                  .catch((error) => {
                    // console.error(error);
                  });
            }
          }
        })
        .catch((error) => {
          console.error(error);
        });
  }

  buildFetchData(method = 'GET'){
    const token = this.state.token;
    const cookie = this.state.cookie;
    const data = {
      method: method,
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': token,
        'Cookie': cookie
      }
    };
    return data;
  }


  render() {
    if (this.state.nodes.length < 1) {
      return (
          <View><Text>No nodes were found in offline storage.</Text></View>
      )
    }

    let i = 0;

    return (
        <View style={styles.container}>
          <ScrollView style={styles.container}>

            <View>

              <Text>Offline Nodes</Text>
              {
                this.state.nodes.map((node) => (
                    <NodeTeaser key={i++} node={node} navigation={this.props.navigation} />
                ))
              }
            </View>

          </ScrollView>

        </View>
    );
  }

  _maybeRenderDevelopmentModeWarning() {
    if (__DEV__) {
      const learnMoreButton = (
          <Text onPress={this._handleLearnMorePress} style={styles.helpLinkText}>
            Learn more
          </Text>
      );

      return (
          <Text style={styles.developmentModeText}>
            Development mode is enabled, your app will be slower but you can use useful development
            tools. {learnMoreButton}
          </Text>
      );
    } else {
      return (
          <Text style={styles.developmentModeText}>
            You are not in development mode, your app will run at full speed.
          </Text>
      );
    }
  }

  _handleLearnMorePress = () => {
    WebBrowser.openBrowserAsync('https://docs.expo.io/versions/latest/guides/development-mode');
  };

  _handleHelpPress = () => {
    WebBrowser.openBrowserAsync(
        'https://docs.expo.io/versions/latest/guides/up-and-running.html#can-t-see-your-changes'
    );
  };
}

const styles = StyleSheet.create({
  listTextHeader: {
    fontSize: 24,
    flex: 1
  },
  listTextBody: {
    width: '100%'
  },
  listWrapper: {
    textAlign: 'left',
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap'
  },
  star: {
    color: '#e0e0e0',
    width: 50,
    paddingLeft: 10
  },
  header: {
    height: 50,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingTop: 7,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    borderBottomWidth: 1
  },
  headerButton: {
    marginTop: 5,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  developmentModeText: {
    marginBottom: 20,
    color: 'rgba(0,0,0,0.4)',
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center',
  },
  contentContainer: {
    paddingTop: 30,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  welcomeImage: {
    width: 100,
    height: 80,
    resizeMode: 'contain',
    marginTop: 3,
    marginLeft: -10,
  },
  getStartedContainer: {
    alignItems: 'center',
    marginHorizontal: 50,
    marginTop: 20
  },
  homeScreenFilename: {
    marginVertical: 7,
  },
  codeHighlightText: {
    color: 'rgba(96,100,109, 0.8)',
  },
  codeHighlightContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 3,
    paddingHorizontal: 4,
  },
  getStartedText: {
    fontSize: 17,
    color: 'rgba(96,100,109, 1)',
    lineHeight: 24,
    textAlign: 'center',
  },
  tabBarInfoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      ios: {
        shadowColor: 'black',
        shadowOffset: {height: -3},
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 20,
      },
    }),
    alignItems: 'center',
    backgroundColor: '#fbfbfb',
    paddingVertical: 20,
  },
  tabBarInfoText: {
    fontSize: 17,
    color: 'rgba(96,100,109, 1)',
    textAlign: 'center',
  },
  navigationFilename: {
    marginTop: 5,
  },
  helpContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  helpLink: {
    paddingVertical: 15,
  },
  helpLinkText: {
    fontSize: 14,
    color: '#2e78b7',
  },
});
