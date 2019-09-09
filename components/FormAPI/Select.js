import React from 'react';
import {Picker, View, Text, StyleSheet} from 'react-native';
import {CheckBox} from "react-native-elements";
import Required from "./Required";

export default class Select extends React.Component {

  componentDidMount() {
    const field = this.props.field;
    const valueKey = (field['#value_key']) ? field['#value_key'] : 'value';

    if (field['#default_value'].length > 0) {
      this.props.setFormValue(this.props.fieldName, field['#default_value'][0], valueKey);
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


    let selectedValue = '';

    if (typeof this.props.formValues[this.props.fieldName] !== 'undefined' &&
        typeof this.props.formValues[this.props.fieldName]['und'] !== 'undefined') {
      selectedValue = this.props.formValues[this.props.fieldName]['und'][valueKey];
      // Get the key for the selected values
    }


    return <View style={styles.viewStyle}>
      <Text>{field['#title']}</Text>
      <Required required={this.props.required}/>
      <Picker
          style={{height: 250, width: 'auto'}}
          onValueChange={(text) => this.props.setFormValue(this.props.fieldName, text, valueKey)}
          selectedValue={selectedValue}
      >
        {options}
      </Picker>
    </View>;
  }
}


const styles = StyleSheet.create({
  viewStyle: {
    marginBottom: 15,
  }
});