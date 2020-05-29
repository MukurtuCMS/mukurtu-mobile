import React from 'react';
import {Text, View} from 'react-native';

export class FieldCollection extends React.Component {


  // Need to make sure this a) includes titles for fields and b) includes any additional fields that might be missed on
  // content types that haven't been tested yet.
  // Will probably need to get titles from form data — they're not in
  componentDidMount() {

  }


  render() {
    let renderedItem = [];
    // First check for text value
    if (typeof this.props.screenProps.fieldCollectionsData !== 'undefined' && this.props.screenProps.fieldCollectionsData && this.props.screenProps.fieldCollectionsData[this.props.fid] ) {
      for (let [key, value] of Object.entries(this.props.screenProps.fieldCollectionsData[this.props.fid])) {
        if (this.props.screenProps.fieldCollectionsData[this.props.fid][key]) {
          if (typeof this.props.screenProps.fieldCollectionsData[this.props.fid][key] !== 'undefined' &&
            typeof this.props.screenProps.fieldCollectionsData[this.props.fid][key]['und'] !== 'undefined' &&
            typeof this.props.screenProps.fieldCollectionsData[this.props.fid][key]['und']['0']['value'] !== 'undefined'
          ) {
            renderedItem.push(
              <View key={key}>
                {/*<Text style={styles.titleTextStyle}>{value.label}</Text>*/}
                <Text>{this.props.screenProps.fieldCollectionsData[this.props.fid][key]['und']['0']['value']}</Text>
              </View>
            )
          }
          // Taxonomy term
          else if (typeof this.props.screenProps.fieldCollectionsData[this.props.fid][key] !== 'undefined' &&
            typeof this.props.screenProps.fieldCollectionsData[this.props.fid][key]['und'] !== 'undefined' &&
            typeof this.props.screenProps.fieldCollectionsData[this.props.fid][key]['und']['0']['tid'] !== 'undefined'
          ) {

            // Fix this to reference terms in screenprops if we need it
            // for (let i = 0; i < this.props.screenProps.fieldCollectionsData[this.props.fid][key]['und'].length; i++) {
            //
            //   let tid = this.props.screenProps.fieldCollectionsData[this.props.fid][key]['und'][i]['tid'];
            //   if (this.props.terms[tid]) {
            //     let termTitle = this.props.terms[tid].name;
            //     renderedItem.push(
            //       <View key={i}>
            //         {/*<Text style={styles.titleTextStyle}>{value.label}</Text>*/}
            //         <Text>{termTitle}</Text>
            //       </View>
            //     )
            //   }
            // }

          }
          // Node reference
          else if (typeof this.props.screenProps.fieldCollectionsData[this.props.fid][key] !== 'undefined' &&
            typeof this.props.screenProps.fieldCollectionsData[this.props.fid][key]['und'] !== 'undefined' &&
            typeof this.props.screenProps.fieldCollectionsData[this.props.fid][key]['und']['0']['target_id'] !== 'undefined'
          ) {
            for (let i = 0; i < this.props.screenProps.fieldCollectionsData[this.props.fid][key]['und'].length; i++) {
              let nid = this.props.screenProps.fieldCollectionsData[this.props.fid][key]['und'][i]['target_id'];
              if(this.props.screenProps.nodes[nid].title) {
                let nodeTitle = this.props.screenProps.nodes[nid].title;
                renderedItem.push(
                  <View key={i}>
                    {/*<Text style={styles.titleTextStyle}>{value.label}</Text>*/}
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


