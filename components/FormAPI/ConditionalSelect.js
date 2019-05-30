import React from 'react';
import {Picker, View, Text} from 'react-native';
import {CheckBox} from "react-native-elements";

export default class ConditionalSelect extends React.Component {

  componentDidMount() {
    // const field = this.props.field;
    // const valueKey = (field['#value_key']) ? field['#value_key'] : 'value';
    //
    // if (field['#default_value'].length > 0) {
    //   this.props.setFormValue(this.props.fieldName, field['#default_value'][0], valueKey);
    // }
  }

  render() {
    const field = this.props.field;

    let options = field['#options'];


    // Options will be formatted like this
    // Object {
    //       "Community": Object {
    //         "2": "Test Community 1",
    //       },
    //       "Cultural Protocol": Object {
    //         "3": "Test Community 1 Community Only",
    //         "4": "Test Protocol 1",
    //       },
    //       "Language Community": Object {
    //         "7": "English Community",
    //         "8": "French Community",
    //       },
    //       "_none": "- None -",
    //     },

    let parentPickerOptions = [];

    for (let key in options) {
      if (options.hasOwnProperty(key)) {
        parentPickerOptions.push(<Picker.Item
                key={key}
                label={key}
                value={key}
            />
        );
      }
    }





    //
    //
    //
    //
    //
    // // let options = [];
    // // we need to determine if this is normal select options or entity refs
    // let defaultSelect = true;
    // // set value key, defaulted to value
    const valueKey = (field['#value_key']) ? field['#value_key'] : 'value';
    //
    // for (const [value, label] of Object.entries(field['#options'])) {
    //   if (typeof label === "string") {
    //     options.push(<Picker.Item
    //             key={value}
    //             label={label}
    //             value={value}
    //         />
    //     );
    //   } else {
    //     defaultSelect = false;
    //     for (const [v, l] of Object.entries(label)) {
    //       if (typeof l === "string") {
    //         options.push(<Picker.Item
    //                 key={v}
    //                 label={l}
    //                 value={v}
    //             />
    //         );
    //       }
    //     }
    //   }
    // }
    //

    let selectedValue = '';

    if (typeof this.props.formValues[this.props.fieldName] !== 'undefined' &&
        typeof this.props.formValues[this.props.fieldName]['und'][0] !== 'undefined') {
      selectedValue = this.props.formValues[this.props.fieldName]['und'][0][valueKey];
      // Get the key for the selected values
    }


    return <View>
      <Text>{field['#title']}</Text>
      <Picker
          style={{height: 250, width: 'auto'}}
          onValueChange={(text) => this.props.setFormValue(this.props.fieldName, text)}
          selectedValue={selectedValue}
      >
        {parentPickerOptions}
      </Picker>
    </View>;
  }
}