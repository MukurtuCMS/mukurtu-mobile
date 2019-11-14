import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Dimensions, WebView, Image
} from 'react-native';
import * as SQLite from 'expo-sqlite';
import MapView from "react-native-maps";
import {Marker} from "react-native-maps";
import HTML from 'react-native-render-html';
import {Star} from "../components/Star";
import {ScaldItem} from "../components/ScaldItem";
import {ParagraphView} from "../components/ParagraphView";
import {Term} from "../components/Term";
import axios from "axios";
import * as Colors from "../constants/Colors";
import {EmbeddedNode} from "../components/EmbeddedNode";
import NodeTeaser from "../components/Displays/nodeTeaser";


// create a global db for database list and last known user
const globalDB = SQLite.openDatabase('global-8');

class NodeScreen extends React.Component {
  static navigationOptions = ({navigation}) => ({
    title: `${navigation.getParam('node').title}`,
    headerStyle: {
      backgroundColor: Colors.default.gold,
      marginTop: -20,
    },
    headerTintColor: '#000',
  });

  constructor(props) {
    super(props);
    // Pass props down from App.js, since we're not using Redux
    const {navigation, screenProps} = this.props;
    const siteUrl = screenProps.siteUrl;
    this.state = {
      url: siteUrl,
      db: (screenProps.databaseName) ? SQLite.openDatabase(screenProps.databaseName) : null,
      displayModes: false,
      terms: this.props.screenProps.terms,
      nodes: null
    }
  }

  componentDidMount() {
    const type = this.props.navigation.getParam('contentType');



    // Filter display modes by weight
    let displayModes = this.props.screenProps.displayModes[type];
    // let filteredDisplayModes = [];
    //
    // for (let key in displayModes) {
    //   if (displayModes.hasOwnProperty(key)) {
    //     filteredDisplayModes.push({[key]: displayModes[key]})
    //   }
    // }

    let displayModesArray = Object.keys(displayModes).map(function(key) {
      return [key, displayModes[key]];
    });

    displayModesArray.sort((a, b) =>{
      return a['weight'] - b['weight'];
    });


    // filteredDisplayModes = {...filteredDisplayModes};

    this.setState({displayModes: displayModesArray});


    let filteredNodes = {};
    for(let nid in this.props.screenProps.nodes) {
      if(this.props.screenProps.nodes[nid].type === type) {
        filteredNodes[nid] = this.props.screenProps.nodes[nid];
      }
    }
    this.setState({'nodes': filteredNodes});

    if(typeof this.props.screenProps.viewableTypes[type] !== 'undefined' && this.props.screenProps.viewableTypes[type]['valid type for personal collection'] === 1) {
      this.setState({'personalCollectionValid': true});
    }


  }

  setTaxonomy = (array) => {
    let termList = {};
    for (var i = 0; i < array.length; i++) {
      termList[array[i].tid] = JSON.parse(array[i].entity)
    }
    this.setState({terms: termList});
  }


  setNodes = (array) => {
    let nodeList = {};
    for (var i = 0; i < array.length; i++) {
      nodeList[array[i].nid] = JSON.parse(array[i].entity)
    }
    this.setState({nodes: nodeList});
  }



