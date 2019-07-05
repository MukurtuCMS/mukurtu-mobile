import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Dimensions
} from 'react-native';
import {SQLite} from 'expo-sqlite';
import MapView from "react-native-maps";
import {Marker} from "react-native-maps";
import HTML from 'react-native-render-html';


// create a global db for database list and last known user
const globalDB = SQLite.openDatabase('global');

class NodeScreen extends React.Component {
  static navigationOptions = ({ navigation }) => ({
    title: `${navigation.getParam('node').title}`,
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
      terms: null,
      nodes: null
    }
  }

  componentDidMount() {
    const type = this.props.navigation.getParam('contentType');
    this.state.db.transaction(tx => {
      tx.executeSql(
        'select node_view from display_modes where machine_name = ?;',
        [type],
        (query, result) => this.setState({displayModes: JSON.parse(result.rows._array[0].node_view)})
      );
    });
    this.state.db.transaction(tx => {
      tx.executeSql(
        'select * from taxonomy;',
        '',
        (query, result) => this.setTaxonomy(result.rows._array)
      );
    });
    this.state.db.transaction(tx => {
      tx.executeSql(
        'select * from nodes;',
        '',
        (query, result) => this.setNodes(result.rows._array)
      );
    });
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

    let renderedNode = [];

    for (const [fieldName, fieldObject] of Object.entries(this.state.displayModes)) {
      const lang = Object.keys(node[fieldName])[0];
      if (fieldObject.label && fieldObject.view_mode_properties.label !== 'hidden') {
        renderedNode.push(
          <Text key={fieldName} style={styles.label}>{fieldObject.label}</Text>
        )
      }
      if (fieldObject.view_mode_properties.type === 'taxonomy_term_reference_link') {
        const isObject = Object.prototype.toString.call(node[fieldName]) === '[object Object]';
        if (isObject) {
          let fieldData = [];
          let errorMessage = [];
          let oneExists = false;
          if (!this.state.terms) {
            errorMessage = <Text style={styles.syncError}>In order to view the content in this field, in your browser sync this item to Mukurtu Mobile.</Text>
          } else {
            for (var i = 0; i < node[fieldName][lang].length; i++) {
              let tid = node[fieldName][lang][i].tid;
              if (!tid || tid === undefined) {
                errorMessage = <Text style={styles.syncError}>In order to view the content in this field, in your browser sync this item to Mukurtu Mobile.</Text>
              } else {
                oneExists = true;
                if (i > 0) {
                  fieldData += ', ';
                }
                if (this.state.terms[tid]) {
                  fieldData += this.state.terms[tid].name;
                }
              }
            }
            if (oneExists) {
              errorMessage = <Text style={styles.syncError}>In order to view all of the content in this field, in your browser sync this item to Mukurtu Mobile.</Text>
            }
          }
          renderedNode.push(<Text key={fieldName + i} style={styles.text}>{fieldData}</Text>)
        }
      }
      if (fieldObject.view_mode_properties.type === 'text_default') {
        const isObject = Object.prototype.toString.call(node[fieldName]) === '[object Object]';
        if (isObject) {
          for (var i = 0; i < node[fieldName][lang].length; i++) {
            renderedNode.push(<HTML key={fieldName + i} html={node[fieldName][lang][i].safe_value} imagesMaxWidth={Dimensions.get('window').width} />)
          }
        }
      }
      if (fieldObject.view_mode_properties.type === 'geofield_map_map') {
        console.log(node[fieldName]);
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
      if (fieldObject.view_mode_properties.type === 'node_reference_default' || fieldObject.view_mode_properties.type === 'entityreference_label') {
        const isObject = Object.prototype.toString.call(node[fieldName]) === '[object Object]';
        if (isObject) {
          let fieldData = [];
          let errorMessage = [];
          let oneExists = false;
          if (!this.state.nodes) {
            errorMessage = <Text style={styles.syncError}>In order to view the content in this field, in your browser sync this item to Mukurtu Mobile.</Text>
          } else {
            for (var i = 0; i < node[fieldName][lang].length; i++) {
              let nid = node[fieldName][lang][i].nid;
              if (fieldObject.view_mode_properties.type === 'entityreference_label') {
                nid = node[fieldName][lang][i].target_id;
              }
              if (!nid || nid === undefined) {
                errorMessage = <Text style={styles.syncError}>In order to view the content in this field, in your browser sync this item to Mukurtu Mobile.</Text>
              } else {
                oneExists = true;
                if (i > 0) {
                  fieldData += ', ';
                }
                if (this.state.nodes[nid]) {
                  fieldData += this.state.nodes[nid].title;
                }
              }
            }
            if (oneExists) {
              errorMessage = <Text style={styles.syncError}>In order to view all of the content in this field, in your browser sync this item to Mukurtu Mobile.</Text>
            }
          }
          renderedNode.push(<Text key={fieldName + i} style={styles.text}>{fieldData}</Text>)
        }
      }

      if (fieldObject.view_mode_properties.type === 'partial_date_default') {
        const isObject = Object.prototype.toString.call(node[fieldName]) === '[object Object]';
        if (isObject) {
          for (var i = 0; i < node[fieldName][lang].length; i++) {
            renderedNode.push(<Text key={fieldName + i}>{node[fieldName][lang][i].from.day}/{node[fieldName][lang][i].from.month}/{node[fieldName][lang][i].from.year}</Text>)
          }
        }
      }
    }

    return (
        <ScrollView style={styles.container}>
          {renderedNode}
        </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DCDCDC',
  },
  label: {
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
    marginLeft: 10,
    marginBottom: 10
  },
  syncError: {
    fontSize: 12
  }
});

export default NodeScreen;