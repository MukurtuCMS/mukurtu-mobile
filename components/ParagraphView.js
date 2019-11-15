import React from 'react';
import {Dimensions, Image, StyleSheet, Text, View, WebView} from 'react-native';
import HTML from "react-native-render-html";
import {ScaldItem} from "./ScaldItem";

export class ParagraphView extends React.Component {


  componentDidMount() {

  }


  render() {

    let renderedItem = [];
    // First check for text value
    console.log('outside top loop');
    if (this.props.paragraphData && this.props.paragraphData[this.props.pid] && this.props.viewableFields && typeof this.props.viewableFields[this.props.contentType][this.props.fieldName] !== 'undefined') {
      for (let [key, value] of Object.entries(this.props.viewableFields[this.props.contentType][this.props.fieldName]['fields'])) {
        console.log('top loop key');
        console.log(key);
        if (this.props.paragraphData[this.props.pid][key]) {
          if (typeof this.props.paragraphData[this.props.pid][key] !== 'undefined' &&
              typeof this.props.paragraphData[this.props.pid][key]['und'] !== 'undefined' &&
              typeof this.props.paragraphData[this.props.pid][key]['und']['0']['value'] !== 'undefined'
          ) {
            let tagsStyles = { p: { marginTop: 0 }};
            renderedItem.push(
                <View key={key}>
                  <Text style={styles.titleTextStyle}>{value.label}</Text>
                  <HTML tagsStyles={tagsStyles}  key={key} html={this.props.paragraphData[this.props.pid][key]['und']['0']['value']}
                        imagesMaxWidth={Dimensions.get('window').width}/>
                </View>
            )
          }
          // Taxonomy term
          else if (typeof this.props.paragraphData[this.props.pid][key] !== 'undefined' &&
              typeof this.props.paragraphData[this.props.pid][key]['und'] !== 'undefined' &&
              typeof this.props.paragraphData[this.props.pid][key]['und']['0']['tid'] !== 'undefined'
          ) {
            for (let i = 0; i < this.props.paragraphData[this.props.pid][key]['und'].length; i++) {

              let tid = this.props.paragraphData[this.props.pid][key]['und'][i]['tid'];
              if (this.props.terms[tid]) {
                let termTitle = this.props.terms[tid].name;
                renderedItem.push(
                    <View key={i}>
                      <Text style={styles.titleTextStyle}>{value.label}</Text>
                      <Text>{termTitle}</Text>
                    </View>
                )
              }
            }

          }
          // Scald Item
          else if (typeof this.props.paragraphData[this.props.pid][key] !== 'undefined' &&
            typeof this.props.paragraphData[this.props.pid][key]['und'] !== 'undefined' &&
            typeof this.props.paragraphData[this.props.pid][key]['und']['0']['sid'] !== 'undefined'
          ) {
            console.log('loop');
            for (let i = 0; i < this.props.paragraphData[this.props.pid][key]['und'].length; i++) {

              console.log('scald');
              console.log(i);
              let sid = this.props.paragraphData[this.props.pid][key]['und'][i]['sid'];
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
          else if (typeof this.props.paragraphData[this.props.pid][key] !== 'undefined' &&
              typeof this.props.paragraphData[this.props.pid][key]['und'] !== 'undefined' &&
              typeof this.props.paragraphData[this.props.pid][key]['und']['0']['target_id'] !== 'undefined'
          ) {
            for (let i = 0; i < this.props.paragraphData[this.props.pid][key]['und'].length; i++) {
              let nid = this.props.paragraphData[this.props.pid][key]['und'][i]['target_id'];
              if(this.props.paragraphData.nodeTitles[nid]) {
                let nodeTitle = this.props.paragraphData.nodeTitles[nid];
                renderedItem.push(
                    <View key={i}>
                      <Text style={styles.titleTextStyle}>{value.label}</Text>
                      <Text>{nodeTitle}</Text>
                    </View>
                );
              }
            }
          }
        }
      }
    }

    return (
        <View>
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
    fontSize: 24
  },
});


