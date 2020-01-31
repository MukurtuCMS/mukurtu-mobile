import React from 'react';
import DatePicker from 'react-native-datepicker'
import {StyleSheet, Text, View} from "react-native";
import * as Colors from "../../constants/Colors";
import FieldDescription from "./FieldDescription";
import Required from "./Required";
import ErrorMessage from "./ErrorMessage";
import { Appearance, useColorScheme } from 'react-native-appearance';
import {getFirstFieldValue} from "./formUtils";

export default class DatePick extends React.Component {
  constructor(props) {
    super(props);
    // Temp date until component mounts
    // this.state = {'date': '2019-09-05'}
    this.state = {'dateChanged': false}
  }

  componentDidMount() {
    // Set initial date in case it's not changed
    // let today = this.getTodayFormatted();
    // this.setState({'date': today}, () => {
      // Ensure we're setting this to form state in case the value isn't changed
      // this.props.setFormValue(this.props.fieldName, this.state.date, this.props.fieldType);
    // })
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (!this.state.dateChanged) {
      const propCheck = prevProps.formValues[prevProps.fieldName] !== this.props.formValues[this.props.fieldName];
      const date = this.extractDateValue();
      if (propCheck && date.length > 0) {
        this.setState({'dateChanged': true});
        this.props.setFormValue(this.props.fieldName, date, this.props.fieldType);
      }
    }
  }

  getTodayFormatted() {

    let today = new Date();
    let dd = today.getDate();
    let mm = today.getMonth() + 1; //January is 0!
    let yyyy = today.getFullYear();
    if (dd < 10) {
      dd = '0' + dd;
    }
    if (mm < 10) {
      mm = '0' + mm;
    }
    return [yyyy, mm, dd].join('-');
  }

  extractDateValue() {
    let date = '';
    const fieldVal = getFirstFieldValue(this.props.formValues[this.props.fieldName]);
    if (fieldVal && (fieldVal.value || fieldVal.from)) {
      if (fieldVal.from) {
        date = `${fieldVal.from.year}-${fieldVal.from.month}-${fieldVal.from.day}`;
      }

      else if(fieldVal.value.date !== undefined) {
        const parts = fieldVal.value.date.split('/');
        date = `${parts[0]}-${parts[1]}-${parts[2]}`
      }
      else {
        date = fieldVal.value.split(' ')[0];
      }
    }
    else if (this.props.isNew && this.props.required) {
      date = this.getTodayFormatted();
    }

    return date;
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

    let errorMarkup = <ErrorMessage error={error} />;

    const colorScheme = Appearance.getColorScheme();

    let date = this.extractDateValue();

    return (
      <View style={styles.viewStyle}>
        <Text style={titleTextStyle}>{field['#title']}</Text>
        {errorMarkup}
        <FieldDescription description={(this.props.description) ? this.props.description : null}/>
        <Required required={this.props.required}/>
        <DatePicker
          date={date}
          style={styles.datePicker}
          mode="date"
          placeholder="select date"
          format="YYYY-MM-DD"
          minDate="1900-01-01"
          maxDate="2100-12-31"
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
            },
            datePicker: {
              backgroundColor: colorScheme === 'dark' ? '#222' : 'white'
            },
            datePickerCon: {
              backgroundColor: colorScheme === 'dark' ? '#333' : 'white'
            }
            // ... You can check the source to find the other keys.
          }}
          onDateChange={(date) => {
            this.setState({'dateChanged': false});
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
  },
  datePicker: {
    width: 200,
    height: 60,
    paddingTop: 15
  },
  viewStyle: {
    marginBottom: 15,
  }
});
