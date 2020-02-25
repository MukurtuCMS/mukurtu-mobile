import React from 'react';
import {Picker, View, Text, Platform, StyleSheet} from 'react-native';
import FieldDescription from "./FieldDescription";
import Required from "./Required";
import * as Colors from "../../constants/Colors";
import RNPickerSelect from "react-native-picker-select";
import {FontAwesome} from "@expo/vector-icons";
import {getAllFieldValues} from "./formUtils";
import _ from "lodash";
import {Button} from "react-native-elements";

export default class ConditionalSelect extends React.Component {


  constructor(props) {
    super(props);

    this.state = {
      parentOptions: [],
      parentValues: {},
      childValues: [],
      addItem: 0
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    // if (!prevProps.nodeLoaded && this.props.nodeLoaded) {
    //   this.loadData()
    // }
  }

  loadData = () => {
    const options = _.get(this.props.field, ['#options'], []);
    let parentPickerOptions = [];
    for (let key in options) {
      // Create the option for the parent picker
      parentPickerOptions.push({
          key: key,
          label: key,
          value: key
        }
      );
    }

    // const fieldValues = getAllFieldValues(this.props.formValues[this.props.fieldName]);

    // this.setState({
    //   parentOptions: parentPickerOptions,
    //   items: fieldValues != null ? fieldValues.length : 1
    // });
  };

  getParentVid(name) {
    for (let key in this.props.nodes) {
      if (this.props.nodes.hasOwnProperty(key)) {
        if (this.props.nodes[key].title === name) {
          return key;
        }
      }
    }
  }

  onAdd = (i) => {
    const {field, setFormValue, fieldName} = this.props;
    const valueKey = (field['#value_key']) ? field['#value_key'] : 'value';
    setFormValue(fieldName, null, i, valueKey);
  };

  render() {

    const field = this.props.field;
    const valueKey = (field['#value_key']) ? field['#value_key'] : 'value';
    // const fieldValues = getAllFieldValues(this.props.formValues[this.props.fieldName]);
    const fieldValues = _.get(this.props.formValues, [this.props.fieldName, 'und'], []);

    let options = field['#options'];
    if (Object.keys(field['#options']).length === 0) {
      return null;
    }

    let parentPickerOptions = [];
    for (let key in options) {
      // Create the option for the parent picker
      parentPickerOptions.push({
          key: key,
          label: key,
          value: key
        }
      );
    }

    let parentPlaceholder = {
      label: 'Select',
      value: '0',
      color: '#9EA0A4',
    };

    let renderedPickers = [];


    let numItems = fieldValues != null ? Object.keys(fieldValues).length : 0;
    let showButton = numItems > 0;
    numItems = numItems > 0 ? numItems : 1;
    // console.log({numItems});
    // numItems = numItems + this.state.addItem;

    for (let i = 0; i < numItems; i++) {

      const selectedVal = _.get(fieldValues, [i, valueKey], null);
      let parentVal = _.get(this.state.parentValues, [i], "0");

      //
      for (let key in options) {
        if (options.hasOwnProperty(key)) {
          if (selectedVal != null && options[key][selectedVal] != null) {
            parentVal = key
          }
        }
      }

      let childPicker;

      if (parentVal !== '0') {
        let currentOptions = options[parentVal];
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

            items={childPickerOptions}
            onValueChange={(itemValue) => {
              this.props.setFormValue(this.props.fieldName, itemValue, i, valueKey);
            }}
            style={pickerSelectStyles}
            value={selectedVal}
            Icon={() => {
              return <FontAwesome name="chevron-down" size={25} style={styles.pickerIcon}/>;
            }}
          />
        }
      }

      renderedPickers.push(
        <View key={`cond-picker-${i}`}>
          <Text>{field['#title']} #{i+1}</Text>
          <RNPickerSelect
            placeholder={parentPlaceholder}
            items={parentPickerOptions}
            onValueChange={(itemValue) => {
              // this.props.setFormValue(this.props.fieldName, 0, i, valueKey);
              const newParentValues = {[i]: itemValue};
              this.setState({
                parentValues: {
                  ...this.state.parentValues,
                  ...newParentValues
                }
              });
            }}
            style={pickerSelectStyles}
            value={parentVal}
            Icon={() => {
              return <FontAwesome name="chevron-down" size={25}
                                  style={styles.pickerIcon}/>;
            }}
          />
          {childPicker}
        </View>
      );
    }

    return <View style={styles.viewStyle}>
      <Text style={styles.titleTextStyle}>{field['#title']}</Text>
      <FieldDescription description={(this.props.description) ? this.props.description : null}/>
      <Required required={this.props.required}/>

      {renderedPickers}

      {field['#multiple'] && showButton && <Button title={`Add ${field['#title']}`} onPress={() => this.onAdd(numItems)}/>}

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
