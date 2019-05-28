import React from 'react';
import {View, Text} from 'react-native';
import {CheckBox} from "react-native-elements";

export default class Checkbox extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      checked: this.props.field['#default_value'] === 1
    };

  }

  render() {


    const field = this.props.field;
    const valueKey = (field['#value_key']) ? field['#value_key'] : 'value';

    return <View>
      <CheckBox
          title={field['#title']}
          checked={this.state.checked}
          onPress={() => {
            this.setState({
              checked: !this.state.checked
            }, () => {
              this.props.setFormValue(this.props.fieldName, this.state.checked, valueKey);
            });
          }
          }
      />
    </View>;
  }
}