import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Button} from "react-native-elements";
import Textfield from "./Textfield";
import Select2 from "./Select2";

export default class FieldCollectionForm extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      subformValues: {},
      numberOfForms: 1
    };

  }

  addFieldCollection() {
    let currentIndex = this.state.numberOfForms;

    this.setState({numberOfForms: currentIndex + 1}, () => {

    })
  }

  removeFieldCollection() {
    let currentIndex = this.state.numberOfForms;

    // Unset the values for this subform
    let subformValues = this.state.subformValues;
    subformValues[this.props.index] = undefined;

    this.setState({subformValues: subformValues}, () => {
      this.setState({numberOfForms: currentIndex - 1});
      // Will need to remove values from parent formstate as well
    });


  }

  // this.props.setFormValue(this.props.fieldName, text, valueKey, lang, formErrorString, i)}
  setFieldCollectionValue(fieldName, value, valueName, lang, options = [], index = 0, subindex = 0) {
    if (this.state.subformValues) {
      let FieldCollectionFieldName = this.props.fieldName;
      let subformValues = this.state.subformValues;

      // Format Drupal needs for subform values:
      // "field_collection": {
      //   "field_name":
      // We only do this part here. Rest is done on setFieldCollectionValue in form.js
      //   "field_lesson_days": {
      //     0: {
      //     "field_day": {
      //     "und": {
      //       "0": {
      //         "value": "day 1"
      //       }
      //     }
      //   }
      // }


      let subformvalue = {};
      // If this field already has a value, just overwrite this subindex
      if (typeof subformValues[FieldCollectionFieldName] !== 'undefined' &&
         typeof subformValues[FieldCollectionFieldName][index] !== 'undefined' &&
        typeof subformValues[FieldCollectionFieldName][index][fieldName] !== 'undefined'
      ) {
        let currentSubIndexForm = subformValues[FieldCollectionFieldName][index][fieldName][this.props.lang];
        let newValue = {
          [subindex]: {
            [valueName]: value
          }
        };

        Object.assign(currentSubIndexForm, newValue);
        subformvalue = {
          [fieldName]: {
            [this.props.lang]: currentSubIndexForm
          }
        };

      } else {


        subformvalue = {
          [fieldName]: {
            [this.props.lang]: {
              [subindex]: {
                [valueName]: value
              }
            }
          }
        };

      }


      let currentIndexSubForm = {};
      if (typeof subformValues[FieldCollectionFieldName] !== 'undefined' && typeof subformValues[FieldCollectionFieldName][index] !== 'undefined') {
        currentIndexSubForm = subformValues[FieldCollectionFieldName][index];
      }
      Object.assign(currentIndexSubForm, subformvalue);

      if(typeof subformValues[FieldCollectionFieldName] === 'undefined') {
        subformValues[FieldCollectionFieldName] = {};
        subformValues[FieldCollectionFieldName][index] = {};
      }
      subformValues[FieldCollectionFieldName][index] = currentIndexSubForm;

      // Subform values should look something like
      //   "field_lesson_days",
      //     "field_day": {
      //     "und": {
      //       "0": {
      //         "value": "day 1"
      //       }
      //     }
      //   }

      this.setState({subformValues: subformValues}, () => {
        // Then when we're done setting FieldCollection values, add the FieldCollection state to the parent form state
        this.props.setFormValue(FieldCollectionFieldName, this.state.subformValues);
      });

    }
  }

  // setFieldCollectionValueSelect2(fieldName, value, valueName, lang, options = [], index = 0, subindex = 0) {
  //   if (this.state.subformValues) {
  //     let FieldCollectionFieldName = this.props.fieldName;
  //     let subformValues = this.state.subformValues;
  //
  //     // Filter if we have options
  //     if (options !== null && (typeof options === 'array' || typeof options === 'object') && options.length > 0) {
  //       let selectedOption = options.filter(function (option) {
  //         return option.text === value;
  //       });
  //       let nid = value;
  //       if (selectedOption !== undefined && selectedOption.length !== 0) {
  //         nid = selectedOption[0].id;
  //       }
  //       value = nid;
  //     }
  //
  //     this.setFieldCollectionValue(fieldName, value, valueName, lang, options, index, subindex)
  //   }
  //
  //
  // }


  createFieldCollectionForm(index) {
    let FieldCollectionForm = [];
    let fields = this.props.items;
    let parentField = this.props.fieldName;

    // First put the relevant field values into an array so we can sort them by weight
    // For full nodes this is done before the component function, but it seems tidier to isolate all the FieldCollection functionality.
    let formFields = [];
    for (const key of Object.keys(fields)) {
      if (fields.hasOwnProperty(key) && key.charAt(0) !== '#') {
        formFields.push(fields[key]);
      }
    }
    //
    // // Sort by weight
    // formFields.sort(function (a, b) {
    //   return a['#weight'] - b['#weight'];
    // });

    formFields.forEach((subfield) => {

      let originalSubField = subfield;


      if (subfield['#type'] === 'container' && subfield[this.props.lang] !== undefined) {
        subfield = subfield[this.props.lang];
        if (subfield[0] !== undefined) {
          subfield = subfield[0];
        }
      }

      let fieldName;
      if (subfield['#field_name'] !== undefined) {
        fieldName = subfield['#field_name'];
      }

      let fieldTitle = '';
      if (typeof subfield !== 'undefined' && typeof subfield['#title'] !== 'undefined') {
        fieldTitle = subfield['#title'];
      }

      //
      let cardinality = 1;
      if (typeof originalSubField[this.props.lang] !== 'undefined' && typeof originalSubField[this.props.lang]['#cardinality'] !== 'undefined') {
        cardinality = Number(originalSubField[this.props.lang]['#cardinality']);
      }

      // If there's add more button text, pass that as a prop.
      // Is only used if there's cardinality other than -1
      let addMoreText;
      if (typeof originalSubField[this.props.lang] !== 'undefined' && typeof originalSubField[this.props.lang]['add_more'] !== 'undefined') {
        addMoreText = originalSubField[this.props.lang]['add_more']['#value'];
      }

      // Multiple value text fields store title here
      if (typeof originalSubField[this.props.lang] !== "undefined" && typeof originalSubField[this.props.lang]['#title'] !== "undefined") {
        fieldTitle = originalSubField[this.props.lang]['#title'];
      }

      let description = '';
      if (originalSubField['und']) {
        description = originalSubField['und']['#description'];
      }

      // If there are parent form values, we need to get subform values from there.
      // Otherwise subform values won't be saved if you tab between secstions
      let currentFormValues = this.state.subformValues;
      if (typeof this.props.formValues['FieldCollections'] !== 'undefined') {
        currentFormValues = this.props.formValues['FieldCollections'];
      }

      if (subfield !== undefined && subfield['#columns'] !== undefined) {
        if (subfield['#columns']['0'] !== undefined && subfield['#columns']['0'] === 'tid') {
          FieldCollectionForm.push(<Select2
            index={index}
            formValues={currentFormValues}
            fieldName={fieldName}
            field={subfield}
            key={fieldName}
            setFormValue={this.setFieldCollectionValueSelect2.bind(this)}
            cardinality={cardinality}
            description={description}
          />);
        } else {

          FieldCollectionForm.push(<Textfield
            index={index}
            formValues={currentFormValues}
            fieldName={fieldName}
            field={subfield}
            parentField={parentField}
            key={fieldName}
            setFormValue={this.setFieldCollectionValue.bind(this)}
            title={fieldTitle}
            cardinality={cardinality}
            addMoreText={addMoreText}
            description={description}
          />);
        }
      }
      // }
    }, this);

    // Add remove button if this isn't the first one
    if (index > 0) {
      let removeButton = <Button
        index={index}
        title="Remove"
        onPress={this.removeFieldCollection.bind(this)}
      />;
      FieldCollectionForm.push(removeButton);
    }

    return FieldCollectionForm;
  }


  render() {

    let FieldCollectionForms = [];

    let FieldCollectionTitle = <Text style={styles.titleTextStyle}>{this.props.title}</Text>;

    for (let i = 0; i < this.state.numberOfForms; i++) {
      let FieldCollectionForm = this.createFieldCollectionForm(i);
      FieldCollectionForms.push(FieldCollectionForm);
    }


    // Add action button
    let FieldCollectionFormButton;
    if(typeof this.props.field['und']['add_more'] !== 'undefined') {
      let addMoreText = 'Add More';
      if(this.props.field['und']['add_more']['#value']) {
        addMoreText = this.props.field['und']['add_more']['#value'];
      }
      FieldCollectionFormButton = <Button
        title={addMoreText}
        onPress={this.addFieldCollection.bind(this)}
      />
    }


    return <View style={styles.viewStyle}>
      {FieldCollectionTitle}
      {FieldCollectionForms}
      {FieldCollectionFormButton}
    </View>;
  }
}

const styles = StyleSheet.create({
  viewStyle: {
    marginBottom: 15,
  },
  titleTextStyle: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold'
  },
});
