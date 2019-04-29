import React from 'react';
import { Picker, View, Text } from 'react-native';
import {CheckBox} from "react-native-elements";

export default class Select extends React.Component {

    render() {
        const field = this.props.field;
        let options = [];

        for (const [value, label] of Object.entries(field['#options'])) {
            options.push(<Picker.Item
                    key={value}
                    label={label}
                    value={value}
                />
            );
        }

        return <View>
            <Text>{field['#title']}</Text>
            <Picker
                style={{height: 50, width: 'auto'}}
                onValueChange={(text) => this.props.setFormValue(this.props.fieldName, text)}
                selectedValue={this.props.formValues[this.props.fieldName]}
            >
                {options}
            </Picker>
        </View>;
    }
}