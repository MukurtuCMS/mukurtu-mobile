import React from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import RNPickerSelect from 'react-native-picker-select';
import {FontAwesome} from '@expo/vector-icons';
import NodeTeaser from "../components/Displays/nodeTeaser";
import * as Colors from "../constants/Colors"
import {Ionicons} from '@expo/vector-icons';
import {get} from 'lodash';


export default class HomeScreen extends React.Component {
  static navigationOptions = ({navigation}) => {
    return {
      title: navigation.getParam('contentTypeLabel')
    }
  };

  constructor(props) {
    super(props);
    const {navigation, screenProps} = this.props;
    this.reduceNodes= this.reduceNodes.bind(this);

    // Filter the list of all nodes to just nodes in this content type
    let filteredNodes = this.reduceNodes();


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
      nodes: filteredNodes,
      db: this.props.screenProps.db,
      communityFilterList: [],
      terms: false,
      categoriesList: [],
      categoriesSelected: '0',
      communityList: [],
      communitySelected: '0',
      collectionList: [],
      collectionSelected: '0',
      keywordsList: [],
      keywordsSelected: '0',
      filteredNodes: filteredNodes,
      search: '',
      numberOfNodes: Object.keys(this.props.screenProps.nodes).length
    }
  }

  componentDidMount() {
    // this.props.navigation.addListener('willFocus', this.componentActive);
    // Add listener for internet connection change
    // NetInfo.isConnected.addEventListener('connectionChange', this.handleConnectivityChange);
    // this.checkInitialConnection();
    // this.componentActive();


    this.updateFilters();


  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // Force re-render if number of nodes have changed
    if(this.state.numberOfNodes !== Object.keys(this.props.screenProps.nodes).length) {
      let filteredNodes = this.reduceNodes();
      this.setState({
        'numberOfNodes': Object.keys(this.props.screenProps.nodes).length,
        'nodes': filteredNodes,
        'filteredNodes': filteredNodes
      })
    }
  }


  reduceNodes() {
    let contentType = this.props.navigation.state.params.contentType;
    let filteredNodes = {};
    for(let nid in this.props.screenProps.nodes) {
      if (this.props.screenProps.nodes.hasOwnProperty(nid)) {
        if (this.props.screenProps.nodes[nid].type === contentType) {
          filteredNodes[nid] = this.props.screenProps.nodes[nid];
        }
      }
    }
    return filteredNodes;
  }

  updateFilters = () => {


    let contentType = this.props.navigation.state.params.contentType;

    if(typeof this.props.screenProps.viewableTypes[contentType] === 'undefined') {
      return;
    }

    let validFilters = this.props.screenProps.viewableTypes[contentType]['list view filters'];
    // If there aren't valid filters, just skip all this
    if(typeof validFilters === 'undefined') {
      return;
    }

    let categoriesList = {};
    if (typeof validFilters.field_category !== 'undefined') {
      // Set our label to state
      this.setState({'field_category_label': validFilters.field_category});
      for (let i in this.state.nodes) {
        if (this.state.nodes[i].field_category) {
          const lang = Object.keys(this.state.nodes[i].field_category)[0];
          if (this.state.nodes[i].field_category) {
            const categories = this.state.nodes[i].field_category[lang];
            for (var k = 0; k < categories.length; k++) {
              if (typeof categories[k]['tid'] !== 'undefined' && this.props.screenProps.terms[categories[k]['tid']]) {
                categoriesList[categories[k]['tid']] = this.props.screenProps.terms[categories[k]['tid']].name;
              }
            }
          }
        }
      }
    }
    let keywordsList = {};
    if (typeof validFilters.field_tags !== 'undefined') {
      // Set our label to state
      this.setState({'field_tags_label': validFilters.field_tags});
      for (let i in this.state.nodes) {
        if (this.state.nodes[i].field_tags) {
          const lang = Object.keys(this.state.nodes[i].field_tags)[0];
          if (this.state.nodes[i].field_tags) {
            const keywords = this.state.nodes[i].field_tags[lang];
            if (keywords) {
              for (var k = 0; k < keywords.length; k++) {
                if (typeof keywords[k]['tid'] !== 'undefined' && this.props.screenProps.terms[keywords[k]['tid']]) {
                  keywordsList[keywords[k]['tid']] = this.props.screenProps.terms[keywords[k]['tid']].name;
                }
              }
            }
          }
        }
      }
    }
    let communityList = {};
    if (typeof validFilters.field_community_ref !== 'undefined') {
      this.setState({'field_community_ref_label': validFilters.field_community_ref});
      for (let i in this.state.nodes) {
        if (this.state.nodes[i].field_community_ref) {
          const lang = Object.keys(this.state.nodes[i].field_community_ref)[0];
          if (this.state.nodes[i].field_community_ref) {
            const community = this.state.nodes[i].field_community_ref[lang];
            if (community) {
              for (var k = 0; k < community.length; k++) {
                if (this.state.nodes[community[k].nid]) {
                  communityList[community[k].nid] = this.state.nodes[community[k].nid].title;
                }
              }
            }
          }
        }
      }
    }
    let collectionList = {};
    if (typeof validFilters.field_collection !== 'undefined') {
      this.setState({'field_collection_label': validFilters.field_collection});
      for (let i in this.state.nodes) {
        if (this.state.nodes[i].field_collection) {
          const lang = Object.keys(this.state.nodes[i].field_collection)[0];
          if (this.state.nodes[i].field_collection) {
            const collections = this.state.nodes[i].field_collection[lang];
            if (collections) {
              for (var k = 0; k < collections.length; k++) {
                if (this.state.nodes[collections[k].nid]) {
                  collectionList[collections[k].nid] = this.state.nodes[collections[k].nid].title;
                }
              }
            }
          }
        }
      }
    }
    this.setState({
      categoriesList: categoriesList,
      communityList: communityList,
      collectionList: collectionList,
      keywordsList: keywordsList
    });


  }


  filterCategory = (categories, tid, value = 'tid') => {
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


  getFilteredContentList = () => {

    // Convert filtered content list to array for filtering
    let filteredContentList = Object.keys(this.state.filteredNodes).map((key) => {
      return [Number(key), this.state.filteredNodes[key]];
    });


    // First we want to restrict this to just the nodes in this content type
    filteredContentList = filteredContentList.filter(node => (node[1].type === this.props.navigation.state.params.contentType));

    if (this.state.categoriesSelected !== '0') {
      filteredContentList = filteredContentList.filter(node => this.filterCategory(node[1].field_category, this.state.categoriesSelected));
    }
    if (this.state.communitySelected !== '0') {
      filteredContentList = filteredContentList.filter(node => this.filterCategory(node[1].field_community_ref, this.state.communitySelected, 'nid'));
    }
    if (this.state.keywordsSelected !== '0') {
      filteredContentList = filteredContentList.filter(node => this.filterCategory(node[1].field_tags, this.state.keywordsSelected));
    }
    if (this.state.collectionSelected !== '0') {
      filteredContentList = filteredContentList.filter(node => this.filterCategory(node[1].field_collection, this.state.collectionSelected, 'nid'));
    }

    filteredContentList = filteredContentList.filter(node => {
      return !this.props.screenProps.skipInBrowse.includes(node[0].toString());
    });

    return filteredContentList;
  };

  setSearchText = (text) => {
    // Make this case insensitive
    this.setState({search: text});
    text = text.toLowerCase();
    if (text.length > 0) {

      let filteredNodes = {};
      for (let key in this.state.nodes) {
        // key: the name of the object key
        // index: the ordinal position of the key within the object
        if (this.state.nodes[key].title.toLowerCase().indexOf(text) !== -1) {
          filteredNodes[key] = this.state.nodes[key];
        }
      }
      this.setState({'filteredNodes': filteredNodes});

    } else {
      this.setState({'filteredNodes': this.props.screenProps.nodes});
    }
  }



  render() {


    if (Object.entries(this.state.nodes).length === 0 && this.state.nodes.constructor === Object) {
      return (
        <ScrollView style={styles.container}>
          <View>
            {/*<View style={styles.searchInputContainer}>*/}
            {/*  <Ionicons name="md-search" size={32} style={styles.searchIcon}/>*/}
            {/*  <TextInput*/}
            {/*    style={styles.searchInputInner}*/}
            {/*    placeholder="Search"*/}
            {/*    value={this.state.search}*/}
            {/*    onChangeText={(text) => this.setSearchText(text)}*/}
            {/*  />*/}
            {/*</View>*/}

            <Text>No content found in offline storage.</Text>
          </View>
        </ScrollView>
      )
    }

    let i = 0;

    let categoriesList = [];
    if (this.state.categoriesList && Object.entries(this.state.categoriesList).length !== 0) {
      let categoriesPlaceholder = {
        label: this.state.field_category_label,
        value: '0',
        color: '#9EA0A4',
      };
      let options = [];
      for (let tid in this.state.categoriesList) {
        options.push({
          label: this.state.categoriesList[tid],
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
            return <FontAwesome name="chevron-down" size={25} style={styles.pickerIcon}/>;
          }}
        />
      );
    }

    let keywordsList = [];
    if (this.state.keywordsList && Object.entries(this.state.keywordsList).length !== 0) {
      let keywordsPlaceholder = {
        label: this.state.field_tags_label,
        value: '0',
        color: '#9EA0A4',
      };
      let options = [];
      for (let tid in this.state.keywordsList) {
        options.push({
          label: this.state.keywordsList[tid],
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
            return <FontAwesome name="chevron-down" size={25} style={styles.pickerIcon}/>;
          }}
        />
      );
    }

    let communityList = [];
    if (this.state.communityList && Object.entries(this.state.communityList).length !== 0) {
      let communityPlaceholder = {
        label: this.state.field_community_ref_label,
        value: '0',
        color: '#9EA0A4',
      };
      let options = [];
      for (let nid in this.state.communityList) {
        options.push({
          label: this.state.communityList[nid],
          value: nid
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
            return <FontAwesome name="chevron-down" size={25} style={styles.pickerIcon}/>;
          }}
        />
      );
    }

    let collectionList = [];
    if (this.state.collectionList && Object.entries(this.state.collectionList).length !== 0) {
      let collectionPlaceholder = {
        label: this.state.field_collection_label,
        value: '0',
        color: '#9EA0A4',
      };
      let options = [];
      for (let nid in this.state.collectionList) {
        options.push({
          label: this.state.collectionList[nid],
          value: nid
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
            return <FontAwesome name="chevron-down" size={25} style={styles.pickerIcon}/>;
          }}
        />
      );
    }

    const filteredContentList = this.getFilteredContentList();

    let message;
    if(filteredContentList.length === 0) {
      message = <Text>No content found for those search criteria.</Text>
    }

    return (
      <SafeAreaView style={{flex: 1}}>
        <ScrollView style={styles.container} onScroll={this.props.screenProps.logScrollPosition}>
          <View>
            <View style={styles.searchInputContainer}>
              <Ionicons name="md-search" size={32} style={styles.searchIcon}/>
              <TextInput
                style={styles.searchInputInner}
                placeholder="Search"
                value={this.state.search}
                onChangeText={(text) => this.setSearchText(text)}
              />
            </View>


            {categoriesList}
            {keywordsList}
            {communityList}
            {collectionList}
            {message}
            {
              filteredContentList.map((node) => (
                <NodeTeaser
                  key={i++}
                  node={node[1]}
                  viewableFields={this.state.viewableFields}
                  token={this.props.screenProps.token}
                  cookie={this.props.screenProps.cookie}
                  url={this.props.screenProps.siteUrl}
                  db={this.props.screenProps.db}
                  terms={this.props.screenProps.terms}
                  allNodes={this.props.screenProps.nodes}
                  navigation={this.props.navigation}
                  editable={this.props.screenProps.editable}
                  editableContentTypes={this.props.screenProps.contentTypes}
                />
              ))
            }
          </View>

        </ScrollView>
      </SafeAreaView>
    );
  }

}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingLeft: 15,
    paddingRight: 15,
    paddingTop: 15
  },
  pickerIcon: {
    color: Colors.default.tabIconDefault,
    fontSize: 24,
    right: 10,
    top: 10
  },
  searchIcon: {
    color: '#333333',
    fontSize: 32,
    left: 5,
    top: 6,
    width: 40,
    opacity: .5
  },
  searchInputContainer: {
    height: 60,
    borderWidth: 1,
    borderColor: Colors.default.mediumGray,
    borderRadius: 5,
    backgroundColor: '#FFF',
    marginBottom: 10,
    padding: 8,
    fontSize: 20,
    flexDirection: 'row',
  },
  searchInputInner: {
    height: 50,
    backgroundColor: '#FFF',
    fontSize: 20,
    flex: 1,
    marginTop: -4,
  },
});

/* eslint-disable react-native/no-unused-styles */
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
  buttonContainer: {
    flexWrap: 'wrap',
    flex: 1,
    flexDirection: 'column',
    height: 'auto',
    padding: 0,
    marginLeft: -10,
    marginRight: -10,
    width: 'auto',
  },
  buttonStyle: {
    flex: 1,
    padding: 10,
    backgroundColor: Colors.default.primary,
    marginBottom: 10,
    color: '#FFF',
    fontSize: 16,
  },
});
