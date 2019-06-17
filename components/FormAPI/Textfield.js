import React from 'react';
import {TextInput, View, Text} from 'react-native';
import {Button} from "react-native-elements";

export default class Textfield extends React.Component {


  constructor(props) {
    super(props);
    this.state = {
      numberOfFields: 1
    };

  }

  addField() {
    let currentIndex = this.state.numberOfFields;
    this.setState({numberOfFields: currentIndex + 1}, () => {
    })

  }

  removeField() {
    let currentIndex = this.state.numberOfFields;
    this.setState({numberOfFields: currentIndex - 1});
  }


  render() {
    const field = this.props.field;
    const valueKey = (field['#value_key']) ? field['#value_key'] : 'value';
    let value = '';
    if (this.props.fieldName === 'title' && this.props.formValues[this.props.fieldName] !== undefined) {
      if (this.props.formValues[this.props.fieldName].length > 0) {
        value = this.props.formValues[this.props.fieldName];
      }
    } else if (typeof this.props.formValues[this.props.fieldName] !== 'undefined') {
      // set the language key as initial key
      const initialKey = Object.keys(this.props.formValues[this.props.fieldName])[0];
      value = this.props.formValues[this.props.fieldName][initialKey][0][valueKey];
    } else if (typeof this.props.formValues[this.props.index] !== 'undefined' && typeof this.props.formValues[this.props.index]['und'][this.props.fieldName] !== 'undefined') {
      // Check for field within paragraph
      // const initialKey = Object.keys(this.props.formValues[this.props.index]['und'][this.props.fieldName])[0];
      value = this.props.formValues[this.props.index]['und'][this.props.fieldName][0][valueKey];
    }
    let title = field['#title'];
    if (this.props.title) {
      title = this.props.title;
    }

    let moreButton = null;
    if (this.props.cardinality === -1) {
      moreButton = <Button
          title='Add Another'
          onPress={this.addField.bind(this)}
      />
    }

    let textInputs = [];
    for (let i = 0; i < this.state.numberOfFields; i++) {

      textInputs[i] = <TextInput
          style={{height: 40, borderColor: 'gray', borderWidth: 1}}
          onChangeText={(text) => this.props.setFormValue(this.props.fieldName, text, valueKey, this.props.index, i)}
          value={value}
          // defaultValue={field['#default_value']}
          maxLength={field['#maxlength']}
      />;
    }


    let removeButton = null;
    if (this.state.numberOfFields > 1) {
      removeButton = <Button
          title='Remove'
          onPress={this.removeField.bind(this)}
      />
    }

    return <View>
      <Text>{title}</Text>
      {textInputs}
      {removeButton}
      {moreButton}
    </View>;
  }
}