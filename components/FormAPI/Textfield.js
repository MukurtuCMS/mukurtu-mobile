import React from 'react';
import { TextInput, View, Text } from 'react-native';

export default class Textfield extends React.Component {

    render() {
        const field = this.props.field;
        const valueKey = (field['#value_key']) ? field['#value_key'] : 'value';
        let value = '';
        if(typeof this.props.formValues[this.props.fieldName] !== 'undefined') {
            value = this.props.formValues[this.props.fieldName][valueKey];
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