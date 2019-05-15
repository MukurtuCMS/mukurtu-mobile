import React from 'react';
import { View, Text } from 'react-native';
import { CheckBox} from "react-native-elements";

export default class Radios extends React.Component {

    determineCheckboxValue(fieldName, fieldValue, fieldKey) {
        if (this.props.formValues[fieldName]) {
            if (this.props.formValues[fieldName][0][fieldKey] === fieldValue) {
                return true;
            }
        }
        return false;
    }

    render() {
        const field = this.props.field;
        const valueKey = (field['#value_key']) ? field['#value_key'] : 'value';
        let checkboxes = [];

        for (const [value, label] of Object.entries(field['#options'])) {
            checkboxes.push(<CheckBox
                key={value}
                title={label}
                checked={this.determineCheckboxValue(this.props.fieldName, value, valueKey)}
                onPress={() => this.props.setFormValue(this.props.fieldName, value, valueKey)}
            ></CheckBox>
        );
        }
        return <View>
            <Text>{field['#title']}</Text>
            {checkboxes}
        </View>;
    }
}