  render() {


    if (!this.state.displayModes) {
      return [];
    }
    const node = this.props.navigation.getParam('node');

    let showStar = false;
    if (this.state.personalCollectionValid === true) {
      showStar = true;
    } else {
      showStar = false;
    }


    let renderedNode = [];

    this.state.displayModes.forEach( (elem) => {
      let fieldName = elem[0];
      let fieldObject = elem[1];


      if (typeof node[fieldName] === 'undefined' || node[fieldName].length === 0) {
        return;
      }
      const lang = Object.keys(node[fieldName])[0];
      // Hide title on scald fields per request
      if (fieldObject.label && fieldObject.view_mode_properties.label !== 'hidden' && fieldObject.view_mode_properties.type !== 'ma_colorbox') {
        renderedNode.push(
          <Text key={fieldName} style={styles.label}>{fieldObject.label}</Text>
        )
      }
      let type = fieldObject.view_mode_properties.type;

      if (fieldObject.view_mode_properties.type === 'taxonomy_term_reference_link') {
        const isObject = Object.prototype.toString.call(node[fieldName]) === '[object Object]';
        if (isObject) {
          let fieldData = '';
          let errorMessage = '';
          let oneExists = false;
          if (!this.props.screenProps.terms) {
            errorMessage =
              <Text style={styles.syncError}>In order to view the content in this field, in your browser sync this
                item to Mukurtu Mobile.</Text>
          } else if (typeof node[fieldName][lang] !== 'undefined') {
            for (var i = 0; i < node[fieldName][lang].length; i++) {
              let tid = node[fieldName][lang][i].tid;
              if (!tid || tid === undefined) {
                errorMessage =
                  <Text style={styles.syncError}>In order to view the content in this field, in your browser sync this
                    item to Mukurtu Mobile.</Text>
              } else {
                oneExists = true;
                if (i > 0) {
                  fieldData += ', ';
                }
                if (typeof this.props.screenProps.terms[tid] !== 'undefined') {
                  fieldData += this.props.screenProps.terms[tid].name;
                } else {
                  // This is a catch in case the term isn't synced.
                  // let term = <Term
                  //   tid={tid}
                  //   token={this.props.screenProps.token}
                  //   cookie={this.props.screenProps.cookie}
                  //   url={this.props.screenProps.url}
                  //   key={tid}
                  //   terms={this.props.screenProps.terms}
                  // />;
                  // renderedNode.push(term);
                }
              }
            }
            if (oneExists) {
              errorMessage =
                <Text style={styles.syncError}>In order to view all of the content in this field, in your browser sync
                  this item to Mukurtu Mobile.</Text>
            }
          }

          renderedNode.push(<Text key={fieldName + i} style={styles.text}>{fieldData}</Text>)
        }
      }
      if (fieldObject.view_mode_properties.type === 'text_default') {
        let tagsStyles = { p: { marginTop: 0 }};
        const isObject = Object.prototype.toString.call(node[fieldName]) === '[object Object]';
        if (isObject) {
          for (var i = 0; i < node[fieldName][lang].length; i++) {
            renderedNode.push(<HTML tagsStyles={tagsStyles}  key={fieldName + i} html={node[fieldName][lang][i].safe_value}
                                    imagesMaxWidth={Dimensions.get('window').width}/>)
          }
        }
      }
      if (fieldObject.view_mode_properties.type === 'license_formatter') {
        const isObject = Object.prototype.toString.call(node[fieldName]) === '[object Object]';
        if (isObject) {
          for (var i = 0; i < node[fieldName][lang].length; i++) {
            renderedNode.push(<Text key={fieldName + i}>{node[fieldName][lang][0].value}</Text>)
          }
        }
      }

      if (fieldObject.view_mode_properties.type === 'geofield_map_map') {
        const isObject = Object.prototype.toString.call(node[fieldName]) === '[object Object]';
        if (isObject) {
          for (var i = 0; i < node[fieldName][lang].length; i++) {
            if (node[fieldName][lang][i].lat.length > 0) {
              const latLng = {
                latitude: Number(node[fieldName][lang][i].lat),
                longitude: Number(node[fieldName][lang][i].lon),
              };
              renderedNode.push(<MapView style={styles.map} key={fieldName + i}
                                         initialRegion={{
                                           latitude: Number(node[fieldName][lang][i].lat),
                                           longitude: Number(node[fieldName][lang][i].lon),
                                           latitudeDelta: 0.0922,
                                           longitudeDelta: 0.0421,
                                         }}
              >
                <Marker
                  coordinate={latLng}
                />
              </MapView>)
            }
          }
        }
      }
      if (fieldObject.view_mode_properties.type === 'ma_colorbox') {
        // Scald item
        let items = node[fieldName][lang];
        for (i = 0; i < items.length; i++) {

          let sid = items[i].sid;
          renderedNode.push(
            <ScaldItem
              token={this.props.screenProps.token}
              cookie={this.props.screenProps.cookie}
              url={this.props.screenProps.siteUrl}
              sid={sid}
              db={this.props.screenProps.db}
              key={sid}
              documentDirectory={this.props.screenProps.documentDirectory}
            />
          );
          // Current request is to just show one of these
          break;
        }
      }

      if (fieldObject.view_mode_properties.type === 'entityreference_entity_view') {

        let items = node[fieldName][lang];
        for (i = 0; i < items.length; i++) {
          let nid = items[i].target_id;
          renderedNode.push(
            <EmbeddedNode
              nid={nid}
              fieldName={fieldName}
              fieldObject={fieldObject}
              displayModes={this.state.displayModes}
              nodes={this.props.screenProps.nodes}
              terms={this.props.screenProps.terms}
              contentType={this.props.navigation.getParam('contentType')}
              screenProps={this.props.screenProps}
            />
          );
        }
      }

      if (fieldObject.view_mode_properties.type === 'paragraphs_view') {
        let items = node[fieldName][lang];
        for (i = 0; i < items.length; i++) {
          let pid = items[i].value;
          renderedNode.push(
            <ParagraphView
              paragraphData={this.props.screenProps.paragraphData}
              token={this.props.screenProps.token}
              cookie={this.props.screenProps.cookie}
              url={this.props.screenProps.siteUrl}
              pid={pid}
              viewableFields={this.props.screenProps.displayModes}
              fieldName={fieldName}
              nodes={this.props.screenProps.nodes}
              terms={this.props.screenProps.terms}
              key={i}
              contentType={this.props.navigation.getParam('contentType')}
            />
          );
        }
      }

      /*      if (fieldObject.view_mode_properties.type === 'ma_colorbox') {
              const nodeArray = node[fieldName][lang];
              for (var i = 0; i < nodeArray.length; i++) {
                const sid = nodeArray[i].sid;
                this.props.screenProps.db.transaction(
                  tx => {
                    tx.executeSql('select * from atom where sid = ?',
                      [sid],
                      (success, atoms) => {
                        const atom = atoms.rows._array[0];
                        renderedNode.push(<Text>atom.title</Text>);
                      },
                      (success, error) => ''
                    );
                  }
                );
              }
              const sid = node[fieldName][lang]
            }*/


      if (fieldObject.view_mode_properties.type === 'node_reference_default' || fieldObject.view_mode_properties.type === 'entityreference_label') {
        const isObject = Object.prototype.toString.call(node[fieldName]) === '[object Object]';
        if (isObject) {
          let fieldData = '';
          let errorMessage = '';
          let oneExists = false;
          if (!this.props.screenProps.nodes) {
            errorMessage =
              <Text style={styles.syncError}>In order to view the content in this field, in your browser sync this
                item to Mukurtu Mobile.</Text>
          } else {
            renderedNode.push(
              <Text>Collection only displays synced nodes; unsynced nodes will not display in collection even if they're in the collection on the desktop site.</Text>
            );
            for (i = 0; i < node[fieldName][lang].length; i++) {
              let nid = node[fieldName][lang][i].nid;
              if (fieldObject.view_mode_properties.type === 'entityreference_label') {
                nid = node[fieldName][lang][i].target_id;
              }
              if (!nid || nid === undefined) {
                errorMessage =
                  <Text style={styles.syncError}>In order to view the content in this field, in your browser sync
                    this
                    item to Mukurtu Mobile.</Text>
              } else {
                oneExists = true;

                // Push the node teaser so that it links
                if (this.props.screenProps.nodes[nid]) {
                  renderedNode.push(
                    <NodeTeaser
                      key={i++}
                      node={this.props.screenProps.nodes[nid]}
                      viewableFields={this.state.viewableFields}
                      token={this.props.screenProps.token}
                      cookie={this.props.screenProps.cookie}
                      url={this.props.screenProps.siteUrl}
                      db={this.props.screenProps.db}
                      terms={this.props.screenProps.terms}
                      allNodes={this.props.screenProps.nodes}
                      navigation={this.props.navigation}
                      editable={false}
                    />
                  )
                }
              }
            }
            if (oneExists) {
              errorMessage =
                <Text style={styles.syncError}>In order to view all of the content in this field, in your browser
                  sync
                  this item to Mukurtu Mobile.</Text>
            }
          }
          // renderedNode.push(<Text key={fieldName + i} style={styles.text}>{fieldData}</Text>)
        }
      }

      if (fieldObject.view_mode_properties.type === 'partial_date_default') {
        const isObject = Object.prototype.toString.call(node[fieldName]) === '[object Object]';
        if (isObject) {
          for (i = 0; i < node[fieldName][lang].length; i++) {
            renderedNode.push(<Text
              key={fieldName + i}>{node[fieldName][lang][i].from.day}/{node[fieldName][lang][i].from.month}/{node[fieldName][lang][i].from.year}</Text>)
          }
        }
      }
    });

    let star = null;
    if (showStar) {
      {/*Pass nodes to star so we can filter out personal collection*/
      }
      star =
        <View  style={styles.star}>
        <Star

        starred={false}
        nid={node.nid}
        nodes={this.props.screenProps.nodes}
        db={this.props.screenProps.db}
        isConnected={this.props.screenProps.isConnected}
        token={this.props.screenProps.token}
        cookie={this.props.screenProps.cookie}
        url={this.props.screenProps.siteUrl}
      />
        </View>
    }


    return (<View style={{flex: 1}}>
      <ScrollView style={styles.container}>
        <Text>{this.state.media_text}</Text>
        {star}
        {renderedNode}

      </ScrollView>
      </View>
    );
  }
}

const
  styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#DCDCDC',
      padding: 10,
    },
    interior: {
      flexDirection: 'column'
    },
    label: {
      marginTop: 10,
      marginBottom: 5,
      color: '#000',
      fontSize: 24
    },
    text: {
      marginBottom: 10,
      color: '#000',
      fontSize: 16
    },
    map: {
      width: Dimensions.get('window').width - 20,
      height: 300,
      marginBottom: 10
    },
    syncError: {
      fontSize: 12
    },
    htmlField: {
      marginTop: 0,
      backgroundColor: '#fff'
    },


  });

export default NodeScreen;
