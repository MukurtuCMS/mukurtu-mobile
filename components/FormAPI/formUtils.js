
export const getFieldLanguage = (field) => {

  if (field) {
    return Object.keys(field)[0];
  }

  return 'und';
};

export const getFirstFieldValue = (field) => {

  if (field) {
    const lang = getFieldLanguage(field);
    return field[lang] != null && field[lang][0] != null ? field[lang][0] : null;
  }

  return null;
};

export const getAllFieldValues = (field) => {
  if (field) {
    const lang = getFieldLanguage(field);
    return field[lang] !== undefined && field[lang][0] !== undefined ? field[lang] : null;
  }

  return null;
};

export const getFieldValueCount = (field) => {
  const values = getAllFieldValues(field);

  if (values && Array.isArray(values)) {
    return values.length;
  }

  if (values && typeof values == 'object') {
    const keys = Object.keys(values);
    return keys.length;
  }

  return 0;
};


export const sanitizeFormValues = (data, screenProps) => {
  let formValues = {...data};

  // This section here holds all the logic for some custom field handling.
  const refValueKeys = ['tid', 'nid', 'target_id'];
  const skipFields = {'og_group_ref': ['select']};
  const hardcodedLanguage = {'field_tags': 'en'};


  for(let key in formValues) {
    if(formValues.hasOwnProperty(key)) {

      const fieldDefinition = screenProps.formFields[formValues.type][key];

      if (fieldDefinition != null && fieldDefinition[fieldDefinition['#language']] != null) {
        const fieldType = fieldDefinition[fieldDefinition['#language']]['#type'];

        // Check for field/type combo to see which processing to skip
        if (skipFields.hasOwnProperty(key) && skipFields[key].indexOf(fieldType) !== -1) { continue; }

        const lang = Object.keys(formValues[key]);
        const valueKey = fieldDefinition[fieldDefinition['#language']]['#value_key'];

        // Make sure radios are set to just one value
        if (fieldType === 'radios') {
          formValues[key][lang] = formValues[key][lang][0];
        }

        // If this is a node/term reference, we need to remove that value key.
        // Need to account for the occasions where that already happened.
        else if(refValueKeys.indexOf(valueKey !== -1) &&
          formValues[key][lang] != null &&
          formValues[key][lang][0] != null &&
          formValues[key][lang][0][valueKey] != null) {

          const tempObject = [];
          const iterateArray = typeof formValues[key][lang] === "object" ? Object.values(formValues[key][lang]) : formValues[key][lang];
          iterateArray.forEach(entry => tempObject.push(entry[valueKey]));
          formValues[key][lang] = tempObject;
        }

        // For certain fields we have to hardcode the language key.
        if (hardcodedLanguage.hasOwnProperty(key)) {
          formValues[key] = {
            [hardcodedLanguage[key]]: formValues[key][lang]
          };
        }

        // Finally this is where we add some hardcoded field logic
        switch (key) {
          case 'field_mukurtu_terms':
            formValues[key] = {
              "und": {
                "mukurtu_record": {
                  "terms_all": formValues[key][lang]
                }
              }
            };
            break;
        }
      }
    }
  }

  // Unset the data array
  formValues['data'] = null;

  return formValues;
};