import React from 'react';
import {Picker, View, Text} from 'react-native';
import {CheckBox} from "react-native-elements";

export default class ConditionalSelect extends React.Component {


  constructor(props) {
    super(props);
    this.state = {
      parentValue: 0,
      childValue: null,
    }
  }

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
    // "#options": Object {
    //   "Test Community 1": Object {
    //     "3": "Test Community 1 Community Only",
    //         "4": "Test Protocol 1",
    //   },
    // },

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
      for (let [childKey, value] of Object.entries(currentOptions)) {

        childPickerOptions.push(
            <Picker.Item
                key={childKey}
                label={value}
                value={childKey}
            />);
      }


      childPicker = <Picker
          style={{height: 250, width: 'auto'}}
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



    // const valueKey = (field['#value_key']) ? field['#value_key'] : 'value';


    // let selectedValue = '';
    //
    // if (typeof this.props.formValues[this.props.fieldName] !== 'undefined' &&
    //     typeof this.props.formValues[this.props.fieldName]['und'][0] !== 'undefined') {
    //   selectedValue = this.props.formValues[this.props.fieldName]['und'][0][valueKey];
    //   // Get the key for the selected values
    // }


    return <View>
      <Text>{field['#title']}</Text>
      <Picker
          style={{height: 250, width: 'auto'}}
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
