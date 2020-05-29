import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Dimensions, TouchableHighlight, TouchableOpacity,
} from 'react-native';
import {Feather} from '@expo/vector-icons';
import * as SQLite from 'expo-sqlite';
import MapView from "react-native-maps";
import {Marker} from "react-native-maps";
import HTML from 'react-native-render-html';
import {Star} from "../components/Star";
import {ScaldItem} from "../components/ScaldItem";
import {ParagraphView} from "../components/ParagraphView";
import {EmbeddedNode} from "../components/EmbeddedNode";
import NodeTeaser from "../components/Displays/nodeTeaser";
import {ScaldSwipe} from '../components/ScaldSwipe';
import {FieldCollection} from "../components/FieldCollection";
import _ from 'lodash';
import {NavigationActions} from "react-navigation";
import UnlockOrientation from "../components/UnlockOrientation";
import Colors from "../constants/Colors";

class NodeScreen extends React.Component {
  static navigationOptions = ({navigation}) => {
    return {
      title: `${navigation.getParam('node').title}`,
      headerRight: () => {
        const canEdit = navigation.getParam('canEdit');
        if (canEdit !== undefined && canEdit) {
          return (<Feather style={{marginRight: 10}} onPress={() => {
            const navNode = navigation.getParam('node');
            const navigateAction = NavigationActions.navigate({
              routeName: 'EditContentForm',
              params: {
                contentType: navNode.type,
                contentTypeLabel: navNode.title,
                node: navNode,
                editWord: 'Edit',
              },
              key: `node-edit-${navNode.nid}`
            });
            navigation.dispatch(navigateAction);
          }} name="edit" size={24} color="#000"/>)
        }
        else {
          return null;
        }
      }
    }
  };

  constructor(props) {
    super(props);
    // Pass props down from App.js, since we're not using Redux
    this.state = {
      displayModes: false,
      thisNode: null,
      personalCollectionValid: false
    }
  }

  componentDidMount() {
    this.loadNode();
  }

  componentDidUpdate(prevProps) {
    const {refreshing} = this.props.screenProps;
    if (prevProps.screenProps.refreshing && !refreshing) {
      this.loadNode();
    }
  }

  loadNode = () => {
    const {navigation, screenProps} = this.props;
    const type = navigation.getParam('contentType');
    const node = navigation.getParam('node');


    const editableContentTypes = screenProps.contentTypes !== undefined ? Object.keys(screenProps.contentTypes) : [];
    if(editableContentTypes.indexOf(node.type) > -1 && (screenProps.editable[node.nid] === true || screenProps.editable[node.nid] == '1')) {
      navigation.setParams({
        canEdit: true
      });
    }

    this.props.screenProps.db.transaction(tx => {
      tx.executeSql('select * from nodes WHERE nid = ?', [node.nid],
        (success, array) => {
          const entity = _.get(array, ['rows', '_array', 0], null);
          if (entity != null) {
            const thisNode = JSON.parse(entity.entity);

            // Filter display modes by weight
            const displayModes = this.props.screenProps.displayModes[type];

            let displayModesArray = Object.keys(displayModes).map(function (key) {
              return [key, displayModes[key]];
            });
            displayModesArray.sort((a, b) => {
              return a['weight'] - b['weight'];
            });

            let personalCollectionValid = false;
            if (typeof this.props.screenProps.viewableTypes[type] !== 'undefined' && this.props.screenProps.viewableTypes[type]['valid type for personal collection'] === 1) {
              personalCollectionValid = true;
            }

            this.setState({
              'thisNode': thisNode,
              'displayModes': displayModesArray,
              'personalCollectionValid': personalCollectionValid
            })
          }
        }
      )
    });
  }

  showCategory = (field, tid) => {
    console.log('IN HERE')
    const navigateAction = NavigationActions.navigate({
      routeName: 'Category',
      params: {
        tid: tid,
        field: field,
        type: this.state.thisNode.type,
        exclude: [this.state.thisNode.nid],
      },
      key: `term-${tid}`
    });
    this.props.navigation.dispatch(navigateAction);
  }

