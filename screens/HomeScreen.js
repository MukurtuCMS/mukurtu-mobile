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
  Linking
} from 'react-native';
import {WebBrowser, SQLite} from 'expo';
import axios from 'axios';
import {FontAwesome} from '@expo/vector-icons';
import {MonoText} from '../components/StyledText';

const db = SQLite.openDatabase('db.db');

const siteUrl = 'http://mukurtu.lndo.site:8000/';

export default class HomeScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      contentList: [],
      result: null,
      webUrl: siteUrl,
      syncUpdated: [],
      removeNodes: [],
      redirectUrl: null,
      loggedIn: false,
      token: null,
      cookie: null
    }

  }

  static navigationOptions = {
    header: null,
  };

  componentDidMount() {
    this.props.navigation.addListener('willFocus', this.componentActive);
  }

  componentActive = () => {
    this.createNodesTable();
    this.createTokenTable();
    this.createSyncTable();
    this.update();
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
    let data = {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': token,
        'Cookie': cookie
      }
    };


    axios.post(siteUrl + '/app/system/connect', {}, {headers: data.headers})
        .then((responseJson) => {
          if (responseJson.data.user.uid === 0) {
            this.setState({loggedIn: false});

            this.alertNotLoggedIn();
            return false;
          }
          this.setState({loggedIn: true});
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

    let isLoggedInBrowser = this._checkBrowserLoginStatus();
    if (this.state.loggedIn === true) {

      if (isLoggedInBrowser) {
        let result = WebBrowser.openBrowserAsync();
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

        fetch(siteUrl + '/app/one-time-login/retrieve', data)
            .then((response) => response.text())
            .then((responseText) => {

              // Get just the URL from the response text
              responseText = responseText.replace('["', '');
              responseText = responseText.replace('"]', '');

              let result = WebBrowser.openBrowserAsync(responseText);
            })
            .catch((error) => {
              console.error(error);
            });
      }

    } else {
      // If user is not logged into app but is logged into browser, hit logout page with redirect to homepage
      // That way login status stays in sync
      if(isLoggedInBrowser) {
        let result = WebBrowser.openBrowserAsync(siteUrl + '/user/logout?destination=' + siteUrl);
      } else {
        // If user not logged into app, and we're not logged into the browser, go to the homepage
        let result = WebBrowser.openBrowserAsync(siteUrl);
      }
    }
  };

  /**
   * Checks browser login status by fetching the homepage HTML and checking for logged-in class
   * @returns {boolean}
   * @private
   */
  _checkBrowserLoginStatus() {
    let loggedIn = false;
    fetch(siteUrl, {
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
    fetch(siteUrl + '/app/node/' + nid + '.json', data)
        .then((response) => response.json())
        .then((node) => {
          console.log(node.title)
          db.transaction(tx => {
            tx.executeSql(
                'delete from nodes where nid = ?;',
                [node.nid],
                (_, {rows: {_array}}) => console.log(_array)
            );
          });

          db.transaction(
              tx => {
                tx.executeSql('insert into nodes (nid, title, entity) values (?, ?, ?)',
                    [node.nid, node.title, node],
                    (success) => success,
                    (success, error) => console.log(' ')
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
              (success, error) => console.log(' ')
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
        console.log('removing' + currentNid);
        db2.transaction(tx => {
          tx.executeSql(
              'delete from nodes where nid = ?;',
              [currentNid],
              (_, {rows: {_array}}) => console.log(_array)
          );
        });
      }
    }
  }

  render() {
    const list = [
      {
        name: 'Digital Heritage Item 1',
        description: "This is my item text. This is my item textarea I need words to fill in. This is my item text. This is my item textarea I need words to fill in."
      },
      {
        name: 'Digital Heritage Item 2',
        description: "This is my item text. This is my item textarea I need words to fill in. This is my item text. This is my item textarea I need words to fill in."
      }
    ];

    let i = 0;

    return (
        <View style={styles.container}>
          <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
            <View style={styles.header}>
              <Button
                  style={styles.headerButton}
                  title="Browse Digital Heritage"
                  onPress={this._handlePressButtonAsync}
              />
            </View>

            <View style={styles.getStartedContainer}>

              {
                this.state.contentList.map((l) => (
                    <View key={i++} style={styles.listWrapper}>
                      <Text style={styles.listTextHeader}>{l.title}</Text>
                      <FontAwesome name="star" size={25} style={styles.star} onPress={() => this.saveNode(l.nid)}/>
                      <Text style={styles.listTextBody}>{(l.body.und) ? l.body.und[0].value : ''}</Text>
                    </View>
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
