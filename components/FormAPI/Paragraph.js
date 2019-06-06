import React from 'react';
import {View, Text} from 'react-native';
import {Button, CheckBox} from "react-native-elements";
import Textfield from "./Textfield";

export default class Paragraph extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      subformValues: {}
    };

  }

  addParagraph() {

  }

  setParagraphValue(fieldName, value) {
    if (this.state.subformValues) {
      // Will need to get this dynamically
      let paragraphFieldName = 'field_word_entry';
      const subformValues = this.state.subformValues;

      // Format Drupal needs for submissions:
      // "field_word_entry": {
      //   "und": {
      //     "0": {
      //       "field_alternate_spelling": {
      //         "und": {
      //           "0": {
      //             "value": "alternate spelling value"
      //           }
      //         }
      //       }
      //     },
      //     "1": {
      //       "field_alternate_spelling": {
      //         "und": {
      //           "0": {
      //             "value": "22222"
      //           }
      //         }
      //       }
      //     }
      //   }
      // },

      let values = {
          [fieldName] : {
            "und" : {
              "0" : {
                "value": value
              }
            }
          }
      };
      Object.assign(subformValues, values);
      this.setState({subformValues: subformValues}, () => {
        // Then when we're done setting paragraph values, add the paragraph state to the parent form state
        this.props.setFormValue(paragraphFieldName, this.state.subformValues);
      });

    }


  }

  render() {

    let debugProps = this.props;
    let paragraphForm = [];

    paragraphForm.push(<Text>Test Paragraph Form</Text>);
    // paragraphForm.push(this.props.subForm);

    let fields = this.props.field;

    for (const key of Object.keys(fields)) {
      if (fields.hasOwnProperty(key) && key.charAt(0) !== '#') {


        let subfield = fields[key];
        if(subfield['#type'] === 'container' && subfield['und'] !== undefined) {
          subfield = subfield['und'][0];
        }



        if(subfield !== undefined && subfield['#columns'] !== undefined) {
          let fieldName;
          if(subfield['#field_name'] !== undefined) {
            fieldName = subfield['#field_name'];
          }
          paragraphForm.push(<Textfield
              formValues={this.state.subformValues}
              fieldName={subfield['#field_name']}
              field={subfield}
              key={subfield['#field_name']}
              setFormValue={this.setParagraphValue.bind(this)}
              // onChangeText={(text) => this.setParagraphValue(subfield['#field_name'], text)}
          />);

        }
      }
    }


    // Add action button
    if(this.props.field['actions'] !== undefined) {
      paragraphForm.push(<Button
          title="Add Another"
          onPress={this.addParagraph}
      />)
    }

    return <View>
      {paragraphForm}
    </View>;
  }
}