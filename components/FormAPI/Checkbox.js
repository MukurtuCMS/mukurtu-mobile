import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {CheckBox} from "react-native-elements";
import * as Colors from "../../constants/Colors";
import FieldDescription from "./FieldDescription";

export default class Checkbox extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      checked: this.props.field['#default_value'] === 1
    };

  }

  render() {
    let error = null;
    let formErrorString = null;

    const fieldName = this.props.fieldName;
    if (this.props.formErrors) {
      const fieldLang = Object.keys(this.props.formValues[this.props.fieldName])[0];
      if (fieldName && fieldLang) {
        formErrorString = fieldName + '][' + fieldLang;
        if (this.props.formErrors[formErrorString]) {
          error = this.props.formErrors[formErrorString]
        }
      }
    }

    let titleTextStyle = styles.titleTextStyle;
    let errorTextStyle = styles.errorTextStyle;
    let checkboxStyle = styles.checkboxStyle;
    if (error) {
      titleTextStyle = styles.titleTextStyleError;
      errorTextStyle = styles.errorTextStyleError;
      checkboxStyle = styles.checkboxStyleError;
    }


    const field = this.props.field;
    const valueKey = (field['#value_key']) ? field['#value_key'] : 'value';

    let errorMarkup = [];
    if (error) {
      errorMarkup = <Text style={errorTextStyle}>{error}</Text>;
    }

    return <View>
      {errorMarkup}
      <FieldDescription description={(this.props.description) ? this.props.description : null} />
      <CheckBox
          title={field['#title']}
          checked={this.state.checked}
          containerStyle={checkboxStyle}
          onPress={() => {
            this.setState({
              checked: !this.state.checked
            }, () => {
              this.props.setFormValue(this.props.fieldName, this.state.checked, valueKey, formErrorString);
            });
          }
          }
      />
    </View>;
  }
}

const styles = StyleSheet.create({
  titleTextStyle: {
    color: '#000',
    fontSize: 20,
    fontWeight: 'bold'
  },
  titleTextStyleError: {
    color: Colors.default.errorBackground,
    fontSize: 20,
    fontWeight: 'bold'
  },
  errorTextStyle: {
    color: '#000'
  },
  errorTextStyleError: {
    color: Colors.default.errorBackground,
    marginBottom: 10
  },
  checkboxStyle: {
    borderRadius: 0,
  },
  checkboxStyleError: {
    borderRadius: 1,
    borderColor: Colors.default.errorBackground
  }
});