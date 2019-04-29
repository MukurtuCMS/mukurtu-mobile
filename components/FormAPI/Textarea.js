import React from 'react';
import { TextInput, View, Text } from 'react-native';

export default class Textarea extends React.Component {

    render() {
        const field = this.props.field;
        return <View>
            <Text>{field['#title']}</Text>
            <TextInput
                style={{height: 'auto', borderColor: 'gray', borderWidth: 1}}
                onChangeText={(text) => this.props.setFormValue(this.props.fieldName, text)}
                value={this.props.formValues[this.props.fieldName]}
                defaultValue={field['#default_value']}
                maxLength={field['#maxlength']}
                multiline
                numberOfLines={field['#rows']}
            />
        </View>;
    }
}