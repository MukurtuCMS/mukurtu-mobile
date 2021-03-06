import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import MapView, {Marker} from "react-native-maps";
import {FieldCollection} from "./FieldCollection";
import Colors from "../constants/Colors";
import NodeTeaser from "./Displays/nodeTeaser";
import MicroTask from "./MicroTask";
import TextArea from "./TextArea";

export class EmbeddedNode extends React.Component {


  // There is a lot of redundancy between this and NodeScreen.js,
  // but basically this is a way to render embedded nodes and their fields.
  // Ultimately we'll want to abstract all the common stuff from this and NodeScreen, but didn't want to break that right now.
  componentDidMount() {

  }


  render() {

    if (!this.props.displayModes) {
      return [];
    }
    if(!this.props.nodes[this.props.nid]) {
      return  <Text style={styles.syncError}>In order to view the content in this field, in your browser sync this
        item to Mukurtu Mobile.</Text>;
    }
    const node = this.props.nodes[this.props.nid];



    let renderedNode = [];

    const embeddedFields = ((this.props.displayModes[0] || [])[1] || {}).fields || {};


    for (const [fieldName, fieldObject] of Object.entries(embeddedFields)) {
      if (typeof node[fieldName] === 'undefined' || node[fieldName].length === 0) {
        continue;
      }
      const lang = Object.keys(node[fieldName])[0];
      if (fieldObject.label && fieldObject.view_mode_properties.label !== 'hidden') {
        renderedNode.push(
          <Text key={fieldName} style={styles.label}>{fieldObject.label}</Text>
        )
      }

      if (fieldObject.view_mode_properties.type === 'taxonomy_term_reference_link') {
        const isObject = Object.prototype.toString.call(node[fieldName]) === '[object Object]';
        if (isObject) {
          let fieldData = '';
          let errorMessage = '';
          let oneExists = false;
          if (!this.props.terms) {
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
                if (typeof this.props.terms[tid] !== 'undefined') {
                  fieldData += this.props.terms[tid].name;
                } else {
                  // This is a catch in case the term isn't synced.
                  // let term = <Term
                  //   tid={tid}
                  //   token={this.props.screenProps.token}
                  //   cookie={this.props.screenProps.cookie}
                  //   url={this.props.screenProps.url}
                  //   key={tid}
                  //   terms={this.props.terms}
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

      if (fieldObject.view_mode_properties.type === 'field_collection_view') {
        let tagsStyles = { p: { marginTop: 0 }};
        const isObject = Object.prototype.toString.call(node[fieldName]) === '[object Object]';
        if (isObject) {
          for (var i = 0; i < node[fieldName][lang].length; i++) {
            if (fieldName === 'field_lesson_micro_tasks') {
              renderedNode.push(<MicroTask
                key={fieldName + i}
                taskId={node[fieldName][lang][i]['value']}
                screenProps={this.props.screenProps}
                navigation={this.props.navigation}
              />)
            }
            else {
              renderedNode.push(<FieldCollection
                key={fieldName + i}
                fid={node[fieldName][lang][i]['value']}
                screenProps={this.props.screenProps}
              />)
            }
          }
        }
      }

      if (fieldObject.view_mode_properties.type === 'text_default') {
        const isObject = Object.prototype.toString.call(node[fieldName]) === '[object Object]';
        if (isObject) {
          for (var i = 0; i < node[fieldName][lang].length; i++) {
            renderedNode.push(<TextArea
              key={fieldName + i}
              terms={this.props.screenProps.terms}
              navigation={this.props.navigation}
              html={node[fieldName][lang][i].safe_value}
              nodes={this.props.screenProps.nodes}
            />)
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
              renderedNode.push(<MapView
                style={styles.map} key={fieldName + i}
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
        // let items = node[fieldName][lang];
        // for (i = 0; i < items.length; i++) {
        //
        //   let sid = items[i].sid;
        //   renderedNode.push(
        //     <ScaldItem
        //       token={this.props.screenProps.token}
        //       cookie={this.props.screenProps.cookie}
        //       url={this.props.screenProps.siteUrl}
        //       sid={sid}
        //       db={this.props.screenProps.db}
        //       key={sid}
        //     />
        //   );
        //
        // }
      }


      if (fieldObject.view_mode_properties.type === 'paragraphs_view') {
        // let items = node[fieldName][lang];
        // for (i = 0; i < items.length; i++) {
        //   let pid = items[i].value;
        //   renderedNode.push(
        //     <ParagraphView
        //       paragraphData={this.props.screenProps.paragraphData}
        //       pid={pid}
        //       viewableFields={this.props.screenProps.displayModes}
        //       fieldName={fieldName}
        //       nodes={this.props.nodes}
        //       terms={this.props.terms}
        //       key={i}
        //       contentType={this.props.navigation.getParam('contentType')}
        //     />
        //   );
        // }
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
          if (!this.props.nodes) {
            errorMessage =
              <Text style={styles.syncError}>In order to view the content in this field, in your browser sync this
                item to Mukurtu Mobile.</Text>
          } else {
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
                if (i > 0 && this.props.nodes[nid]) {
                  fieldData += ', ';
                }
                if (this.props.nodes[nid]) {
                  // fieldData += this.props.nodes[nid].title;
                  renderedNode.push(
                    <NodeTeaser
                      condensed={true}
                      key={`${fieldName}_teaser_${i}`}
                      node={this.props.screenProps.nodes[nid]}
                      token={this.props.screenProps.token}
                      cookie={this.props.screenProps.cookie}
                      url={this.props.screenProps.siteUrl}
                      db={this.props.screenProps.db}
                      terms={this.props.screenProps.terms}
                      allNodes={this.props.screenProps.nodes}
                      navigation={this.props.navigation}
                      editable={false}
                      editableContentTypes={this.props.screenProps.contentTypes}
                    />)
                }
              }
            }
          }
          if (errorMessage.length > 0) {
            renderedNode.push(<View key={fieldName}>{errorMessage}</View>)
            // errorMessage =
            //   <Text style={styles.syncError}>In order to view all of the content in this field, in your browser
            //     sync
            //     this item to Mukurtu Mobile.</Text>
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
    }

    if (renderedNode.length < 1) {
      renderedNode.push(<Text key={'empty-text'}>There is no content for this lesson.</Text>)
    }



    return (
      <View style={{flex: 1}}>
        <Text style={styles.nodeTitle}>{node.title}</Text>
        <View style={styles.container}>{renderedNode}</View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  nodeTitle: {
    marginBottom: 3,
    color: '#000',
    fontSize: 20
  },
  label: {
    marginTop: 6,
    marginBottom: 3,
    color: '#000',
    fontSize: 14,
    textTransform: 'uppercase'
  },
  container: {
    marginHorizontal: 10,
    marginBottom: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.mediumGray
  }
});


