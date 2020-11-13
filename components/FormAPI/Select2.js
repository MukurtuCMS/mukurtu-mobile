import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TouchableHighlight
} from 'react-native';
import Autocomplete from 'react-native-autocomplete-input';
import * as Colors from "../../constants/Colors";
import FieldDescription from "./FieldDescription";
import Required from "./Required";
import ErrorMessage from "./ErrorMessage";
import {getFieldLanguage, getFieldValueCount} from "./formUtils";
import {FontAwesome} from "@expo/vector-icons";

export default class Select2 extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      q: '',
      query: {},
      count: 1,
      heightReset: true,
      // Allows us to close autocomplete suggestions for each autocomplete field on selection
      hideResults: true,
      autocompleteSelected: {
        0: true
      }
    };
  }

  findFilm(query, options) {
    if (query === '') {
      return [];
    }

    const regex = new RegExp(`${query}`, 'i');
    return options.filter(option => option.text.search(regex) >= 0);
  }


  /**
   * Ensures that the correct autocomplete field is open/closed at right time
   * @param index
   * @param boolean
   */
  updateAutocomplete(index, boolean) {
    let currentAutocompleteState = this.state.autocompleteSelected;
    currentAutocompleteState[index] = boolean;
    this.setState({
      autocompleteSelected: currentAutocompleteState
    })
  }

  submitChanges = (value, index, options) => {
    const {field, formValues, fieldName, setFormValue, parentIndex} = this.props;
    const valueKey = (field['#value_key']) ? field['#value_key'] : 'value';
    const lang = getFieldLanguage(formValues[fieldName]);

    if (parentIndex !== undefined) {
      setFormValue(fieldName, value, valueKey, lang, options, index, parentIndex);
    }
    else {
      setFormValue(fieldName, value, valueKey, lang, options, index);
    }
  };

  onRemoveSelected = (index) => {
    // const valueKey = (this.props.field['#value_key']) ? this.props.field['#value_key'] : 'value';
    // const lang = getFieldLanguage(this.props.formValues[this.props.fieldName]);
    // this.props.setFormValue(this.props.fieldName, '', valueKey, lang, [], index);
    this.submitChanges('', index, []);
  };

  getOptions = () => {
    const field = this.props.field;
    if (field['#select2']['data'] != null) {
      return field['#select2']['data'];
    }
    else if(field['#options'] != null && typeof field['#options'] === "object" ) {
      return Object.keys(field['#options']).reduce(function(newOptions, key) {
        newOptions.push({id: key, text: field['#options'][key]});
        return newOptions;
      }, []);
    }
    else {
      return [];
    }
  };


  render() {
    let error = null;
    let formErrorString = null;
    let lang = 'und';

    if (this.props.formValues[this.props.fieldName]) {
      lang = Object.keys(this.props.formValues[this.props.fieldName])[0];
    }

    const fieldName = this.props.fieldName;
    if (this.props.formErrors) {
      if (fieldName) {
        formErrorString = fieldName + '][' + lang;
        if (this.props.formErrors[formErrorString]) {
          error = this.props.formErrors[formErrorString]
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

    const field = this.props.field;
    const options = this.getOptions();
    // we need to determine if this is normal select options or entity refs
    let defaultSelect = true;
    // set value key, defaulted to value
    const valueKey = (field['#value_key']) ? field['#value_key'] : 'value';

    let autocompleteFields = [];
    let selectedFields = [];

    let fieldValuesCount = getFieldValueCount(this.props.formValues[this.props.fieldName]);
    const nKey = fieldValuesCount;

    // if (this.state.count > fieldValuesCount) {
    //   fieldValuesCount = this.state.count;
    // }

    let height = 40 * fieldValuesCount;

    // const selectedFields = getAllFieldValues(this.props.formValues[this.props.fieldName]);

    const placeholder = 'Enter ' + field['#title'];

    for (let i = 0; i < fieldValuesCount; i++) {
      const key = i;
      let query = '';
      if(this.state.query && this.state.query[i]) {
        query = this.state.query[i];
      }
      if (this.props.formValues[this.props.fieldName] !== undefined) {
        // set the language key as initial key
        if (lang !== undefined && typeof this.props.formValues[this.props.fieldName][lang][key] !== 'undefined') {
          // this is our lookup id, we need to find the text value for the id
          const lookupId = this.props.formValues[this.props.fieldName][lang][key];
          const id = typeof lookupId === "object" ? lookupId[valueKey] : lookupId;

          let term = '';
          for (let j = 0; j < options.length; j++) {
            if (options[j].id == id) {
              term = options[j].text;
            }
          }
          if (term.length > 0) {
            query = term;
          }
        } else {
          const lang = 'und';
        }
      }



      // We store the option ID for Drupal purposes, but need to set value to the text for React Purposes
      let defaultValue = query;
      let selected = options.filter(function(option) {
        return option.id === query;
      });
      if(selected.length !== 0) {
        defaultValue = selected[0].text;
      }

      selectedFields.push(<View key={i} style={styles.selectedFields}>
        <Text style={styles.selectedText}>{defaultValue}</Text>
        <TouchableHighlight
          onPress={() => {
            this.onRemoveSelected(key, valueKey);
          }}>
          <FontAwesome name="close" size={20} style={styles.removeSelected}/>
        </TouchableHighlight>
      </View>
      );

      const sortedOptions = this.findFilm(query, options);
      const comp = (a, b) => a.toLowerCase().trim() === b.toLowerCase().trim();
      const placeholder = 'Enter ' + field['#title'];


      const hideResults = this.state.autocompleteSelected[key] !== undefined ? this.state.autocompleteSelected[key] : true;

      autocompleteFields.push(
        <Autocomplete
          // flatListProps={{ nestedScrollEnabled: true, }}
          containerStyle={styles.textfieldContainerStyle}
          inputContainerStyle={styles.textfieldStyle}
          key={`ac-${i}`}
          autoCapitalize="none"
          autoCorrect={false}
          // listContainerStyle={styles.autocomplete_list_container}
          data={sortedOptions}
          defaultValue={defaultValue}
          // style={styles.autocompleteContainers}
          onChangeText={(text) => {
            // this.props.setFormValue(this.props.fieldName, text, valueKey, lang, options, i);
            let currentQuery = this.state.query;
            currentQuery[i] = text;
            this.updateAutocomplete(key, false);
            this.setState({
              'query': currentQuery,
              'heightReset': false
            })
          }}
          placeholder={placeholder}
          keyExtractor={(item, index) => `list-item-${index}` }
          hideResults={hideResults}
          renderItem={({item, i}) => (
            <TouchableOpacity
              onPress={
                () => {
                  // this.props.setFormValue(this.props.fieldName, item.text,
                  // valueKey, lang, options, key);
                  this.submitChanges(item.text, key, options);
                  this.updateAutocomplete(key, true);
                  this.setState({'heightReset': true});
                }

              }>
              <Text style={styles.itemText}>
                {item.text}
              </Text>
            </TouchableOpacity>
          )}
        />);
    }

    const sortedOptions = this.findFilm(this.state.q, options);
    height = (sortedOptions.length * 40) + 35;
    if(this.state.heightReset === true) {
      height = 40;
    }

    let showForm = true;
    if (this.props.field["#multiple"]) {
      if (this.props.field['#select2']['maximumSelectionSize'] != null &&
        this.props.field['#select2']['maximumSelectionSize'] <= selectedFields.length) {
        showForm = false;
      }
    }
    else {
      showForm = selectedFields.length < 1;
    }
    // showForm = selectedFields.length < 0 this.props.field["#multiple"]

    let errorMarkup = <ErrorMessage error={error} />;

    return (
      <View style={styles.container}>
        <Text style={titleTextStyle}>{field['#title']}</Text>
        {errorMarkup}
        <FieldDescription
          description={(field['#description']) ? field['#description'] : null}/>
        <Required required={this.props.required}/>
        <View>
          {selectedFields}
        </View>
        {showForm &&
        <View style={{height: height + 20}}>
          <Autocomplete
            containerStyle={styles.textfieldContainerStyle}
            inputContainerStyle={styles.textfieldStyle}
            autoCapitalize="none"
            autoCorrect={false}
            data={sortedOptions}
            defaultValue={this.state.q}
            // listStyle={{height: 100}}
            // style={styles.autocompleteContainers}
            onChangeText={(text) => {
              // this.props.setFormValue(this.props.fieldName, text, valueKey, lang, options, i);
              // let currentQuery = this.state.query;
              // currentQuery[i] = text;
              // this.updateAutocomplete(key, false);
              this.setState({
                q: text,
                heightReset: false,
                hideResults: false
              })
            }}
            placeholder={placeholder}
            keyExtractor={(item, index) => `list-item-${index}`}
            hideResults={this.state.hideResults}
            renderItem={({item, i}) => (
              <TouchableOpacity
                onPress={
                  () => {
                    this.setState({
                      'heightReset': true,
                      'hideResults': true,
                      q: ''
                    });
                    // this.props.setFormValue(this.props.fieldName, item.text, valueKey, lang, options, nKey);
                    this.submitChanges(item.text, nKey, options);
                  }

                }>
                <Text style={styles.itemText}>
                  {item.text}
                </Text>
              </TouchableOpacity>
            )}
          />
        </View>
        }
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    flex: 1,
    marginBottom: 15
  },
  itemText: {
    fontSize: 15,
    margin: 2,
    backgroundColor: '#fff',
    zIndex: 100
  },
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
    marginBottom: 10,
    fontSize: 18
  },
  textfieldStyle: {
    height: 60,
    borderWidth: 1,
    borderColor: Colors.default.mediumGray,
    borderRadius: 5,
    backgroundColor: '#FFF',
    marginBottom: 10,
    padding: 8,
    // fontSize: 20,
  },
  textfieldContainerStyle: {
    paddingTop: 8,
    marginBottom: 10,
    // fontSize: 20
  },
  textfieldStyleError: {
    height: 40,
    borderWidth: 1,
    borderRadius: 1,
    borderColor: Colors.default.errorBackground,
    fontSize: 18
  },
  selectedFields: {
    backgroundColor: "#e2e2e2",
    borderRadius: 5,
    marginBottom: 2,
    marginTop: 5,
    flexDirection: 'row',
    padding: 5,
  },
  selectedText: {
    flex: 1
  },
  removeSelected: {
    width: 20,
    height: 20,
  }
});
