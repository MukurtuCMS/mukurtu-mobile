import React from 'react';
import {View, Text} from 'react-native';
import {Button, CheckBox} from "react-native-elements";
import Textfield from "./Textfield";
import Select2 from "./Select2";

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

    this.setState({numberOfForms: currentIndex + 1}, () => {

    })
  }

  removeParagraph() {
    let currentIndex = this.state.numberOfForms;

    // Unset the values for this subform
    let subformValues = this.state.subformValues;
    subformValues[this.props.index] = undefined;

    this.setState({subformValues: subformValues}, () => {
      this.setState({numberOfForms: currentIndex - 1});
      // Will need to remove values from parent formstate as well
    });


  }


  setParagraphValue(fieldName, value, valueName, index) {
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


      if (typeof subformValues[index] === 'undefined') {
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

    // First put the relevant field values into an array so we can sort them by weight
    // For full nodes this is done before the component function, but it seems tidier to isolate all the paragraph functionality.
    let formFields = [];
    for (const key of Object.keys(fields)) {
      if (fields.hasOwnProperty(key) && key.charAt(0) !== '#') {
        formFields.push(fields[key]);
      }
    }

    // Sort by weight
    formFields.sort(function(a, b) {
      return a['#weight'] - b['#weight'];
    });

    formFields.forEach((subfield) => {

      if (subfield['#type'] === 'container' && subfield['und'] !== undefined) {
        subfield = subfield['und'];
        if (subfield[0] !== undefined) {
          subfield = subfield[0];
        }
      }

      let fieldName;
      if (subfield['#field_name'] !== undefined) {
        fieldName = subfield['#field_name'];
      }

      if (subfield['#weight'] !== undefined) {

        if (subfield !== undefined && subfield['#columns'] !== undefined) {
          if (subfield['#columns']['0'] !== undefined && subfield['#columns']['0'] === 'tid') {
            paragraphForm.push(<Select2
                formValues={this.state.subformValues}
                fieldName={fieldName}
                field={subfield}
                key={fieldName}
                setFormValue={this.setParagraphValue.bind(this)}
            />);
          } else {

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
    });

    // Add remove button if this isn't the first one
    if (index > 0) {
      let removeButton = <Button
          index={index}
          title="Remove"
          onPress={this.removeParagraph.bind(this)}
      />;
      paragraphForm.push(removeButton);
    }

    return paragraphForm;
  }


  render() {

    let paragraphForms = [];

    let paragraphTitle = <Text>{this.props.paragraphTitle}</Text>;

    for (let i = 0; i < this.state.numberOfForms; i++) {
      let paragraphForm = this.createParagraphForm(i);
      paragraphForms.push(paragraphForm);
    }


    // Add action button
    let paragraphFormButton;
    if (this.props.field['actions'] !== undefined) {
      paragraphFormButton = <Button
          title={this.props.addMoreText}
          onPress={this.addParagraph.bind(this)}
      />
    }

    return <View>
      {paragraphTitle}
      {paragraphForms}
      {paragraphFormButton}
    </View>;
  }
}