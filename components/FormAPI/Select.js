import React from 'react';
import { Picker, View, Text } from 'react-native';
import {CheckBox} from "react-native-elements";

export default class Select extends React.Component {

    componentDidMount() {
        const field = this.props.field;
        const valueKey = (field['#value_key']) ? field['#value_key'] : 'value';

        if (field['#default_value'].length > 0) {
            this.props.setFormValue(this.props.fieldName, field['#default_value'][0], valueKey);
        } else {
        }
    }

    render() {
        const field = this.props.field;
        let options = [];
        // we need to determine if this is normal select options or entity refs
        let defaultSelect = true;
        // set value key, defaulted to value
        const valueKey = (field['#value_key']) ? field['#value_key'] : 'value';

        for (const [value, label] of Object.entries(field['#options'])) {
            if (typeof label === "string") {
                options.push(<Picker.Item
                        key={value}
                        label={label}
                        value={value}
                    />
                );
            } else {
                defaultSelect = false;
                for (const [v, l] of Object.entries(label)) {
                    if (typeof l === "string") {
                        options.push(<Picker.Item
                                key={v}
                                label={l}
                                value={v}
                            />
                        );
                    }
                }
            }
        }


        return <View>
            <Text>{field['#title']}</Text>
            <Picker
                style={{height: 50, width: 'auto'}}
                onValueChange={(text) => this.props.setFormValue(this.props.fieldName, text, valueKey)}
                selectedValue={(this.props.formValues[this.props.fieldName]) ? this.props.formValues[this.props.fieldName][0][valueKey] : ''}
            >
                {options}
            </Picker>
        </View>;
    }
}