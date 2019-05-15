import React from 'react';
import { View, Text } from 'react-native';
import { CheckBox} from "react-native-elements";

export default class Checkboxes extends React.Component {

    determineCheckboxValue(fieldName, fieldKey) {
        return (this.props.formValues[fieldName]) ? this.props.formValues[fieldName][fieldKey] : false;
    }

    render() {
        const field = this.props.field;
        let checkboxes = [];

        for (const [value, label] of Object.entries(field['#options'])) {
            checkboxes.push(<CheckBox
                key={value}
                title={label}
                checked={this.determineCheckboxValue(this.props.fieldName, value)}
                onPress={() => this.props.setFormValueCheckboxes(this.props.fieldName, value ,!(this.determineCheckboxValue(this.props.fieldName, value)))}
            ></CheckBox>
        );
        }
        return <View>
            <Text>{field['#title']}</Text>
            {checkboxes}
        </View>;
    }
}