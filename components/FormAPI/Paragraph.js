import React from 'react';
import {View, Text} from 'react-native';
import {CheckBox} from "react-native-elements";

export default class Paragraph extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      checked: this.props.field['#default_value'] === 1
    };

  }

  render() {

    let debugProps = this.props;

    let paragraphForm = [];

    paragraphForm.push(<Text>Test Paragraph Form</Text>);

    return <View>
      {paragraphForm}

    </View>;
  }
}