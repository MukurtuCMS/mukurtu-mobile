
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