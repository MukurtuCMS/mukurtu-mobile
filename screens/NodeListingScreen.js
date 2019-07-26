import React from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Button,
  Linking, NetInfo, Picker
} from 'react-native';
import RNPickerSelect, { defaultStyles } from 'react-native-picker-select';
import {WebBrowser} from 'expo';
import { FontAwesome }  from '@expo/vector-icons';
import {SQLite} from 'expo-sqlite';
import axios from 'axios';
import {MonoText} from '../components/StyledText';
import JSONTree from 'react-native-json-tree'
import SettingsList from "react-native-settings-list";
import NodeTeaser from "../components/Displays/nodeTeaser";
import * as Colors from "../constants/Colors"

// create a global db for database list and last known user
const globalDB = SQLite.openDatabase('global');

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
      loggedIn: screenProps.loggedIn,
      token: null,
      cookie: null,
      isConnected: false,
      nodes: [],
      db: (screenProps.databaseName) ? SQLite.openDatabase(screenProps.databaseName) : null,
      communityFilterList: [],
      terms: false,
      nodeList: false,
      categoriesList: [],
      categoriesSelected: '0',
      communityList: [],
      communitySelected: '0',
      collectionList: [],
      collectionSelected: '0',
      keywordsList: [],
      keywordsSelected: '0',
      filteredContentList: [],
      search: ''
    }
  }

  static navigationOptions = {
    header: null,
  };

  componentDidMount() {
    this.props.navigation.addListener('willFocus', this.componentActive);
    // Add listener for internet connection change
    NetInfo.isConnected.addEventListener('connectionChange', this.handleConnectivityChange);
    this.checkInitialConnection();
    this.componentActive();
  }

  checkInitialConnection = async () => {
    const isConnected = await NetInfo.isConnected.fetch();
    this.setState({isConnected: isConnected});
  }

  componentWillUnmount() {
    NetInfo.isConnected.removeEventListener('connectionChange', this.handleConnectivityChange);
  }

  handleConnectivityChange = isConnected => {
    this.setState({ isConnected });
  }

  componentActive = () => {
    // Immediately check if first time, and rout to login screen
    if (this.props.screenProps.firstTime) {
      this.props.navigation.navigate('Login');
    }
    if (this.state.db) {

      this.state.db.transaction(tx => {
        tx.executeSql(
          'select * from nodes;',
          '',
          (_, {rows: {_array}}) => this.updateNodes(_array)
        );
      });

      this.state.db.transaction(tx => {
        tx.executeSql(
          'select * from taxonomy;',
          '',
          (query, result) => this.setTaxonomy(result.rows._array)
        );
      });
    }
  }

  setTaxonomy = (array) => {
    let termList = {};
    for (var i = 0; i < array.length; i++) {
      termList[array[i].tid] = JSON.parse(array[i].entity)
    }
    this.setState({terms: termList});
  }

  updateNodes(array) {
    let nodeList = {};
    // let's parse the json blobs before setting state
    for (var i = 0; i < array.length; i++) {
      if (array[i].entity && array[i].entity.length > 0) {
        array[i].entity = JSON.parse(array[i].entity);
        if (array[i]) {
          nodeList[array[i].nid] = array[i].entity;
        }
      }
    }

    this.setState({nodes: array, filteredContentList: array, nodeList: nodeList});
    this.updateFilters();
  }

  // @todo: Possibly remove this as I had to use a custom function for filtering anyways
  preprocessFilteredContent = (array) => {
    // we need to replace any languages with und so we can filter correctly
    let count = 0;
    count++;
    let preprocessedArray = [];
    if (array.length > 0) {
      for (var i = 0; i < array.length; i++) {
        count++;
        if (array[i].entity) {
          for (const [fieldName, fieldValue] of Object.entries(array[i].entity)) {
            if (fieldValue && typeof fieldValue === 'object') {
              const lang = (Object.keys(fieldValue)) ? Object.keys(fieldValue)[0] : null;
              if (lang && lang === 'en') {
                array[i].entity[fieldName]['und'] = array[i].entity[fieldName]['en'];
                delete array[i].entity[fieldName][lang];
              }
            }
          }
        }
      }
    }
    return array;
  }

  updateFilters = () => {
    let categoriesList = {};
    if (this.state.nodes.length > 0) {
      for (var i = 0; i < this.state.nodes.length; i++) {
        if (this.state.nodes[i].entity.field_category) {
          const lang = Object.keys(this.state.nodes[i].entity.field_category)[0];
          if (this.state.nodes[i].entity.field_category) {
            const categories = this.state.nodes[i].entity.field_category[lang];
            for (var k = 0; k < categories.length; k++) {
              if (this.state.terms[categories[k].tid]) {
                categoriesList[categories[k].tid] = this.state.terms[categories[k].tid].name;
              }
            }
          }
        }
      }
    }
    let keywordsList = {};
    if (this.state.nodes.length > 0) {
      for (var i = 0; i < this.state.nodes.length; i++) {
        if (this.state.nodes[i].entity.field_tags) {
          const lang = Object.keys(this.state.nodes[i].entity.field_tags)[0];
          if (this.state.nodes[i].entity.field_tags) {
            const keywords = this.state.nodes[i].entity.field_tags[lang];
            if (keywords) {
              for (var k = 0; k < keywords.length; k++) {
                if (this.state.terms[keywords[k].tid]) {
                  keywordsList[keywords[k].tid] = this.state.terms[keywords[k].tid].name;
                }
              }
            }
          }
        }
      }
    }
    let communityList = {};
    if (this.state.nodes.length > 0 && this.state.nodeList.length > 0) {
      for (var i = 0; i < this.state.nodes.length; i++) {
        if (this.state.nodes[i].entity.field_community_ref) {
          const lang = Object.keys(this.state.nodes[i].entity.field_community_ref)[0];
          if (this.state.nodes[i].entity.field_community_ref) {
            const community = this.state.nodes[i].entity.field_community_ref[lang];
            if (community) {
              for (var k = 0; k < community.length; k++) {
                if (this.state.nodes[community[k].nid]) {
                  communityList[community[k].nid] = this.state.nodeList[community[k].nid].title;
                }
              }
            }
          }
        }
      }
    }
    let collectionList = {};
    if (this.state.nodes.length > 0) {
      for (var i = 0; i < this.state.nodes.length; i++) {
        if (this.state.nodes[i].entity.field_collection) {
          const lang = Object.keys(this.state.nodes[i].entity.field_collection)[0];
          if (this.state.nodes[i].entity.field_collection) {
            const collections = this.state.nodes[i].entity.field_collection[lang];
            if (collections) {
              for (var k = 0; k < collections.length; k++) {
                if (this.state.nodes[collections[k].nid]) {
                  collectionList[collections[k].nid] = this.state.nodeList[collections[k].nid].title;
                }
              }
            }
          }
        }
      }
    }
    this.setState({categoriesList: categoriesList, communityList: communityList, collectionList: collectionList, keywordsList: keywordsList});
  }

  filterCategory = (categories, tid, value='tid') => {
    if (categories && tid) {
      const lang = Object.keys(categories)[0];
      if (categories[lang]) {
        for (var i = 0; i < categories[lang].length; i++) {
          if (categories[lang][i][value] === tid) {
            return true;
          }
        }
      }
    }
    return false;
  }

  setFilters = (filter, tid) => {
    if (filter === 'category') {
      this.setState({categoriesSelected: tid});
      let content = this.state.nodes;
      if (tid !== '0') {
        content = content.filter(node => this.filterCategory(node.entity.field_category, tid));
      }
      this.setState({filteredContentList: content});
    }
    if (filter === 'community') {
      this.setState({communitySelected: tid});
      let content = this.state.nodes;
      if (tid !== '0') {
        content = content.filter(node => this.filterCategory(node.entity.field_community_ref, tid, 'nid'));
      }
      this.setState({filteredContentList: content});
    }
  }

  getFilteredContentList = () => {
    let filteredContentList = this.state.nodes;
    if (this.state.categoriesSelected !== '0') {
      filteredContentList = filteredContentList.filter(node => this.filterCategory(node.entity.field_category, this.state.categoriesSelected));
    }
    if (this.state.communitySelected !== '0') {
      filteredContentList = filteredContentList.filter(node => this.filterCategory(node.entity.field_community_ref, this.state.communitySelected, 'nid'));
    }
    if (this.state.keywordsSelected !== '0') {
      filteredContentList = filteredContentList.filter(node => this.filterCategory(node.entity.field_tags, this.state.keywordsSelected));
    }
    if (this.state.collectionSelected !== '0') {
      filteredContentList = filteredContentList.filter(node => this.filterCategory(node.entity.field_collection, this.state.collectionSelected, 'nid'));
    }

    return filteredContentList;
  }

  setSearchText = (text) => {
    this.setState({search: text});
    if (text.length > 0) {
      this.state.db.transaction(tx => {
        tx.executeSql(
          "select * from nodes where instr(upper(entity), upper(?)) > 0;",
          [text],
          (_, {rows: {_array}}) => this.updateNodes(_array)
        );
      });
    } else {
      this.state.db.transaction(tx => {
        tx.executeSql(
          "select * from nodes;",
          '',
          (_, {rows: {_array}}) => this.updateNodes(_array)
        );
      });
    }
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

  render() {

  if (this.state.nodes.length < 1) {
      return (
          <View>
            <TextInput
              style={styles.textInput}
              onChangeText={(text) => this.setSearchText(text)}
              value={this.state.search}
            />
            <Text>No nodes were found in offline storage.</Text>
          </View>
      )
    }

    let i = 0;

    let categoriesList = [];
    if (this.state.categoriesList) {
      let categoriesPlaceholder = {
        label: 'Select a Category',
        value: '0',
        color: '#9EA0A4',
      };
      let options = [];
      for (const [tid, name] of Object.entries(this.state.categoriesList)) {
          options.push({
            label: name,
            value: tid
            }
          );
      }
      categoriesList.push(
        <RNPickerSelect
          placeholder={categoriesPlaceholder}
          key={0}
          items={options}
          onValueChange={value => {
            this.setState({categoriesSelected: value})
          }}
          style={pickerSelectStyles}
          value={this.state.categoriesSelected}
          Icon={() => {
            return <FontAwesome name="chevron-down" size={25} style= {styles.pickerIcon} />;
          }}
        />
      );
    }

    let keywordsList = [];
    if (this.state.keywordsList) {
      let keywordsPlaceholder = {
        label: 'Select a Keyword',
        value: '0',
        color: '#9EA0A4',
      };
      let options = [];
      for (const [tid, name] of Object.entries(this.state.keywordsList)) {
        options.push({
            label: name,
            value: tid
          }
        );
      }
      keywordsList.push(
        <RNPickerSelect
          placeholder={keywordsPlaceholder}
          key={0}
          items={options}
          onValueChange={value => {
            this.setState({keywordsSelected: value})
          }}
          style={pickerSelectStyles}
          value={this.state.keywordsSelected}
          Icon={() => {
            return <FontAwesome name="chevron-down" size={25} style= {styles.pickerIcon} />;
          }}
        />
      );
    }

    let communityList = [];
    if (this.state.communityList) {
      let communityPlaceholder = {
        label: 'Select a Community',
        value: '0',
        color: '#9EA0A4',
      };
      let options = [];
      for (const [nid, title] of Object.entries(this.state.communityList)) {
        options.push({
            label: name,
            value: tid
          }
        );
      }
      communityList.push(
        <RNPickerSelect
          placeholder={communityPlaceholder}
          key={0}
          items={options}
          onValueChange={value => {
            this.setState({communitySelected: value})
          }}
          style={pickerSelectStyles}
          value={this.state.communitySelected}
          Icon={() => {
            return <FontAwesome name="chevron-down" size={25} style= {styles.pickerIcon} />;
          }}
        />
      );
    }

    let collectionList = [];
    if (this.state.collectionList) {
      let collectionPlaceholder = {
        label: 'Select a Collection',
        value: '0',
        color: '#9EA0A4',
      };
      let options = [];
      for (const [nid, title] of Object.entries(this.state.collectionList)) {
        options.push({
            label: name,
            value: tid
          }
        );
      }
      collectionList.push(
        <RNPickerSelect
          placeholder={collectionPlaceholder}
          key={0}
          items={options}
          onValueChange={value => {
            this.setState({collectionSelected: value})
          }}
          style={pickerSelectStyles}
          value={this.state.collectionSelected}
          Icon={() => {
            return <FontAwesome name="chevron-down" size={25} style= {styles.pickerIcon} />;
          }}
        />
      );
    }

    const filteredContentList = this.getFilteredContentList();

    return (
          <ScrollView style={styles.container}>

            <View>
              <TextInput
                style={styles.textInput}
                onChangeText={(text) => this.setSearchText(text)}
                value={this.state.search}
              />
              {categoriesList}
              {keywordsList}
              {communityList}
              {collectionList}
              {
                filteredContentList.map((node) => (
                    <NodeTeaser key={i++} node={node} navigation={this.props.navigation} />
                ))
              }
            </View>

          </ScrollView>
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
    paddingLeft: 15,
    paddingRight: 15
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
  picker: {
    width: '100%',
    backgroundColor: Colors.default.primary,
    borderColor: 'black',
    borderWidth: 1,
    color: '#FFF',
    height:24
  },
  pickerItem: {
  },
  pickerView: {
    width:'100%',
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: Colors.default.primary,
    paddingVertical: 10,
    position: 'relative',
    marginBottom: 10
  },
  pickerIcon: {
    color: Colors.default.tabIconDefault,
    fontSize: 24,
    right: 10,
    top: 10
  },
  textInput: {
    backgroundColor: Colors.default.lightGray,
    height: 45,
    marginBottom: 10,
    marginTop: 10,
    paddingLeft: 10,
    paddingRight: 10
  }
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 4,
    color: '#FFF',
    paddingRight: 30, // to ensure the text is never behind the icon
    backgroundColor: Colors.default.primary,
    marginBottom: 10,
    textTransform: 'uppercase'
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderRadius: 8,
    color: '#FFF',
    paddingRight: 30, // to ensure the text is never behind the icon
    backgroundColor: Colors.default.primary,
    marginBottom: 10,
    textTransform: 'uppercase'
  },
});