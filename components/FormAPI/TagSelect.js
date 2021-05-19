import React, {useMemo, useState, useCallback, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableHighlight,
  Pressable,
} from 'react-native';
import * as Colors from "../../constants/Colors";
import FieldDescription from "./FieldDescription";
import Required from "./Required";
import ErrorMessage from "./ErrorMessage";
import {getFieldLanguage, getFieldValueCount} from "./formUtils";
import RNPickerSelect from "react-native-picker-select";
import {FontAwesome} from '@expo/vector-icons';

const placeholder = {
  label: 'Select existing item...',
  value: '',
};

const getNewItem = (value) => {
  return {
    label: value,
    value,
    key: value,
    text: value
  }
}


const TagSelect = ({field, required, formValues, fieldName, setFormValue, parentIndex, formErrors}) => {
  const [currentSelect, setCurrentSelect] = useState('');
  const [newItem, setNewItem] = useState('');
  const [selection, setSelection] = useState([]);

  let showForm = true;
  if (field["#multiple"]) {
    if (field['#select2']['maximumSelectionSize'] != null &&
      field['#select2']['maximumSelectionSize'] <= selection.length) {
      showForm = false;
    }
  }
  else {
    showForm = selection.length < 1;
  }

  // TODO: Enable once adding new is figured out.
  const allowAdd = !!field['#select2']['allow_add_onfly'] ?? false;

  const options = useMemo(() => {
    if (field['#select2']['data'] != null) {
      return field['#select2']['data'].map(item => {
        return {key: item.id, value: item.id, label: item.text, text: item.text}
      })
    }
    else if(field['#options'] != null && typeof field['#options'] === "object" ) {
      return Object.keys(field['#options']).reduce(function(newOptions, key) {
        newOptions.push({key, value: key, label: field['#options'][key], text: field['#options'][key]});
        return newOptions;
      }, []);
    }
    else {
      return [];
    }
  }, [field]);

  const fieldKeys = useMemo(() => {
    const lang = getFieldLanguage(formValues[fieldName]);
    return {
      lang,
      valueKey: field['#value_key'] ?? 'value',
      formErrorString: fieldName + '][' + lang,
    };
  }, [field, fieldName, formValues])

  const error = formErrors?.[fieldKeys.formErrorString] ?? null;

  useEffect(() => {
    const fieldValuesCount = getFieldValueCount(formValues[fieldName]);
    const currentValues = formValues?.[fieldName]?.[fieldKeys.lang];
    if (fieldValuesCount && currentValues !== undefined) {

      let defaultValues = [];
      if (Array.isArray(currentValues)) {
        defaultValues = currentValues.map(item => {
          const selected =  options.find(option => {
            return option.value == item[fieldKeys.valueKey]
          })

          if (selected === undefined) {
            return getNewItem(item[fieldKeys.valueKey]);
          }
          return selected;

        });
      }
      else {
        defaultValues = Object.values(currentValues).map(item => {
          const selected = options.find(option => option.value == item);
          if (selected === undefined) {
            return getNewItem(item);
          }
          return selected;

        })
      }

      setSelection(defaultValues);
    }
  }, [formValues, fieldName, field, options, fieldKeys])

  const submitChanges = (value, index, options) => {
    if (parentIndex !== undefined) {
      setFormValue(fieldName, value, fieldKeys.valueKey, fieldKeys.lang, options, index, parentIndex);
    }
    else {
      setFormValue(fieldName, value, fieldKeys.valueKey, fieldKeys.lang, options, index);
    }
  };

  const addItem = (isNew = false) => {
    if (!isNew && currentSelect === '') return;
    if (isNew && newItem === '') return;

    const searchKey = isNew ? newItem : currentSelect;

    const exist = selection.find(element => element.key === searchKey);
    if (!exist) {
      const newIndex = selection.length;
      submitChanges(searchKey, newIndex, options)
      setSelection((state) => {
        let newData;
        if (isNew) {
          newData = {
            key: searchKey,
            value: searchKey,
            label: newItem
          }
        }
        else {
          newData = options.find(element => element.key === currentSelect);
        }
        return [...state, newData];
      })
      setCurrentSelect('');
      setNewItem('');
    }
  }

  const removeItem = (key) => {
    const removeIndex = selection.findIndex(item => item.key === key);
    const filteredSelection = selection.filter(item => item.key !== key);
    submitChanges('', removeIndex, []);
    setSelection(filteredSelection);
  }

  const getIcon = useCallback(() => {
    return (<FontAwesome
      name="chevron-down" size={15}
      style={styles.pickerIcon}/>);
  }, [])

  return (
    <View style={styles.container}>
      <Text style={error ? styles.titleTextStyleError : styles.titleTextStyle}>{field['#title']}</Text>
      <ErrorMessage error={error} />

      <FieldDescription
        description={(field['#description']) ? field['#description'] : null}/>
      <Required required={required}/>

      <View>
        {selection.map(item => {
          return (<View key={item.key} style={styles.selectedFields}>
            <Text style={styles.selectedText}>{item.label}</Text>
            <TouchableHighlight
              onPress={() => {
                removeItem(item.key)
              }}>
              <FontAwesome name="close" size={20} style={styles.removeSelected}/>
            </TouchableHighlight>
          </View>)
        })}
      </View>

      {showForm && (
        <View style={styles.pickerRow}>
          <View style={{flex: 1}}>
            <RNPickerSelect
              placeholder={placeholder}
              items={options}
              onValueChange={val => val !== currentSelect && setCurrentSelect(val)}
              style={pickerSelectStyles}
              value={currentSelect}
              Icon={getIcon}
            />
          </View>

          <Pressable
            style={styles.addButton}
            disabled={currentSelect === ''}
            onPress={() => addItem()}><Text style={{color: '#fff'}}>Add</Text>
          </Pressable>
        </View>
      )}

      {allowAdd && showForm && (
        <View style={styles.pickerRow}>
          <View style={{flex: 1}}>
            <TextInput
              style={styles.textfieldStyle}
              placeholder='Enter new item...'
              onChangeText={setNewItem}
              value={newItem}
            />
          </View>

          <Pressable
            style={styles.addButton}
            onPress={() => addItem(true)}><Text style={{color: '#fff'}}>Add</Text>
          </Pressable>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFF',
    flex: 1,
    marginBottom: 15
  },
  pickerIcon: {
    fontSize: 14,
    right: 10,
    top: 14
  },
  pickerRow: {
    display: 'flex',
    flexDirection: 'row',
    width: '100%',
    marginTop: 10
  },
  addButton: {
    backgroundColor: Colors.default.primary,
    color: '#FFF',
    borderRadius: 4,
    marginBottom: 10,
    marginLeft: 10,
    paddingHorizontal: 5,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
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
  textfieldStyle: {
    height: 45,
    borderWidth: 1,
    borderColor: Colors.default.mediumGray,
    borderRadius: 5,
    backgroundColor: '#FFF',
    marginBottom: 10,
    padding: 8,
    fontSize: 16,
  },
  selectedFields: {
    backgroundColor: "#fff",
    borderColor: Colors.default.primary,
    borderWidth: 1,
    borderRadius: 5,
    marginBottom: 2,
    marginTop: 5,
    flexDirection: 'row',
    padding: 10,
  },
  selectedText: {
    flex: 1
  },
  removeSelected: {
    width: 20,
    height: 20,
  }
});

/* eslint-disable react-native/no-unused-styles */
const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 4,
    borderColor: Colors.default.mediumGray,
    paddingRight: 30, // to ensure the text is never behind the icon
    marginBottom: 10,
    textTransform: 'uppercase',
  },
  inputAndroid: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderRadius: 4,
    borderColor: Colors.default.mediumGray,
    paddingRight: 30, // to ensure the text is never behind the icon
    marginBottom: 10,
    textTransform: 'uppercase',
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

export default TagSelect
