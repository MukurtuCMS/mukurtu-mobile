import React from 'react';
import { TextInput, View, Text } from 'react-native';

export default class Textfield extends React.Component {

    render() {
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
        return <View>
            <Text>{field['#title']}</Text>
            <TextInput
                style={{height: 40, borderColor: 'gray', borderWidth: 1}}
                onChangeText={(text) => this.props.setFormValue(this.props.fieldName, text, valueKey)}
                value={value}
                defaultValue={field['#default_value']}
                maxLength={field['#maxlength']}
            />
        </View>;
    }
}