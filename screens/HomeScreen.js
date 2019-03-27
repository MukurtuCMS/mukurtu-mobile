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
  Button
} from 'react-native';
import { WebBrowser, SQLite } from 'expo';
import axios from 'axios';
import { FontAwesome } from '@expo/vector-icons';
import { MonoText } from '../components/StyledText';

const db = SQLite.openDatabase('db.db');

export default class HomeScreen extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      contentList: [],
      result: null
    }
  }

  static navigationOptions = {
    header: null,
  };

  componentDidMount() {
    this.props.navigation.addListener('willFocus', this.componentActive);
    // @todo: Remove this as only for testing
    // this.props.navigation.navigate('Offline');
  }

  componentActive = () => {
    this.createNodesTable();
    this.createTokenTable();
    this.update();
  }

  createTokenTable() {
    db.transaction(tx => {
      tx.executeSql(
        'create table if not exists auth (id integer primary key, token text, cookie text);'
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
        (_, { rows: { _array } }) => this.getToken(_array)
      );
    });
  }

  alertNotLoggedIn() {
    Alert.alert(
      'Connection Issue',
      'We are having trouble reaching the servers.',
      [
        {text: 'Continue Offline', onPress: () => this.props.navigation.navigate('Offline')},
        {text: 'Log In', onPress: () => this.props.navigation.navigate('Login')},
      ],
      { cancelable: false }
    )
  }

  getToken(array) {
    if (array === undefined || array.length < 1) {
      this.alertNotLoggedIn();
      return false;
    }
    const token = array[0].token;
    const cookie = array[0].cookie;
    let data = {
      method: 'POST',
      headers: {
        'Accept':       'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': token,
        'Cookie': cookie
      }
    };
    axios.post('http://mukurtucms.kanopi.cloud/app/system/connect', {}, {headers: data.headers})
      .then((responseJson) => {
        if (responseJson.data.user.uid === 0) {
          this.alertNotLoggedIn();
        }
        data.method = 'GET';
        fetch('http://mukurtucms.kanopi.cloud/app/node.json?parameters[type]=digital_heritage&pagesize=10&options[entity_load]=true', data)
          .then((response) => response.json())
          .then((responseJson) => {
            this.setState({contentList: responseJson});

          })
          .catch((error) => {
            console.error(error);
          });
      })
      .catch((error) => {
        console.error(error);
        this.alertNotLoggedIn();
      });
  }

  _handlePressButtonAsync = async () => {
    let result = await WebBrowser.openBrowserAsync('http://mukurtucms.kanopi.cloud/digital-heritage');
    this.setState({ result });
  };

  saveNode(nid) {
    const nodes = this.state.contentList;
    for (var i = 0; i < this.state.contentList.length; i++) {
      if (nodes[i].nid === nid) {
        const node = nodes[i];
        db.transaction(
         tx => {
           tx.executeSql('insert into nodes (nid, title, entity) values (?, ?, ?)',
             [node.nid, node.title, node],
             (success) => console.log(success),
             (success, error) => console.log(' ')
           );
         }
       );
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
                  <FontAwesome name="star" size={25} style={styles.star} onPress={() => this.saveNode(l.nid)} />
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
        shadowOffset: { height: -3 },
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
