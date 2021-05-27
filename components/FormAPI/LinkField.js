import React, {useEffect, useMemo, useState} from 'react'
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity
} from 'react-native';
import ErrorMessage from './ErrorMessage';
import FieldDescription from './FieldDescription';
import Required from './Required';
import {getFieldLanguage, getFieldValueCount} from './formUtils';
import * as Colors from '../../constants/Colors';

const LinkField = ({formValues, fieldName, field, setFormValue, formErrors, required, cardinality}) => {

  const [defaultValues, setDefaultValues] = useState([{'title': '', url: ''}]);

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

      setDefaultValues(currentValues);
    }
  }, [formValues, fieldName, field, fieldKeys])

  const editValues = (index, field, value) => {
    const newValues = [...defaultValues];
    newValues[index][field] = value;
    setFormValue({fieldName, values: newValues, lang: fieldKeys.lang})
    // setDefaultValues(newValues);
  }

  const addMore = () => {
    setDefaultValues(values => {
      return [
        ...values,
        {'title': '', url: ''}
      ]
    })
  }

  const intCardinality = parseInt(cardinality);
  const showAddMore = intCardinality === -1 || intCardinality > defaultValues.length;

  return (
    <View style={styles.outerContainer}>
      <Text style={error ? styles.titleTextStyleError : styles.titleTextStyle}>{field['#title']}</Text>
      <ErrorMessage error={error} />

      <FieldDescription
        description={(field['#description']) ? field['#description'] : null}/>
      <Required required={required}/>

      {defaultValues.map((link, index) => {
        return (
          <View style={styles.linkContainer} key={index}>
            <Text style={styles.textFieldLabel}>Title</Text>
            <TextInput
              onChangeText={(text => editValues(index, 'title', text))}
              style={styles.textFieldStyle}
              value={link.title} />
            <Text style={styles.textFieldLabel}>URL</Text>
            <TextInput
              onChangeText={(text => editValues(index, 'url', text))}
              autoCapitalize={'none'}
              autoCorrect={false}
              textContentType={'URL'}
              style={styles.textFieldStyle}
              value={link.url} />
          </View>
        )
      })}

      {showAddMore &&
        <TouchableOpacity
          style={styles.mediaButton}
          onPress={addMore}
        >
          <Text style={styles.mediaButtonText}>Add another link</Text>
        </TouchableOpacity>
      }
    </View>
  )
}

const styles = StyleSheet.create({
  outerContainer: {
    marginBottom: 40
  },
  linkContainer: {
    borderWidth: 1,
    borderColor: Colors.default.mediumGray,
    borderRadius: 5,
    padding: 10,
    marginBottom: 10
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
  textFieldLabel: {
    textTransform: 'uppercase',
    fontWeight: 'bold'
  },
  textFieldStyle: {
    height: 40,
    borderWidth: 1,
    borderColor: Colors.default.mediumGray,
    borderRadius: 5,
    backgroundColor: '#FFF',
    marginBottom: 10,
    padding: 8,
    fontSize: 16
  },
  mediaButton: {
    color: Colors.default.primary,
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: Colors.default.primary,
    borderRadius: 3,
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 10,
    paddingRight: 10,
    textAlign: 'center'
  },
  mediaButtonText: {
    color: Colors.default.primary,
    textTransform: 'uppercase',
    textAlign: 'center'
  }
});

export default LinkField
