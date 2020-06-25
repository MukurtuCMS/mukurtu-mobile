import React from 'react';
import {TextInput, View, Text, StyleSheet} from 'react-native';
import * as Colors from "../../constants/Colors";
import FieldDescription from "./FieldDescription";
import Required from "./Required";

export default class Textarea extends React.Component {

  render() {
    let error = null;
    let formErrorString = null;

    const fieldName = this.props.fieldName;

    const index = this.props.index || 0;

    let lang = 'und';
    if (this.props.formValues[this.props.fieldName] && typeof Object.keys(this.props.formValues[this.props.fieldName]) !== 'undefined') {
      lang = Object.keys(this.props.formValues[this.props.fieldName])[0];
    }

    if (this.props.formErrors) {
      if (fieldName) {
        formErrorString = fieldName + '][' + lang;
        if (this.props.formErrors[formErrorString]) {
          error = this.props.formErrors[formErrorString]
        }
      }
    }

    let titleTextStyle = styles.titleTextStyle;
    let textfieldStyle = styles.textareaStyle;
    let errorTextStyle = styles.errorTextStyle;
    if (error) {
      titleTextStyle = styles.titleTextStyleError;
      textfieldStyle = styles.textfieldStyleError;
      errorTextStyle = styles.errorTextStyleError;
    }


    const field = this.props.field;
    const valueKey = (field['#value_key']) ? field['#value_key'] : 'value';
    let value = '';
    if (typeof this.props.formValues[this.props.fieldName] !== 'undefined' && this.props.formValues[this.props.fieldName] !== undefined) {
      // set the language key as initial key
      const initialKey = Object.keys(this.props.formValues[this.props.fieldName])[0];

      if (typeof this.props.formValues[this.props.fieldName][initialKey] !== 'undefined') {
        value = this.props.formValues[this.props.fieldName][initialKey]['0'][valueKey];
      }
    }


    // let errorMarkup = <ErrorMessage error={error} />

    return <View style={styles.viewStyle}>
      <Text style={titleTextStyle}>{field['#title']}</Text>
      {/*{errorMarkup}*/}
      <FieldDescription
        description={(this.props.description) ? this.props.description : null}/>
      <Required required={this.props.required}/>
      <TextInput
        style={textfieldStyle}
        onChangeText={(text) => this.props.setFormValue(this.props.fieldName, text, valueKey, lang, formErrorString, index)}
        value={value}
        defaultValue={field['#default_value']}
        maxLength={field['#maxlength']}
        multiline={true}
        numberOfLines={field['#rows']}
        placeholder={'Enter ' + field['#title']}
      />
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
  textareaStyle: {
    height: 200,
    borderColor: Colors.default.mediumGray,
    borderRadius: 5,
    borderWidth: 1,
    marginBottom: 10,
    padding: 8,
    fontSize: 20,
    textAlignVertical: 'top'
  },
  textfieldStyleError: {
    height: 'auto',
    borderWidth: 1,
    borderRadius: 1,
    borderColor: Colors.default.errorBackground,
    fontSize: 18
  },
  viewStyle: {
    marginBottom: 15,
  }
});
