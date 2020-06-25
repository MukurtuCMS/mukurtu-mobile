import React from 'react';
import {Picker, View, Text, StyleSheet} from 'react-native';
import Required from "./Required";
import {getFieldLanguage} from "./formUtils";
import _ from 'lodash';
import RNPickerSelect from "react-native-picker-select";
import {FontAwesome} from "@expo/vector-icons";
import * as Colors from "../../constants/Colors";


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

    let childPlaceholder = {
      label: 'Select',
      value: '0',
      color: '#9EA0A4',
    };
    let childPickerOptions = [];

    for (const [value, label] of Object.entries(field['#options'])) {
      if (typeof label === "string") {
        childPickerOptions.push({
          key: value,
          label: label,
          value: value
        });
      } else {
        defaultSelect = false;
        for (const [v, l] of Object.entries(label)) {
          if (typeof l === "string") {
            childPickerOptions.push({
              key: v,
              label: l,
              value: v
            });
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
      <Text style={styles.titleTextStyle}>{field['#title']}</Text>
      <Required required={this.props.required}/>
      <RNPickerSelect
        placeholder={childPlaceholder}
        placeholderTextColor="#FFF"
        items={childPickerOptions}
        onValueChange={(text) => this.props.setFormValue(this.props.fieldName, text, valueKey)}
        style={pickerSelectStyles}
        value={selectedValue}
        Icon={() => {
          return <FontAwesome
            name="chevron-down" size={25}
            style={styles.pickerIcon}/>;
        }}
      />
    </View>;
  }
}


const styles = StyleSheet.create({
  viewStyle: {
    marginBottom: 15,
  },
  titleTextStyle: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold'
  },
  pickerIcon: {
    color: Colors.default.tabIconDefault,
    fontSize: 24,
    right: 10,
    top: 10
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 4,
    color: '#FFF',
    paddingRight: 30, // to ensure the text is never behind the icon
    backgroundColor: Colors.default.primary,
    marginBottom: 10,
    textTransform: 'uppercase'
  },
  inputAndroid: {
    fontSize: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 0.5,
    borderRadius: 8,
    color: '#FFF',
    paddingRight: 30, // to ensure the text is never behind the icon
    backgroundColor: Colors.default.primary,
    marginBottom: 10,
    textTransform: 'uppercase'
  },
  buttonContainer: {
    flexWrap: 'wrap',
    flex: 1,
    flexDirection: 'column',
    height: 'auto',
    padding: 0,
    marginLeft: -10,
    marginRight: -10,
    width: 'auto',
  },
  buttonStyle: {
    flex: 1,
    padding: 10,
    backgroundColor: Colors.default.primary,
    marginBottom: 10,
    color: '#FFF',
    fontSize: 16,
  },
});
