import React from 'react';
import {StyleSheet, View, Text, TouchableOpacity, Button} from 'react-native';
import {CheckBox} from "react-native-elements";
import Autocomplete from 'react-native-autocomplete-input';

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
    const field = this.props.field;
    const options = field['#select2']['data'];
    // we need to determine if this is normal select options or entity refs
    let defaultSelect = true;
    // set value key, defaulted to value
    const valueKey = (field['#value_key']) ? field['#value_key'] : 'value';
    let lang = 'und';

    let autocompleteFields = [];
    for (let i = 0; i < this.state.count; i++) {
      const key = i;
      let query = '';

      if (this.props.formValues[this.props.fieldName] !== undefined) {
        // set the language key as initial key
        lang = Object.keys(this.props.formValues[this.props.fieldName]);
        if (lang !== undefined) {
          // this is our lookup id, we need to find the text value for the id
          if (this.props.formValues[this.props.fieldName][lang][key] !== undefined) {
            let id = this.props.formValues[this.props.fieldName][lang][key];

          let term = {};

            term = options.filter(function(option) {
              return option.id === id;
            });

          if (term.length > 0) {
            query = term;
          }
        }
        } else {
          const lang = 'und';
        }
      }

      // We store the option ID for Drupal purposes, but need to set value to the text for React Purposes
      let defaultValue = (this.props.formValues[this.props.fieldName]) ? this.props.formValues[this.props.fieldName][lang][key] : '';
      let selected = options.filter(function(option) {
        return option.id === defaultValue;
      });
      if(selected.length !== 0) {
        defaultValue = selected[0].text;
      }

      const sortedOptions = this.findFilm(defaultValue, options);
      const comp = (a, b) => {
        if(typeof a !== "string" || typeof b !== "string") {
          return false;
        }
        return a.toLowerCase().trim() === b.toLowerCase().trim()
      };
      const placeholder = 'Enter ' + field['#title'];

      autocompleteFields.push(<Autocomplete
          key={i}
          autoCapitalize="none"
          autoCorrect={false}
          containerStyle={styles.autocompleteContainer}
          data={sortedOptions.length === 1 && comp(query, sortedOptions[0].text) ? [] : sortedOptions}
          defaultValue={defaultValue}
          onChangeText={(text) => this.props.setFormValue(this.props.fieldName, text, valueKey, key, options, lang)}
          placeholder={placeholder}
          hideResults={this.state.autocompleteSelected[key]}
          renderItem={({item, i}) => (
              <TouchableOpacity
                  onPress={
                    () => {
                      this.props.setFormValue(this.props.fieldName, item.text, valueKey, key, options, lang);
                      this.updateAutocomplete(key, true);
                    }

                  }>
                <Text style={styles.itemText}>
                  {item.text}
                </Text>
              </TouchableOpacity>
          )}
      />);
    }

    return (
        <View style={styles.container}>
          <Text>{field['#title']}</Text>
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
    backgroundColor: '#F5FCFF',
    flex: 1,
    paddingTop: 25
  },
  autocompleteContainer: {
    marginLeft: 10,
    marginRight: 10
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
    backgroundColor: '#F5FCFF',
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
  }
});

/*    render() {
        const field = this.props.field;
        let options = [];
        // we need to determine if this is normal select options or entity refs
        let defaultSelect = true;
        // set value key, defaulted to value
        const valueKey = (field['#value_key']) ? field['#value_key'] : 'value';

        for (var i = 0; i < field['#select2']['data'].length; i++) {
            const value = field['#select2']['data'][i]['id'];
            const label = field['#select2']['data'][i]['text'];
            if (typeof label === "string") {
                options.push(<Picker.Item
                        key={value}
                        label={label}
                        value={value}
                    />
                );
            } else {
                console.log(fieldName);
            }
        }


        return <View>
            <Text>{field['#title']}</Text>
            <Picker
                style={{height: 50, width: 'auto'}}
                onValueChange={(text) => this.props.setFormValue(this.props.fieldName, text, valueKey)}
                selectedValue={(this.props.formValues[this.props.fieldName]) ? this.props.formValues[this.props.fieldName][0][valueKey] : ''}
            >
                {options}
            </Picker>
        </View>;
    }*/