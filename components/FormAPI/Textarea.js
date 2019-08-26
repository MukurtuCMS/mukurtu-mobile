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
        if (this.props.formErrors) {
            const fieldLang = Object.keys(this.props.formValues[this.props.fieldName])[0];
            if (fieldName && fieldLang) {
                formErrorString = fieldName + '][' + fieldLang + '][0][value';
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

        let lang = 'und';
        if (this.props.formValues[this.props.fieldName] && typeof Object.keys(this.props.formValues[this.props.fieldName]) !== 'undefined') {
            lang = Object.keys(this.props.formValues[this.props.fieldName])[0];
        }

        const field = this.props.field;
        const valueKey = (field['#value_key']) ? field['#value_key'] : 'value';
        let value = '';
        if(typeof this.props.formValues[this.props.fieldName] !== 'undefined' && this.props.formValues[this.props.fieldName] !== undefined) {
            // set the language key as initial key
            const initialKey = Object.keys(this.props.formValues[this.props.fieldName])[0];
            // console.log(this.props.fieldName);
            // console.log(this.props.formValues[this.props.fieldName]);
            if(typeof this.props.formValues[this.props.fieldName][initialKey] !== 'undefined') {
                value = this.props.formValues[this.props.fieldName][initialKey]['0'][valueKey];
            }
        }

        let errorMarkup = [];
        if (error) {
            errorMarkup = <Text style={errorTextStyle}>{error}</Text>;
        }

        return <View>
            <Text style={titleTextStyle}>{field['#title']}</Text>
            {errorMarkup}
            <FieldDescription description={(this.props.description) ? this.props.description : null} />
            <Required required={this.props.required}/>
            <TextInput
                style={textfieldStyle}
                onChangeText={(text) => this.props.setFormValue(this.props.fieldName, text, valueKey, lang, formErrorString)}
                value={value}
                defaultValue={field['#default_value']}
                maxLength={field['#maxlength']}
                multiline
                numberOfLines={field['#rows']}
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
        fontSize: 20,
        fontWeight: 'bold'
    },
    errorTextStyle: {
        color: '#000'
    },
    errorTextStyleError: {
        color: Colors.default.errorBackground,
        marginBottom: 10
    },
    textareaStyle: {
        height: 'auto',
        borderColor: 'gray',
        borderWidth: 1
    },
    textfieldStyleError: {
        height: 'auto',
        borderWidth: 1,
        borderRadius: 1,
        borderColor: Colors.default.errorBackground
    }
});