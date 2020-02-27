import React from 'react';
import {Picker, View, Text, StyleSheet} from 'react-native';
import {CheckBox} from "react-native-elements";
import Required from "./Required";
import RNPickerSelect from "react-native-picker-select";
import {getFieldLanguage} from "./formUtils";
import _ from 'lodash';


export default class Select extends React.Component {

  componentDidMount() {
    const {field, formValues, setFormValue, fieldName} = this.props;
    const valueKey = (field['#value_key']) ? field['#value_key'] : 'value';
    const lang = getFieldLanguage(formValues[fieldName]);
    if (!_.has(formValues, [fieldName, lang]) && field['#default_value'].length > 0) {
      setFormValue(fieldName, field['#default_value'][0], valueKey);
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

    const fieldValue = this.props.formValues[this.props.fieldName];

    if (typeof fieldValue !== 'undefined' && typeof fieldValue['und'] !== 'undefined') {
      if (fieldValue['und'][0] !== undefined) {
        selectedValue = fieldValue['und'][0][valueKey];
      }
      else {
        selectedValue = fieldValue['und'][valueKey];
      }
    }


    return <View style={styles.viewStyle}>
      <Text>{field['#title']}</Text>
      <Required required={this.props.required}/>
      <Picker
          style={{height: 216, width: 'auto', borderColor: '#ccc', borderWidth: 1}}
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
