import React from 'react';
import DatePicker from 'react-native-datepicker'
import {StyleSheet, Text, View} from "react-native";
import * as Colors from "../../constants/Colors";
import FieldDescription from "./FieldDescription";

export default class Date extends React.Component {
  constructor(props) {
    super(props);
    this.state = {date: "2016-05-18"}
  }

  componentDidMount() {
    // Set initial date in case it's not changed
    this.props.setFormValue(this.props.fieldName, this.state.date, this.props.fieldType);
  }

  render() {
    let error = null;
    let formErrorString = null;
    const field = this.props.field;
    let lang = 'und';

    if (this.props.formValues[this.props.fieldName]) {
      lang = Object.keys(this.props.formValues[this.props.fieldName])[0];
    }

    const fieldName = this.props.fieldName;
    if (this.props.formErrors) {
      if (fieldName) {
        formErrorString = fieldName + '][' + lang;
        if (this.props.formErrors[formErrorString]) {
          error = this.props.formErrors[formErrorString].replace(/<[^>]*>?/gm, '');
        }
      }
    }

    let titleTextStyle = styles.titleTextStyle;
    let textfieldStyle = styles.textfieldStyle;
    let errorTextStyle = styles.errorTextStyle;
    if (error) {
      titleTextStyle = styles.titleTextStyleError;
      textfieldStyle = styles.textfieldStyleError;
      errorTextStyle = styles.errorTextStyleError;
    }

    let errorMarkup = [];
    if (error) {
      errorMarkup = <Text style={errorTextStyle}>{error}</Text>;
    }

    return (
      <View>
        <Text style={titleTextStyle}>{field['#title']}</Text>
        {errorMarkup}
        <FieldDescription description={(this.props.description) ? this.props.description : null} />
        <DatePicker
          style={{width: 200}}
          date={this.state.date}
          mode="date"
          placeholder="select date"
          format="YYYY-MM-DD"
          minDate="2016-05-01"
          maxDate="2016-06-01"
          confirmBtnText="Confirm"
          cancelBtnText="Cancel"
          customStyles={{
            dateIcon: {
              position: 'absolute',
              left: 0,
              top: 4,
              marginLeft: 0
            },
            dateInput: {
              marginLeft: 36
            }
            // ... You can check the source to find the other keys.
          }}
          onDateChange={(date) => {
            this.setState({date: date});
            // newFieldName, newValue, valueKey
            this.props.setFormValue(this.props.fieldName, date, this.props.fieldType, lang, error);
          }
          }
        />
      </View>
    )
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
  textfieldStyle: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1
  },
  textfieldStyleError: {
    height: 40,
    borderWidth: 1,
    borderRadius: 1,
    borderColor: Colors.default.errorBackground
  }
});