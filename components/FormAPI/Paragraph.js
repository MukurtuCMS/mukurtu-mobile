import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Button} from "react-native-elements";
import Textfield from "./Textfield";
import Select2 from "./Select2";
import Textarea from "./Textarea";
import _ from 'lodash';
import Colors from "../../constants/Colors";

export default class Paragraph extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      subformValues: {
        // 'field_word_entry': {
        //   [this.props.lang]: {
        //     '0': {}
        //   }
        // }
      },
      numberOfForms: 1,
      empty: true
    };
  }
  componentDidMount() {
    this.loadParagraphData();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const {fieldName, formValues, lang, screenProps} = this.props;
    // Run again if on mount there was no node data.
    // if (prevProps.formValues[fieldName] === undefined && _.has(formValues, [fieldName, lang])) {
    if ((!prevProps.nodeLoaded && this.props.nodeLoaded)) {
      this.loadParagraphData();
    }
  }

  loadParagraphData = () => {
    const {fieldName, formValues, lang, screenProps} = this.props;
    // if we already have paragraph data set, use that
    if (formValues['paragraphs'] !== undefined) {
      const length = Object.keys(formValues['paragraphs']).length;
      this.setState({numberOfForms: length, empty: false, subformValues: formValues['paragraphs']});
    }
    else if (_.has(formValues, [fieldName, lang])) {
      const existingKeys = Object.keys(formValues[fieldName][lang]);
      if (existingKeys.length > 0) {
        // Get the existing data saved.
        const existingValues = {[fieldName]: {[lang]: []}};
        existingKeys.forEach((i) => {
          if(formValues[fieldName][lang][i].value != null) {

            const pData = _.get(screenProps.paragraphData, [formValues[fieldName][lang][i].value], {});
            // const pData = (screenProps.paragraphData || {})[formValues[fieldName][lang][i].value] || {};
            const thisExistingValue = Object.keys(pData).reduce((prev, curr) => {
              if(curr.includes('field_')) {
                prev[curr] = pData[curr];
              }
              return prev;
            }, {});
            existingValues[fieldName][lang].push(thisExistingValue);
          }
        });

        this.setState({numberOfForms: existingKeys.length, empty: false, subformValues: existingValues});
      }
    }
  };

  addParagraph() {
    let currentIndex = this.state.numberOfForms;

    this.setState({numberOfForms: currentIndex + 1}, () => {

    })
  }

  removeParagraph(index) {
    // let currentIndex = this.state.numberOfForms;
    const {fieldName, lang} = this.props;
    const newFormValues = JSON.parse(JSON.stringify(this.state.subformValues));
    _.pullAt(newFormValues[fieldName][lang], index);
    // this.props.setFormValue(this.props.fieldName, newFormValues);
    // console.log({newFormValues});

    // Unset the values for this subform
    // let subformValues = this.state.subformValues;
    // subformValues[this.props.index] = undefined;

    this.setState((state) => {
      this.props.setFormValue(this.props.fieldName, newFormValues, index);
      return {
        subformValues: newFormValues,
        numberOfForms: state.numberOfForms -1
      }
      // this.setState({numberOfForms: currentIndex - 1});
      // Will need to remove values from parent formstate as well
    });


  }

  // this.props.setFormValue(this.props.fieldName, text, valueKey, lang, formErrorString, i)}
  setParagraphValue(fieldName, value, valueName, lang, options = [], index = 0, subindex = 0) {
    if (this.state.subformValues) {
      let paragraphFieldName = this.props.fieldName;
      let subformValues = JSON.parse(JSON.stringify(this.state.subformValues));

      // If this is a new form, make sure we have an empty value to start with.
      if (!_.has(subformValues, [paragraphFieldName, this.props.lang])) {
        subformValues[paragraphFieldName] = { [this.props.lang]: {}};
      }

      // Format Drupal needs for subform values:
      //   "field_word_entry": {
      //     "und": {
      //       "0": {
      //         "field_alternate_spelling": {
      //           "und": {
      //             "0": {
      //               "value": "alternate spelling value 1"
      //             }
      //           }
      //         },
      //         "field_sample_sentence": {
      //           "und": {
      //             "0": {
      //               "value": "1-1"
      //             },
      //             "1": {
      //               "value": "1-2"
      //             }
      //           }
      //         },
      //         "field_source": {
      //           "und": {
      //             "0": {
      //               "value": "a"
      //             }
      //           }
      //         }
      //       },
      //       "1": {
      //         "field_alternate_spelling": {
      //           "und": {
      //             "0": {
      //               "value": "alternate spelling value 2"
      //             }
      //           }
      //         },
      //         "field_sample_sentence": {
      //           "und": {
      //             "0": {
      //               "value": "2-1"
      //             },
      //             "1": {
      //               "value": "2-2"
      //             }
      //           }
      //         }
      //       }
      //     }
      //   }


      let subformvalue = {};
      // If this field already has a value, just overwrite this subindex
      // if (typeof subformValues[paragraphFieldName][this.props.lang] !== 'undefined' &&
      //   typeof subformValues[paragraphFieldName][this.props.lang][index] !== 'undefined' &&
      //   typeof subformValues[paragraphFieldName][this.props.lang][index][fieldName] !== 'undefined'
      // ) {

      // If we send a sub-index of -1 we indicating that the calling function already sorted out the sub-items.
      // This is needed if we have multi-value fields.
      let newValue = value;
      if (subindex !== -1) {
        newValue = {
          [subindex]: {
            [valueName]: value
          }
        };
      }

      if (_.has(subformValues, [paragraphFieldName, this.props.lang, index, fieldName])) {
        // let currentSubIndexForm = subformValues[paragraphFieldName][this.props.lang][index][fieldName][this.props.lang];
        let currentSubIndexForm = _.get(subformValues, [paragraphFieldName, this.props.lang, index, fieldName, this.props.lang], {});

        // let newValue = {
        //   [subindex]: {
        //     [valueName]: value
        //   }
        // };

        Object.assign(currentSubIndexForm, newValue);
        subformvalue = {
          [fieldName]: {
            [this.props.lang]: currentSubIndexForm
          }
        };

      }
      else {
        subformvalue = {
          [fieldName]: {
            [this.props.lang]: newValue
          }
        };

      }


      let currentIndexSubForm = {};
      // if (typeof subformValues[paragraphFieldName][this.props.lang][index] !== 'undefined') {
      if (_.has(subformValues, [paragraphFieldName, this.props.lang, index])) {
        currentIndexSubForm = subformValues[paragraphFieldName][this.props.lang][index];
      }
      Object.assign(currentIndexSubForm, subformvalue);

      subformValues[paragraphFieldName][this.props.lang][index] = currentIndexSubForm;

      this.setState({subformValues: subformValues}, () => {
        // Then when we're done setting paragraph values, add the paragraph state to the parent form state
        this.props.setFormValue(paragraphFieldName, this.state.subformValues);
      });

    }
  }

  setParagraphValueSelect2(fieldName, value, valueName, lang, options = [], index = 0, subindex = 0) {
    if (this.state.subformValues) {
      // If this is a new form, make sure we have an empty value to start with.
      let paragraphFieldName = this.props.fieldName;

      // let subformValues = this.state.subformValues;
      const existingFieldValues = _.get(this.state.subformValues, [paragraphFieldName, lang, subindex, fieldName, lang], []);

      if (options.length === 0 && existingFieldValues.length === 0) {
        // Can't remove from nothing.
        return;
      }

      // On delete we send empty options
      if (options.length === 0 && value.length === 0) {
        _.pullAt(existingFieldValues, index);
      }
      else {
        const item = _.find(options, ['text', value]);
        existingFieldValues[index] = {[valueName]: item.id}
      }

      const newValue = Object.assign({}, existingFieldValues);

      this.setParagraphValue(fieldName, newValue, valueName, lang, options, subindex, -1)

      //   let remainingOptions = [];
      //   for (let [k, v] of Object.entries(existingFieldValues)) {
      //     if (k !== index.toString()) {
      //       remainingOptions.push(v);
      //     }
      //   }
      //
      // }
      //
      // // Filter if we have options
      // if (options !== null && (typeof options === 'array' || typeof options === 'object') && options.length > 0) {
      //   let selectedOption = options.filter(function (option) {
      //     return option.text === value;
      //   });
      //   let nid = value;
      //   if (selectedOption !== undefined && selectedOption.length !== 0) {
      //     nid = selectedOption[0].id;
      //   }
      //   value = nid;
      // }
      // this.setParagraphValue(fieldName, value, valueName, lang, options, index, subindex)
    }


  }

  setParagraphValueScald(fieldName, sid, index = 0, subindex = 0) {
    if (this.state.subformValues) {
      // let paragraphFieldName = this.props.fieldName;
      // let subformValues = this.state.subformValues;
      //
      // // Filter if we have options
      // if (options !== null && (typeof options === 'array' || typeof options === 'object') && options.length > 0) {
      //   let selectedOption = options.filter(function (option) {
      //     return option.text === value;
      //   });
      //   let nid = value;
      //   if (selectedOption !== undefined && selectedOption.length !== 0) {
      //     nid = selectedOption[0].id;
      //   }
      //   value = nid;
      // }
      let lang = 'und';
      let options = [];
      let valueName = 'sid';
      this.setParagraphValue(fieldName, sid, valueName, lang, options, index, subindex)
    }

  }


  createParagraphForm(index) {
    let paragraphForm = [];
    let fields = this.props.field;
    let lang = this.props.lang;
    let parentField = this.props.fieldName;

    // If there are parent form values, we need to get subform values from there.
    // Otherwise subform values won't be saved if you tab between sections
    let currentFormValues = this.state.subformValues;
    if (typeof this.props.formValues['paragraphs'] !== 'undefined') {
      currentFormValues = this.props.formValues['paragraphs'];
    }


    // First put the relevant field values into an array so we can sort them by weight
    // For full nodes this is done before the component function, but it seems tidier to isolate all the paragraph functionality.
    let formFields = [];
    for (const key of Object.keys(fields)) {
      if (fields.hasOwnProperty(key) && key.charAt(0) !== '#') {
        formFields.push(fields[key]);
      }
    }

    // Sort by weight
    formFields.sort(function (a, b) {
      return a['#weight'] - b['#weight'];
    });

    formFields.forEach((subfield) => {

      let originalSubField = subfield;

      if (subfield['#type'] === 'container' && subfield[this.props.lang] !== undefined) {
        subfield = subfield[this.props.lang];
        if (subfield[0] !== undefined) {
          subfield = subfield[0];
        }
      }

      let fieldName;
      let scaldForm = {};

      if (subfield['#field_name'] !== undefined) {
        fieldName = subfield['#field_name'];
      }
      else if(subfield['sid'] !== undefined && subfield['sid']['#field_name'] !== undefined) {
        fieldName = subfield['sid']['#field_name'];
        scaldForm = _.get(currentFormValues, [parentField, 'und', index], {});
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

      if (subfield['sid'] !== undefined) {
        // const selectFormValues = _.get(currentFormValues, [parentField,
        // lang, index], {});
        paragraphForm.push(
          <View key={`${fieldName}-${index}`} style={{paddingBottom: 20}}>
            <Text key={'media-placeholder-header'} style={{
              fontSize: 20,
              fontWeight: 'bold'
            }}>{subfield['sid']['#title']}</Text>
            <Text key={'media-placeholder-text'} style={{fontStyle: 'italic'}}>Editing
              Media Items within paragraphs is currently not supported in the
              app.</Text>
          </View>
        );

        // paragraphForm.push(
        //   <Scald
        //     formValues={selectFormValues}
        //     fieldName={fieldName}
        //     field={subfield}
        //     key={`${fieldName}-${index}`}
        //     thisKey={`${fieldName}-${index}`}
        //     db={this.props.screenProps.db}
        //     documentDirectory={this.props.screenProps.documentDirectory}
        //     setFormValue={this.setParagraphValueScald.bind(this)}
        //     description={description}
        //     nodeLoaded={this.props.nodeLoaded}
        //     cookie={this.props.screenProps.cookie}
        //     token={this.props.screenProps.token}
        //     url={this.props.screenProps.siteUrl}
        //     cardinality={cardinality}
        //     enableSubmit={this.enableSubmit}
        //     disableSubmit={this.disableSubmit}
        //   />
        // )
      }
      else if (subfield !== undefined && subfield['#columns'] !== undefined) {
        if (subfield['#columns']['0'] !== undefined && (subfield['#columns']['0'] === 'tid' || subfield['#columns']['0'] === 'target_id')) {
          // Need to go one level deeper for select items
          const selectFormValues = _.get(currentFormValues, [parentField, lang, index], {});
          paragraphForm.push(<Select2
            parentIndex={index}
            formValues={selectFormValues}
            fieldName={fieldName}
            field={subfield}
            key={fieldName}
            setFormValue={this.setParagraphValueSelect2.bind(this)}
            cardinality={cardinality}
            description={description}
          />);
        }
        else if (subfield['#type'] != null && (subfield['#type'] === 'text_format' || subfield['#type'] === 'textarea')) {
          const selectFormValues = _.get(currentFormValues, [parentField, lang, index], {});
          paragraphForm.push(<Textarea
            index={index}
            formValues={selectFormValues}
            fieldName={fieldName}
            field={subfield}
            key={fieldName}
            description={description}
            setFormValue={this.setParagraphValue.bind(this)}
          />);
        }
        else {
          const selectFormValues = _.get(currentFormValues, [parentField, lang, index], {});
          paragraphForm.push(<Textfield
            index={index}
            formValues={selectFormValues}
            // formValues={currentFormValues}
            fieldName={fieldName}
            field={subfield}
            parentField={parentField}
            key={fieldName}
            setFormValue={this.setParagraphValue.bind(this)}
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

    let removeButton = <TouchableOpacity
      style={styles.mediaButton}
      key={`remove-btn-${index}`}
      index={index}
      onPress={() => this.removeParagraph(index)}
    >
      <Text style={styles.mediaButtonText}>Remove</Text>
    </TouchableOpacity>;
    paragraphForm.push(removeButton);


    return paragraphForm;
  }


  render() {

    let paragraphForms = [];

    let paragraphTitle = <Text key={'p-title'} style={styles.title}>{this.props.paragraphTitle}</Text>;

    const {field, fieldName, formValues} = this.props;


    let lang = 'und';
    if (formValues[fieldName]) {
      lang = Object.keys(formValues[fieldName])[0];
    }


    for (let i = 0; i < this.state.numberOfForms; i++) {
    // for (let i in Object.keys(formValues[fieldName][lang]) {
      let paragraphForm = this.createParagraphForm(i);
      const num = i +1;
      paragraphForms.push(<View style={styles.pItem} key={`p-item-${i}`}>
        <Text key={`p-item-title${i}`}>{this.props.paragraphTitle} #{num}</Text>
        {paragraphForm}
      </View>);
    }


    // Add action button
    let paragraphFormButton;
    if (this.props.field['actions'] !== undefined) {
      paragraphFormButton = <TouchableOpacity
        style={styles.mediaButton}
        key={'p-buttons'}
        onPress={this.addParagraph.bind(this)}
      >
        <Text style={styles.mediaButtonText}>{this.props.addMoreText}</Text>
      </TouchableOpacity>
    }

    // pointerEvents={'none'}
    return <View style={styles.viewStyle}>
      {paragraphTitle}
      <View key={'p-container'} style={styles.pContainer}>
        {paragraphForms}
      </View>
      {paragraphFormButton}
    </View>;
  }
}

const styles = StyleSheet.create({
  viewStyle: {
    marginBottom: 15,
    paddingVertical: 5,
    // backgroundColor: '#FFE9DD'
  },
  pContainer: {
    // borderColor: '#ccc',
    // borderWidth: 1,
    // padding: 10,
    // paddingBottom: 0
  },
  pItem: {
    borderColor: '#ccc',
    borderWidth: 1,
    padding: 10,
    marginBottom: 15,
  },
  title: {
    fontSize: 20
  },
  mediaButton: {
    color: Colors.primary,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.primary,
    borderRadius: 3,
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 10,
    paddingRight: 10,
    textAlign: 'center'
  },
  mediaButtonText: {
    color: Colors.primary,
    textTransform: 'uppercase',
    textAlign: 'center'
  }
});
