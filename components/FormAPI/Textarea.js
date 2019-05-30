import React from 'react';
import { TextInput, View, Text } from 'react-native';

export default class Textarea extends React.Component {

    render() {
        const field = this.props.field;
        const valueKey = (field['#value_key']) ? field['#value_key'] : 'value';
        let value = '';
        if(typeof this.props.formValues[this.props.fieldName] !== 'undefined' && this.props.formValues[this.props.fieldName] !== undefined) {
            // set the language key as initial key
            const initialKey = Object.keys(this.props.formValues[this.props.fieldName])[0];
            // console.log(this.props.fieldName);
            // console.log(this.props.formValues[this.props.fieldName]);
            value = this.props.formValues[this.props.fieldName][initialKey]['0'][valueKey];
        }
        return <View>
            <Text>{field['#title']}</Text>
            <TextInput
                style={{height: 'auto', borderColor: 'gray', borderWidth: 1}}
                onChangeText={(text) => this.props.setFormValue(this.props.fieldName, text, valueKey)}
                value={value}
                defaultValue={field['#default_value']}
                maxLength={field['#maxlength']}
                multiline
                numberOfLines={field['#rows']}
            />
        </View>;
    }
}