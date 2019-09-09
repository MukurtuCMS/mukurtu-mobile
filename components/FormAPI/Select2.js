import React from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Button} from 'react-native';
import {CheckBox} from "react-native-elements";
import Autocomplete from 'react-native-autocomplete-input';
import * as Colors from "../../constants/Colors";
import FieldDescription from "./FieldDescription";
import Required from "./Required";

export default class Select2 extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      query: '',
      count: 1,
      // Allows us to close autocomplete suggestions for each autocomplete field on selection
      autocompleteSelected: {
        0: false
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
        }
    )
  }

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
        if (this.props.formErrors[fieldName]) {
          error = this.props.formErrors[fieldName];
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
    const options = field['#select2']['data'];
    // we need to determine if this is normal select options or entity refs
    let defaultSelect = true;
    // set value key, defaulted to value
    const valueKey = (field['#value_key']) ? field['#value_key'] : 'value';

    let autocompleteFields = [];
    for (let i = 0; i < this.state.count; i++) {
      const key = i;
      let query = '';
      if(this.state.query && this.state.query[i]) {
        query = this.state.query[i];
      }
      if (this.props.formValues[this.props.fieldName] !== undefined) {
        // set the language key as initial key
        if (lang !== undefined && typeof this.props.formValues[this.props.fieldName][lang][key] !== 'undefined') {
          // this is our lookup id, we need to find the text value for the id
          const id = this.props.formValues[this.props.fieldName][lang][key];
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


      const sortedOptions = this.findFilm(query, options);
      const comp = (a, b) => a.toLowerCase().trim() === b.toLowerCase().trim();
      const placeholder = 'Enter ' + field['#title'];

      autocompleteFields.push(<Autocomplete
          key={i}
          autoCapitalize="none"
          autoCorrect={false}
          containerStyle={styles.autocompleteContainer}
          data={sortedOptions}
          defaultValue={defaultValue}
          onChangeText={(text) => {
            this.props.setFormValue(this.props.fieldName, text, valueKey, key, options, lang);
            this.setState({
              'query': {
                [i]: text
              }
            })
          }}
          placeholder={placeholder}
          hideResults={this.state.autocompleteSelected[key]}
          renderItem={({item, i}) => (
              <TouchableOpacity
                  onPress={
                    () => {
                      this.props.setFormValue(this.props.fieldName, item.text, valueKey, key, options, lang, formErrorString)
                      this.updateAutocomplete(key, true)
                    }

                  }>
                <Text style={styles.itemText}>
                  {item.text}
                </Text>
              </TouchableOpacity>
          )}
      />);
    }

    let errorMarkup = [];
    if (error) {
      errorMarkup = <Text style={errorTextStyle}>{error}</Text>;
    }

    return (
        <View style={styles.container}>
          <Text style={titleTextStyle}>{field['#title']}</Text>
          {errorMarkup}
          <FieldDescription description={(field['#description']) ? field['#description'] : null} />
          <Required required={this.props.required}/>
          {autocompleteFields}
          <Button title={'Add another'} onPress={() => {
            this.updateAutocomplete(this.state.count, false);
            this.setState({count: this.state.count + 1,});
          }

          }

          />
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
  autocompleteContainer: {
  },
  autocompleteContainers: {
    flex: 1,
    left: 0,
    position: 'absolute',
    right: 0,
    top: 0,
    zIndex: 1
  },
  itemText: {
    fontSize: 15,
    margin: 2
  },
  descriptionContainer: {
    // `backgroundColor` needs to be set otherwise the
    // autocomplete input will disappear on text input.
    backgroundColor: '#FFF',
    marginTop: 8
  },
  infoText: {
    textAlign: 'center'
  },
  titleText: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 10,
    marginTop: 10,
    textAlign: 'center'
  },
  directorText: {
    color: 'grey',
    fontSize: 12,
    marginBottom: 10,
    textAlign: 'center'
  },
  openingText: {
    textAlign: 'center'
  },
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
    height: 60,
    borderWidth: 1,
    borderColor: Colors.default.mediumGray,
    borderRadius: 5,
    backgroundColor: '#FFF',
    marginBottom: 10,
    padding: 8,
    fontSize: 20
  },
  textfieldStyleError: {
    height: 40,
    borderWidth: 1,
    borderRadius: 1,
    borderColor: Colors.default.errorBackground
  }
});
