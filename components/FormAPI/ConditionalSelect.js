import React from 'react';
import {Picker, View, Text, Platform, StyleSheet} from 'react-native';
import FieldDescription from "./FieldDescription";
import Required from "./Required";
import * as Colors from "../../constants/Colors";
import RNPickerSelect from "react-native-picker-select";
import {FontAwesome} from "@expo/vector-icons";

export default class ConditionalSelect extends React.Component {


  constructor(props) {
    super(props);

    // See if we already have a child value
    let childValue = null;
    let parentValue = 0;
    if (typeof props.formValues['oggroup_fieldset'] !== 'undefined' &&
      typeof props.formValues['oggroup_fieldset'][0]['dropdown_second']['target_id'] !== 'undefined') {
      childValue = this.props.formValues['oggroup_fieldset'][0]['dropdown_second']['target_id'];
      // If we have a child value, set the appropriate parent parent value
      for (let [key, value] of Object.entries(props.field['#options'])) {
        if (value.hasOwnProperty(childValue)) {
          parentValue = key;
        }
      }
    }

    this.state = {
      parentValue: parentValue,
      childValue: childValue,
    }
  }

  getParentVid(name) {
    for (let key in this.props.nodes) {
      if (this.props.nodes.hasOwnProperty(key)) {
        if (this.props.nodes[key].title === name) {
          return key;
        }
      }
    }
  }


  render() {

    const field = this.props.field;

    let options = field['#options'];
    if (Object.keys(field['#options']).length === 0) {
      return null;
    }

    let parentPickerOptions = [];
    let parentPlaceholder = {
      label: 'Select',
      value: '0',
      color: '#9EA0A4',
    };


    for (let key in options) {
      if (options.hasOwnProperty(key)) {
        // Create the option for the parent picker
        parentPickerOptions.push({
            key: key,
            label: key,
            value: key
          }
        );
      }
    }


    let childPicker;
    if (options[this.state.parentValue] !== undefined && options[this.state.parentValue] !== 0) {
      let currentOptions = options[this.state.parentValue];
      let childPickerOptions = [];
      if (Object.keys(currentOptions).length > 0) {

        let childPlaceholder = {
          label: 'Select',
          value: '0',
          color: '#9EA0A4',
        };

        for (let [childKey, value] of Object.entries(currentOptions)) {
          childPickerOptions.push({
            key: value,
            label: value,
            value: childKey
          });
        }


        childPicker = <RNPickerSelect
          placeholder={childPlaceholder}
          // key={0}
          items={childPickerOptions}
          onValueChange={(itemValue, itemIndex, childKey) => {
            this.setState({
              childValue: itemValue
            }, () => {
              // For this component we need the title as the parentValue state, but form submit needs the ID
              let parentVal = this.getParentVid(this.state.parentValue);
              this.props.setFormValue(this.props.fieldName, this.state.childValue, parentVal);
            });
          }
          }
          style={pickerSelectStyles}
          value={this.state.childValue}
          Icon={() => {
            return <FontAwesome name="chevron-down" size={25} style={styles.pickerIcon}/>;
          }}
        />

      }
    }


    return <View style={styles.viewStyle}>
      <Text style={styles.titleTextStyle}>{field['#title']}</Text>
      <FieldDescription description={(this.props.description) ? this.props.description : null}/>
      <Required required={this.props.required}/>

      <RNPickerSelect
        placeholder={parentPlaceholder}
        // key={0}
        items={parentPickerOptions}
        onValueChange={(itemValue, itemIndex) => {
          this.setState({parentValue: itemValue}, () => {
          })
        }
        }
        style={pickerSelectStyles}
        value={this.state.parentValue}
        Icon={() => {
          return <FontAwesome name="chevron-down" size={25} style={styles.pickerIcon}/>;
        }}
      />

      {childPicker}
    </View>;
  }
}

var styles = StyleSheet.create({
  selectListAndroid: {
    height: 60,
    borderWidth: 1,
    borderColor: Colors.default.mediumGray,
    borderRadius: 5,
    backgroundColor: '#FFF',
    marginBottom: 10,
    padding: 8,
    fontSize: 20,
    width: 'auto'
  },
  selectListIOS: {
    height: 60,
    width: 'auto',
    padding: 0,
    marginTop: 0,
  },
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
