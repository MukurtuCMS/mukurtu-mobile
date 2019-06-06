import React from 'react';
import {View, Text} from 'react-native';
import {Button, CheckBox} from "react-native-elements";
import Textfield from "./Textfield";

export default class Paragraph extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      subformValues: {},
      numberOfForms: 1
    };

  }

  addParagraph() {

    let currentIndex = this.state.numberOfForms;

    this.setState({numberOfForms: currentIndex + 1}, ()=> {

    })
  }

  setParagraphValue(fieldName, value, valueName,  index) {
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


      if(typeof subformValues[index] === 'undefined') {
        subformValues[index] = {};
      }


      subformValues[index][fieldName] = {
        "und": {
          "0": {
            [valueName]: value
          }
        }
      };


      this.setState({subformValues: subformValues}, () => {
        // Then when we're done setting paragraph values, add the paragraph state to the parent form state
        this.props.setFormValue(paragraphFieldName, this.state.subformValues);
      });

    }
  }

  createParagraphForm(index) {
    let paragraphForm = [];
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
              index={index}
              formValues={this.state.subformValues}
              fieldName={fieldName}
              field={subfield}
              key={fieldName}
              setFormValue={this.setParagraphValue.bind(this)}
              // onChangeText={(text) => this.setParagraphValue(subfield['#field_name'], text)}
          />);

        }
      }
    }
    return paragraphForm;
  }


  render() {

    let debugProps = this.props;
    let paragraphForms = [];
    // let paragraphForm = [];

    let paragraphFormTitle = <Text>Test Paragraph Form</Text>;
    // paragraphForm.push(this.props.subForm);



    for(let i = 0; i < this.state.numberOfForms; i++) {
      let paragraphForm = this.createParagraphForm(i);
      paragraphForms.push(paragraphForm);
    }


    // Add action button
    let paragraphFormButton;
    if(this.props.field['actions'] !== undefined) {
      paragraphFormButton = <Button
          title="Add Another"
          onPress={this.addParagraph.bind(this)}
      />
    }

    return <View>
      {paragraphFormTitle}
      {paragraphForms}
      {paragraphFormButton}
    </View>;
  }
}