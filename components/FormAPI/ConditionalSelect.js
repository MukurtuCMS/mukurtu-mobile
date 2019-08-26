import React from 'react';
import {Picker, View, Text, Platform, StyleSheet} from 'react-native';
import FieldDescription from "./FieldDescription";
import Required from "./Required";
import * as Colors from "../../constants/Colors";

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


  render() {

    const field = this.props.field;

    let options = field['#options'];

    let parentPickerOptions = [];
    parentPickerOptions.push(<Picker.Item
            key='0'
            label='Select'
            value='0'
        />
    );

    for (let key in options) {
      if (options.hasOwnProperty(key)) {
        // Create the option for the parent picker
        parentPickerOptions.push(<Picker.Item
                key={key}
                label={key}
                value={key}
            />
        );
      }
    }


    let childPicker;
    if (options[this.state.parentValue] !== undefined && options[this.state.parentValue] !== 0) {
      let currentOptions = options[this.state.parentValue];
      let childPickerOptions = [];
      childPickerOptions.push(<Picker.Item
              key='0'
              label='Select'
              value='0'
          />
      );

      for (let [childKey, value] of Object.entries(currentOptions)) {

        childPickerOptions.push(
            <Picker.Item
                key={childKey}
                label={value}
                value={childKey}
            />);
      }


      childPicker = <Picker
          style={(Platform.OS === 'ios') ? styles.selectListIOS : styles.selectListAndroid}
          onValueChange={(itemValue, itemIndex, childKey) => {
            this.setState({
              childValue: itemValue
            }, () => {
              this.props.setFormValue(this.props.fieldName, this.state.childValue);
            });
          }
          }
          selectedValue={this.state.childValue}
      >
        {childPickerOptions}
      </Picker>;
    }



    return <View>
      <Text>{field['#title']}</Text>
      <FieldDescription description={(this.props.description) ? this.props.description : null} />
      <Required required={this.props.required}/>
      <Picker
          style={(Platform.OS === 'ios') ? styles.selectListIOS : styles.selectListAndroid}
          // onValueChange={(val) => this.props.setFormValue(this.props.fieldName, val)}
          onValueChange={(itemValue, itemIndex) => {
              this.setState({parentValue: itemValue}, ()=> {
              })
          }
          }
          selectedValue={this.state.parentValue}
      >
        {parentPickerOptions}
      </Picker>
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
    height: 100,
    width: 'auto'
  }
});
