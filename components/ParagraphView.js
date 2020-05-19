import React from 'react';
import {Dimensions, Image, StyleSheet, Text, View, WebView} from 'react-native';
import HTML from "react-native-render-html";
import {ScaldItem} from "./ScaldItem";
import _ from 'lodash';

export class ParagraphView extends React.Component {


  componentDidMount() {

  }


  render() {

    let renderedItem = [];
    const {paragraphData, pid, viewableFields, contentType, fieldName, terms, nodes} = this.props;
    const thisParagraphData = _.get(paragraphData, pid);
    const thisParagraphFields = _.get(viewableFields, [contentType, fieldName, 'fields']);
    // First check for text value
    if (thisParagraphData !== undefined && thisParagraphFields !== undefined) {
      for (let [key, value] of Object.entries(thisParagraphFields)) {
        const fieldKeys = Object.keys(_.get(thisParagraphData, [key, 'und', 0], []));

        // Text values
        if (fieldKeys.includes('value')) {
          let tagsStyles = {p: {marginTop: 0}};
          let textLines = [];
          thisParagraphData[key]['und'].forEach((line, index) => {
            textLines.push(<HTML
              tagsStyles={tagsStyles}
              key={`${key}-${index}`}
              html={line.value}
              imagesMaxWidth={Dimensions.get('window').width}
            />);
          });
          renderedItem.push(
            <View key={`text-${key}`}>
              <Text style={styles.titleTextStyle}>{value.label}</Text>
              {textLines}
            </View>
          )
        }

          // Taxonomy term
        // else if (t(paragraphData[pid][key]['und']['0']['tid']).isDefined) {
        else if (fieldKeys.includes('tid')) {
          for (let i = 0; i < thisParagraphData[key]['und'].length; i++) {

            let tid = thisParagraphData[key]['und'][i]['tid'];
            if (terms[tid]) {
              let termTitle = terms[tid].name;
              renderedItem.push(
                <View key={`term-ref-${i}`}>
                  <Text style={styles.titleTextStyle}>{value.label}</Text>
                  <Text>{termTitle}</Text>
                </View>
              )
            }
            else {
              renderedItem.push(
                <View key={`term-ref-${i}`}>
                  <Text style={styles.titleTextStyle}>{value.label}</Text>
                  <Text>Term not synced to this device</Text>
                </View>
              );
            }
          }
        }
          // Scald Item
        // else if (t(paragraphData[pid][key]['und']['0']['sid']).isDefined) {
        else if (fieldKeys.includes('sid')) {
          for (let i = 0; i < thisParagraphData[key]['und'].length; i++) {
            let sid = thisParagraphData[key]['und'][i]['sid'];
            renderedItem.push(
              <ScaldItem
                token={this.props.token}
                cookie={this.props.cookie}
                url={this.props.siteUrl}
                sid={sid}
                db={this.props.db}
                key={sid}
                documentDirectory={this.props.documentDirectory}
              />
            )
          }

        }
          // Node reference
        // else if
        // (t(paragraphData[pid][key]['und']['0']['target_id']).isDefined) {
        else if (fieldKeys.includes('target_id')) {
          for (let i = 0; i < thisParagraphData[key]['und'].length; i++) {
            let nid = thisParagraphData[key]['und'][i]['target_id'];

            if (nodes[nid] !== undefined) {
              let nodeTitle = nodes[nid].title;
              renderedItem.push(
                <View key={`node-ref-${i}`}>
                  <Text style={styles.titleTextStyle}>{value.label}</Text>
                  <Text>{nodeTitle}</Text>
                </View>
              );
            }
            else {
              renderedItem.push(
                <View key={`node-ref-${i}`}>
                  <Text style={styles.titleTextStyle}>{value.label}</Text>
                  <Text>Content not synced to this device</Text>
                </View>);
            }
          }
        }
      }
      // }
    }

    return (
      <View style={styles.pStyle}>
        {renderedItem}
      </View>
    )

  }
}

const styles = StyleSheet.create({
  titleTextStyle: {
    marginTop: 10,
    marginBottom: 5,
    color: '#000',
    fontSize: 20
  },
  pStyle: {
    paddingLeft: 10
  }
});


