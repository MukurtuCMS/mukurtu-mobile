import React from 'react';
import {TextInput, View, Text, StyleSheet} from 'react-native';
import * as Colors from "../../constants/Colors";
import FieldDescription from "./FieldDescription"

export default class Textfield extends React.Component {
    constructor(props) {
        super(props);
    }

    render() {
        let error = null;
        let formErrorString = null;
        let lang = 'und';

        if (this.props.formValues[this.props.fieldName]) {
            lang = Object.keys(this.props.formValues[this.props.fieldName])[0];
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

        const field = this.props.field;
        const valueKey = (field['#value_key']) ? field['#value_key'] : 'value';
        let value = '';
        if (this.props.fieldName === 'title' && this.props.formValues[this.props.fieldName] !== undefined) {
            if(this.props.formValues[this.props.fieldName].length > 0) {
                value = this.props.formValues[this.props.fieldName];
            }
        }
        else if(typeof this.props.formValues[this.props.fieldName] !== 'undefined') {
            // set the language key as initial key
            const initialKey = Object.keys(this.props.formValues[this.props.fieldName])[0];
            value = this.props.formValues[this.props.fieldName][initialKey][0][valueKey];
        }

        let errorMarkup = [];
        if (error) {
            errorMarkup = <Text style={errorTextStyle}>{error}</Text>;
        }

        return <View>
            <Text style={titleTextStyle}>{field['#title']}</Text>
            {errorMarkup}
            <FieldDescription description={(this.props.description) ? this.props.description : null} />
            <TextInput
                style={textfieldStyle}
                onChangeText={(text) => this.props.setFormValue(this.props.fieldName, text, valueKey, formErrorString)}
                value={value}
                defaultValue={field['#default_value']}
                maxLength={field['#maxlength']}
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
    textfieldStyle: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1
    },
    textfieldStyleError: {
        height: 40,
        borderWidth: 1,
        borderRadius: 1,
        borderColor: Colors.default.errorBackground
    }
});