  render() {
    const emptyView = (
      <View style={{flex: 1}}>
        <ScrollView style={styles.container}>
          <Text key={`empty`} style={styles.text}>There is no content attached
            to this entry.</Text>
        </ScrollView>
      </View>
    );

    const loadingView = (
      <View style={{flex: 1}}>
        <ScrollView style={styles.container}>
          <Text key={`empty`} style={styles.text}>Loading content...</Text>
        </ScrollView>
      </View>
    );

    if (this.state.thisNode === null) {
      return loadingView;
    }


    if (!this.state.displayModes) {
      return emptyView;
    }
    // const node = this.props.navigation.getParam('node');
    const node = this.state.thisNode;

    let showStar = false;
    if (this.state.personalCollectionValid === true) {
      showStar = true;
    } else {
      showStar = false;
    }


    let renderedNode = [];

    const relatedContent = _.get(node, ['field_related_content', 'und'], []);

    this.state.displayModes.forEach((elem, index) => {
      let fieldName = elem[0];
      let fieldObject = elem[1];


      let extractedField = fieldName.includes('extracted_') && relatedContent.length > 0;
      // Extract out of related content field
      if (extractedField) {
        const {nodes} = this.props.screenProps;
        let relatedNodes = [];
        relatedContent.forEach((rc) => {
          if (nodes[rc.target_id] !== undefined && nodes[rc.target_id].type == fieldObject.extracted_type) {
            relatedNodes.push(
              <NodeTeaser
                key={`${fieldName}_teaser_${rc.target_id}`}
                node={this.props.screenProps.nodes[rc.target_id]}
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
            );
          }
        });

        if (relatedNodes.length > 0) {
          renderedNode.push(<View key={`${fieldName}_container`}>
            <Text key={`${fieldName}_label`} style={styles.label}>{fieldObject.label}</Text>
            {relatedNodes}
          </View>);
        }

        return;
      }

      if (typeof node[fieldName] === 'undefined' || node[fieldName].length === 0) {
        return;
      }
      const lang = Object.keys(node[fieldName])[0];
      // Hide title on scald fields per request
      if (fieldObject.label && fieldObject.view_mode_properties.label !== 'hidden' && fieldObject.view_mode_properties.type !== 'ma_colorbox') {
        renderedNode.push(
          <Text key={`${fieldName}_label`} style={styles.label}>{fieldObject.label}</Text>
        )
      }
      // let type = fieldObject.view_mode_properties.type;

      if (fieldObject.view_mode_properties.type === 'taxonomy_term_reference_link' ||
        fieldObject.view_mode_properties.type === 'textformatter_list') {
        const isObject = Object.prototype.toString.call(node[fieldName]) === '[object Object]';
        if (isObject) {
          let fieldData = [];
          let errorMessage = '';
          let oneExists = false;
          if (!this.props.screenProps.terms) {
            errorMessage =
              <Text style={styles.syncError}>In order to view the content in this field, in your browser sync this
                item to Mukurtu Mobile.</Text>
          }
          else if (typeof node[fieldName][lang] !== 'undefined') {
            for (let i = 0; i < node[fieldName][lang].length; i++) {
              let tid = node[fieldName][lang][i].tid;
              if (!tid || tid === undefined) {
                errorMessage =
                  <Text style={styles.syncError}>In order to view the content in this field, in your browser sync this
                    item to Mukurtu Mobile.</Text>
              } else {
                oneExists = true;
                // if (i > 0) {
                //   fieldData.push() += ', ';
                // }
                if (typeof this.props.screenProps.terms[tid] !== 'undefined') {
                  // fieldData += this.props.screenProps.terms[tid].name;
                  fieldData.push(
                    <TouchableOpacity key={tid} onPress={() => this.showCategory(fieldName, tid)}>
                      <Text style={styles.termLink}>{this.props.screenProps.terms[tid].name}</Text>
                    </TouchableOpacity>);
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

          renderedNode.push(<View key={`${fieldName}_term_ref_${index}`} style={styles.text}>{fieldData}</View>)
        }
      }

      if (fieldObject.view_mode_properties.type === 'text_default') {
        let tagsStyles = {p: {marginTop: 0}};
        const isObject = Object.prototype.toString.call(node[fieldName]) === '[object Object]';
        if (isObject) {
          for (let i = 0; i < node[fieldName][lang].length; i++) {
            renderedNode.push(<HTML
              tagsStyles={tagsStyles} key={`${fieldName}_html_${i}`}
              html={node[fieldName][lang][i].safe_value}
              imagesMaxWidth={Dimensions.get('window').width}/>)
          }
        }
      }

      if (fieldObject.view_mode_properties.type === 'license_formatter') {
        const isObject = Object.prototype.toString.call(node[fieldName]) === '[object Object]';
        if (isObject) {
          for (let i = 0; i < node[fieldName][lang].length; i++) {
            renderedNode.push(<Text key={`${fieldName}_license_${i}`}>{node[fieldName][lang][0].value}</Text>)
          }
        }
      }

      if (fieldObject.view_mode_properties.type === 'geofield_map_map') {
        const isObject = Object.prototype.toString.call(node[fieldName]) === '[object Object]';
        if (isObject) {
          for (let i = 0; i < node[fieldName][lang].length; i++) {
            if (node[fieldName][lang][i].lat.length > 0) {
              const latLng = {
                latitude: Number(node[fieldName][lang][i].lat),
                longitude: Number(node[fieldName][lang][i].lon),
              };
              renderedNode.push(<MapView
                style={styles.map} key={`${fieldName}_geo_${i}`}
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
        if (items.length > 1) {
          renderedNode.push(<ScaldSwipe
            items={items}
            token={this.props.screenProps.token}
            cookie={this.props.screenProps.cookie}
            url={this.props.screenProps.siteUrl}
            db={this.props.screenProps.db}
            key={`scald-swipe-${fieldName}`}
            documentDirectory={this.props.screenProps.documentDirectory}
          />)
        }
        else if (items.length === 1) {
          let sid = items[0].sid;
          renderedNode.push(<ScaldItem
            token={this.props.screenProps.token}
            cookie={this.props.screenProps.cookie}
            url={this.props.screenProps.siteUrl}
            sid={sid}
            db={this.props.screenProps.db}
            key={sid}
            documentDirectory={this.props.screenProps.documentDirectory}
          />)
        }
      }

      if (fieldObject.view_mode_properties.type === 'entityreference_entity_view') {

        let items = node[fieldName][lang];
        for (let i = 0; i < items.length; i++) {
          let nid = items[i].target_id;
          renderedNode.push(
            <EmbeddedNode
              key={`${fieldName}_embedded_node_${i}`}
              nid={nid}
              fieldName={fieldName}
              fieldObject={fieldObject}
              displayModes={this.state.displayModes}
              nodes={this.props.screenProps.nodes}
              terms={this.props.screenProps.terms}
              contentType={this.props.navigation.getParam('contentType')}
              screenProps={this.props.screenProps}
              navigation={this.props.navigation}
            />
          );
        }
      }

      if (fieldObject.view_mode_properties.type === 'paragraphs_view') {
        let items = JSON.parse(JSON.stringify(node[fieldName][lang]));
        // items can include an entry for each revision, which we need to filter out, keeping the most recent revision
        // (I have a suspicion this could be simplified.)
        // first, create array of unique values
        let uniqueVals = items.map((item) => {
          return item.value;
        });
        uniqueVals = Array.from(new Set(uniqueVals));

        // Now, for each unique value, get the key of the highest revision ID
        let sortableArray = uniqueVals.map((val) => {
          return items.filter((item) => {
            return item.value === val;
          })
        });

        // Now for each array within the sortable array, we need to get the highest revision ID
        // Right now this probably doesn't matter but we need to sort by something
        let keeperRevisionIds = sortableArray.map((subarray) => {
          let revisionIds = subarray.map((item) => {
            return item.revision_id;
          });
          // Get highest revision ID
          return revisionIds.reduce(function(a, b) {
            return Math.max(a, b);
          });
        });

        // Now we filter our original array by keeper revision IDs
        // let uniqueItems = items.filter(item => keeperRevisionIds.indexOf(parseInt(item.revision_id, 10)) !== -1);
        let uniqueItems = items.filter(item => keeperRevisionIds.includes(item.revision_id));


        for (let i = 0; i < uniqueItems.length; i++) {
          let pid = uniqueItems[i].value;
          renderedNode.push(
            <ParagraphView
              paragraphData={this.props.screenProps.paragraphData}
              token={this.props.screenProps.token}
              cookie={this.props.screenProps.cookie}
              url={this.props.screenProps.siteUrl}
              db={this.props.screenProps.db}
              pid={pid}
              viewableFields={this.props.screenProps.displayModes}
              fieldName={fieldName}
              nodes={this.props.screenProps.nodes}
              terms={this.props.screenProps.terms}
              key={`${fieldName}_paragraph_${i}`}
              contentType={this.props.navigation.getParam('contentType')}
              documentDirectory={this.props.screenProps.documentDirectory}
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


      if (fieldObject.view_mode_properties.type === 'node_reference_default' ||
        fieldObject.view_mode_properties.type === 'entityreference_label') {
        const isObject = Object.prototype.toString.call(node[fieldName]) === '[object Object]';
        if (isObject) {
          let errorMessage = '';
          let oneExists = false;
          if (!this.props.screenProps.nodes) {
            errorMessage =
              <Text style={styles.syncError}>In order to view the content in this field, in your browser sync this
                item to Mukurtu Mobile.</Text>
          } else {
            renderedNode.push(
              <Text key={`${fieldName}_notice`}>Collection only displays synced content; unsynced content will not be display in collection even if they are
                in the collection on the desktop site.</Text>
            );
            for (let i = 0; i < node[fieldName][lang].length; i++) {
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
                      key={`${fieldName}_teaser_${i}`}
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
          for (let i = 0; i < node[fieldName][lang].length; i++) {
            renderedNode.push(<Text
              key={`${fieldName}_date_${i}`}>{node[fieldName][lang][i].from.day}/{node[fieldName][lang][i].from.month}/{node[fieldName][lang][i].from.year}</Text>)
          }
        }
      }

      if(fieldObject.view_mode_properties.type === 'date_default') {

        if (node[fieldName] != null && node[fieldName][lang]) {
          for(let [k, v] of Object.entries(node[fieldName][lang])) {

            if (v.hasOwnProperty('value') && v.value != null) {

              let dateValue;
              if (typeof v.value === "string") {
                dateValue = new Date(v.value.replace(' ', 'T'));
              }
              else {
                dateValue = new Date(v.value.date)
              }

              renderedNode.push(
                <Text key={`${fieldName}_date_${k}`}>{dateValue.toLocaleDateString()}</Text>
              );
            }
          }
        }
      }

      if(fieldObject.view_mode_properties.type === 'field_collection_view') {
        if (node[fieldName] != null && node[fieldName][lang]) {
          for (let i = 0; i < node[fieldName][lang].length; i++) {
            renderedNode.push(
              <FieldCollection
                key={`${fieldName}_fc_${i}`}
                fid={node[fieldName][lang][i]['value']}
                screenProps={this.props.screenProps}
              />);
          }
        }
      }

    });

    let star = null;
    if (showStar) {
      {/*Pass nodes to star so we can filter out personal collection*/
      }
      star =
        <View style={styles.star}>
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


    return renderedNode.length > 0 ? (
      <View style={{flex: 1}}>
        <UnlockOrientation />
        <ScrollView style={styles.container}>
          {/*<Text>{this.state.media_text}</Text>*/}
          {star}
          {renderedNode}

        </ScrollView>
      </View>
    ) : emptyView;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#dcdcdc',
    padding: 10,
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
  termLink: {
    color: Colors.primary
  }
});

export default NodeScreen;
