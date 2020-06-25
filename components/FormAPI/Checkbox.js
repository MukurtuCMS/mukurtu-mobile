import React from 'react';
import {View, StyleSheet} from 'react-native';
import {CheckBox} from "react-native-elements";
import * as Colors from "../../constants/Colors";
import FieldDescription from "./FieldDescription";
import Required from "./Required";
import ErrorMessage from "./ErrorMessage";
import {getFirstFieldValue} from "./formUtils";
import HTML from "react-native-render-html";

export default class Checkbox extends React.Component {

  constructor(props) {
    super(props);
    // this.state = {
    //   checked: this.props.field['#default_value'] === 1
    // };

  }

  determineCheckedState() {
    const fieldVal = getFirstFieldValue(this.props.formValues[this.props.fieldName]);
    if (fieldVal && fieldVal.value) {
      return !!parseInt(fieldVal.value);
    }
    else {
      return false;
    }
  }


  render() {
    let error = null;
    let formErrorString = null;

    const fieldName = this.props.fieldName;
    if (this.props.formErrors) {
      let fieldLang = 'und';
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

    let errorMarkup = <ErrorMessage error={error} />;

    const isChecked = this.determineCheckedState();

    const title = <View style={{marginLeft: 10}}><HTML html={field['#title']} /></View>;

    return <View style={styles.viewStyle}>
      {errorMarkup}
      <FieldDescription description={(this.props.description) ? this.props.description : null} />
      <Required required={this.props.required}/>
      <CheckBox
        title={title}
        checked={isChecked}
        containerStyle={checkboxStyle}
        iconType='material'
        checkedIcon='check-box'
        uncheckedIcon='check-box-outline-blank'
        checkedColor={Colors.default.gold}
        textStyle={styles.textStyle}
        onPress={() => {
          this.props.setFormValue(this.props.fieldName, !isChecked, valueKey, formErrorString);
          //   this.setState({
          //     checked: !this.state.checked
          //
          // }, () => {
          //     this.props.setFormValue(this.props.fieldName,
          // this.state.checked, valueKey, formErrorString); });
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
    fontSize: 18,
    fontWeight: 'bold'
  },
  errorTextStyle: {
    color: '#000'
  },
  errorTextStyleError: {
    color: Colors.default.errorBackground,
    fontSize: 18,
    marginBottom: 10
  },
  checkboxStyle: {
    borderRadius: 0,
    backgroundColor: '#FFF',
    borderColor: 'transparent',
    padding: 0,
    marginBottom: 5
  },
  checkboxStyleError: {
    borderRadius: 1,
    borderColor: Colors.default.errorBackground,
    fontSize: 18,
    backgroundColor: '#FFF',
    padding: 0,
    marginBottom: 5
  },
  textStyle: {
    fontWeight: 'normal',
    fontSize: 14,
    color: '#464646'
  },
  viewStyle: {
    marginBottom: 15,
  }
});
