import React from 'react';
import { TextInput, View, Text } from 'react-native';

export default class Textfield extends React.Component {

    render() {
        const field = this.props.field;
        return <View>
            <Text>{field['#title']}</Text>
            <TextInput
                style={{height: 40, borderColor: 'gray', borderWidth: 1}}
                onChangeText={(text) => this.props.setFormValue(this.props.fieldName, text)}
                value={this.props.formValues[this.props.fieldName]}
                defaultValue={field['#default_value']}
                maxLength={field['#maxlength']}
            />
        </View>;
    }
}