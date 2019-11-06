import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CheckBox} from "react-native-elements";
import * as Colors from "../../constants/Colors"
import FieldDescription from "./FieldDescription";
import Required from "./Required";
import ErrorMessage from "./ErrorMessage";

export default class Radios extends React.Component {

    determineCheckboxValue(fieldName, fieldValue, fieldKey) {
        if (this.props.formValues[fieldName]) {
            // set the language key as initial key
            const lang = Object.keys(this.props.formValues[this.props.fieldName])[0];

            if (this.props.formValues[fieldName][lang][fieldKey] === fieldValue) {
                return true;
            } else if (typeof this.props.formValues[fieldName][lang][0] !== 'undefined'&& this.props.formValues[fieldName][lang][0][fieldKey] === fieldValue) {
            return true;
          }
        }
        return false;
    }

    render() {
      if(this.props.field['#options'].length === 0) {
        return null;
      }

        let error = null;
        let formErrorString = null;
        let lang = 'und';

        if (this.props.formValues[this.props.fieldName]) {
            lang = Object.keys(this.props.formValues[this.props.fieldName]);
        }

        const fieldName = this.props.fieldName;
        if (this.props.formErrors) {
            if (fieldName && lang) {
                formErrorString = fieldName + '][' + lang;
                if (this.props.formErrors[formErrorString]) {
                    error = this.props.formErrors[formErrorString]
                }
            }
        }

        let titleTextStyle = styles.titleTextStyle;
        let errorTextStyle = styles.errorTextStyle;
        let checkboxStyle = styles.checkboxStyle;
        if (error) {
            titleTextStyle = styles.titleTextStyleError;
            errorTextStyle = styles.errorTextStyleError;
            checkboxStyle = styles.checkboxStyleError;
        }

        const field = this.props.field;
        const valueKey = (field['#value_key']) ? field['#value_key'] : 'value';
        let checkboxes = [];
        for (const [value, label] of Object.entries(field['#options'])) {
            checkboxes.push(<CheckBox
                    key={value}
                    title={label}
                    containerStyle={checkboxStyle}
                    iconType='material'
                    checkedIcon='radio-button-checked'
                    uncheckedIcon='radio-button-unchecked'
                    checkedColor={Colors.default.gold}
                    checked={this.determineCheckboxValue(this.props.fieldName, value, valueKey)}
                    onPress={() => this.props.setFormValue(this.props.fieldName, value, valueKey, lang, formErrorString)}
                    formError={error}
                    textStyle={styles.textStyle}
                ></CheckBox>
            );
        }

      let errorMarkup = <ErrorMessage error={error} />
        return <View style={styles.viewStyle}>
            <Text style={titleTextStyle}>{field['#title']}</Text>
            {errorMarkup}
            <FieldDescription description={(this.props.description) ? this.props.description : null} />
            <Required required={this.props.required}/>
            {checkboxes}
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
    checkboxStyle: {
        borderRadius: 0,
        backgroundColor: '#FFF',
        borderColor: 'transparent',
        padding: 0,
        marginBottom: 5
    },
    checkboxStyleError: {
        borderRadius: 1,
        borderColor: Colors.default.errorBackground,
        backgroundColor: '#FFF',
        padding: 0,
        marginBottom: 5
    },
    textStyle: {
        fontWeight: 'normal',
        fontSize: 14,
        color: '#464646'
    },
  viewStyle: {
    marginBottom: 15,
  }
});
