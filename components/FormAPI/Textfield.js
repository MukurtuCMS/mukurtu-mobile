import React from 'react';
import {TextInput, View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import * as Colors from "../../constants/Colors";
import FieldDescription from "./FieldDescription";
import Required from "./Required";
import {Button} from "react-native-elements";
import ErrorMessage from "./ErrorMessage";
import _ from 'lodash';

export default class Textfield extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      numberOfValues: 1,
      inputFocus: false
    };
  }

  componentDidMount() {
    this.getValueCount();
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    const {formValues, fieldName} = this.props;
    if (prevProps.formValues[fieldName] === undefined && formValues[fieldName] !== undefined) {
      this.getValueCount();
    }
  }

  getValueCount = () => {
    const {formValues, fieldName} = this.props;
    const values = _.get(formValues, [fieldName, 'und'], []);
    const count = values.length || 1;
    this.setState({numberOfValues: count})
  };

  addItem() {
    let currentIndex = this.state.numberOfValues;

    this.setState({numberOfValues: currentIndex + 1}, () => {

    })
  }

  onFocus() {
    this.setState({
      inputFocus: true
    })
  }

  onBlur() {
    this.setState({
      inputFocus: false
    })
  }


  render() {
    let error = null;
    let formErrorString = null;
    let lang = 'und';

    if(typeof this.props.field['#language'] !== 'undefined') {
      lang = this.props.field['#language'];
    }


    const fieldName = this.props.fieldName;
    if (this.props.formErrors) {
      if (fieldName) {
        if (fieldName === 'title') {
          formErrorString = fieldName;
        } else {
          formErrorString = fieldName + '][' + lang;
        }
        if (this.props.formErrors[formErrorString]) {
          error = this.props.formErrors[formErrorString]
        }
      }
    }

    let titleTextStyle = styles.titleTextStyle;
    let textfieldStyle = styles.textfieldStyle;
    let errorTextStyle = styles.errorTextStyle;
    if (error) {
      titleTextStyle = styles.titleTextStyleError;
      textfieldStyle = styles.textfieldStyleError;
      errorTextStyle = styles.errorTextStyleError;
    }
    if (this.state.inputFocus) {
      textfieldStyle = styles.textfieldStyleFocus;
    }

    const field = this.props.field;
    const valueKey = (field['#value_key']) ? field['#value_key'] : 'value';


    let errorMarkup = <ErrorMessage error={error} />


    let numbers = [];
    for (let i = 0; i < this.state.numberOfValues; i++) {
      numbers.push(i);
    }

    let textInputs = numbers.map((i) => {

      let value = '';
      if (this.props.fieldName === 'title' && this.props.formValues[this.props.fieldName] !== undefined) {
        if (this.props.formValues[this.props.fieldName].length > 0) {
          value = this.props.formValues[this.props.fieldName];
        }
      } else if (typeof this.props.formValues[this.props.fieldName] !== 'undefined' &&
        typeof this.props.formValues[this.props.fieldName][lang] !== 'undefined' &&
        typeof this.props.formValues[this.props.fieldName][lang][i] !== 'undefined'
      ) {
        // set the language key as initial key
        value = this.props.formValues[this.props.fieldName][lang][i][valueKey];
      }
      // If there's a parent field, we're dealing with a paragraph and need to dig into the array to get the value
      else if (typeof this.props.parentField !== "undefined" &&
          typeof this.props.formValues !== 'undefined' &&
          typeof this.props.formValues[this.props.parentField] !== "undefined" &&
          typeof this.props.formValues[this.props.parentField][lang] !== 'undefined' &&
          typeof this.props.formValues[this.props.parentField][lang][this.props.index] !== 'undefined' &&
          typeof this.props.formValues[this.props.parentField][lang][this.props.index][this.props.fieldName] !== 'undefined' &&
          typeof this.props.formValues[this.props.parentField][lang][this.props.index][this.props.fieldName][lang] !== 'undefined' &&
          typeof this.props.formValues[this.props.parentField][lang][this.props.index][this.props.fieldName][lang][i] !== 'undefined'
      ) {
        value = this.props.formValues[this.props.parentField][lang][this.props.index][this.props.fieldName][lang][i][valueKey];
      }
      // See if we're dealing with a field collection
      else if(this.props.field['#entity_type'] === 'field_collection_item') {
        let parentField = this.props.field['#bundle'];
        if(typeof this.props.formValues[parentField] !== 'undefined' &&
          typeof this.props.formValues[parentField][this.props.index] !== 'undefined' &&
          typeof this.props.formValues[parentField][this.props.index][this.props.fieldName] !== 'undefined') {
          value = this.props.formValues[parentField][this.props.index][this.props.fieldName]['und'][i]['value'];
        }
      }

      let defaultValue = '';
      if(typeof field['#default_value'] === 'string') {
        defaultValue = field['#default_value']
      }

      // in most cases field['#title'] works, but for a multiple value field within a paragraph (sample sentences),
      // it was stored elsewhere, so it's passed as a prop.
      let title = field['#title'];
      if(this.props.title) {
        title = this.props.title;
      }

      return (
        <TextInput
          key={i}
          index={i}
          style={textfieldStyle}
          onChangeText={(text) => this.props.setFormValue(this.props.fieldName, text, valueKey, lang, formErrorString, this.props.index, i)}
          value={value}
          defaultValue={defaultValue}
          maxLength={parseInt(field['#maxlength'])}
          onBlur={() => this.onBlur()}
          onFocus={() => this.onFocus()}
          placeholder={'Enter ' + title}
        />);

    }, this);

    let addMoreButton;
    let addMoreText = 'Add Another'; // Default in case it's not passed in props
    if(this.props.addMoreText) {
      addMoreText = this.props.addMoreText;
    }
    if (this.props.cardinality === -1) {
      addMoreButton = <TouchableOpacity
        style={styles.mediaButton}
        onPress={this.addItem.bind(this)}
      >
        <Text style={styles.mediaButtonText}>{addMoreText}</Text>
      </TouchableOpacity>
    }

    // in most cases field['#title'] works, but for a multiple value field within a paragraph (sample sentences),
    // it was stored elsewhere, so it's passed as a prop.
    let title = field['#title'];
    if(this.props.title) {
      title = this.props.title;
    }


    return <View style={styles.viewStyle}>
      <Text style={titleTextStyle}>{title}</Text>
      {errorMarkup}
      <FieldDescription description={(this.props.description) ? this.props.description : null}/>
      <Required required={this.props.required}/>
      {textInputs}
      {addMoreButton}
    </View>;
  }
}

const styles = StyleSheet.create({
  titleTextStyle: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold'
  },
  titleTextStyleError: {
    color: Colors.default.errorBackground,
    fontSize: 18,
    fontWeight: 'bold'
  },
  errorTextStyle: {
    color: '#000'
  },
  errorTextStyleError: {
    color: Colors.default.errorBackground,
    fontSize: 18,
    marginBottom: 10
  },
  textfieldStyle: {
    height: 60,
    borderWidth: 1,
    borderColor: Colors.default.mediumGray,
    borderRadius: 5,
    backgroundColor: '#FFF',
    marginBottom: 10,
    padding: 8,
    fontSize: 20
  },
  textfieldStyleError: {
    height: 60,
    borderWidth: 1,
    borderColor: Colors.default.errorBackground,
    borderRadius: 5,
    backgroundColor: '#FFF',
    marginBottom: 10,
    borderBottomWidth: 4,
    borderBottomColor: Colors.default.errorBackground,
    padding: 8,
    fontSize: 18
  },
  textfieldStyleFocus: {
    height: 60,
    borderWidth: 1,
    borderColor: Colors.default.mediumGray,
    borderRadius: 5,
    backgroundColor: '#FFF',
    marginBottom: 10,
    borderBottomWidth: 4,
    borderBottomColor: Colors.default.gold,
    padding: 8,
    fontSize: 20
  },
  viewStyle: {
    marginBottom: 15,
  },
  mediaButton: {
    color: Colors.default.primary,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.default.primary,
    borderRadius: 3,
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 10,
    paddingRight: 10,
    textAlign: 'center'
  },
  mediaButtonText: {
    color: Colors.default.primary,
    textTransform: 'uppercase',
    textAlign: 'center'
  }
});
