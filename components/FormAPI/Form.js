import React from 'react';
import {View, Dimensions, StyleSheet, ActivityIndicator} from 'react-native';
import Textfield from './Textfield';
import Textarea from './Textarea';
import Radios from './Radios';
import Checkboxes from './Checkboxes';
import Checkbox from './Checkbox';
import Select from './Select';
import DatePick from './DatePick';
import Scald from './Scald';
import Select2 from './Select2';
import Paragraph from './Paragraph';
import ConditionalSelect from './ConditionalSelect';
import Location from './Location';
import JSONTree from "react-native-json-tree";
import {ButtonGroup, Button, Text, Overlay} from "react-native-elements";
import axios from "axios";
import * as SQLite from 'expo-sqlite';
import * as Sync from "../MukurtuSync"
import * as FileSystem from 'expo-file-system';
import FieldCollectionForm from "./FieldCollectionForm";
import Colors from "../../constants/Colors";
import {sanitizeFormValues} from './formUtils';


export default class FormComponent extends React.Component {
  constructor(props) {
    super(props);
    const {navigation, screenProps} = this.props;
    this.state = {
      formValues: (this.props.formState !== undefined) ? this.props.formState : {"type": props.contentType},
      selectedIndex: 0,
      ajax: '',
      cookie: null,
      token: null,
      formSubmitted: false,
      formErrors: null,
      submitting: false,
      enabled: true,
      isNew: props.node === undefined
    };
    this.setFormValue = this.setFormValue.bind(this);
    this.setFormValueSelect = this.setFormValueSelect.bind(this);
    this.updateIndex = this.updateIndex.bind(this);
    this.saveNode = this.saveNode.bind(this);
    this.resetForm = this.resetForm.bind(this);
    this.enableSubmit = this.enableSubmit.bind(this);
    this.disableSubmit = this.disableSubmit.bind(this);
    this.componentActive = this.componentActive.bind(this);
  }

  componentDidMount() {
    // this.update();
    this.props.navigation.addListener('willFocus', this.componentActive);
    this.preprocessNodeForSaving();
  }

  componentActive() {
    if(typeof this.state.formValues !== 'undefined' && typeof this.props.node !== 'undefined' && (this.state.formValues.nid !== this.props.node.nid)) {
      this.preprocessNodeForSaving();
    }
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    if(typeof this.props.node !== 'undefined' && typeof prevProps.node !== 'undefined' && (this.props.node.nid !== prevProps.node.nid)) {
      this.preprocessNodeForSaving();
    }
  }

  preprocessNodeForSaving = () => {
    let node = this.props.node;
    if (node) {
      this.setState({formValues: node});
    }
  }

  updateIndex(selectedIndex) {
    this.setState({selectedIndex})
  }



  disableSubmit() {
    this.setState({'enabled': false});
  }

  enableSubmit() {
    this.setState({'enabled': true});
  }


  setFormValue(newFieldName, newValue, valueKey, lang = 'und', error = null, index = '0') {

    if (this.state.formValues) {
      const formValues = this.state.formValues;
      if (newFieldName === 'title') {
        // if title, just need key, val
        Object.assign(formValues, {[newFieldName]: newValue});
      } else {
        // if not, we need to format like drupal field
        // This is the format Drupal needs for text fields
        let values = {
          [newFieldName]: {
            [lang]: {
              [index]: {[valueKey]: newValue}
            }
          }
        };
        Object.assign(formValues, values);

      }
      // save value to state
      this.setState({formValues: formValues});
    }
    if (error) {
      let newErrors = this.state.formErrors;
      if (this.state.formErrors) {
        if (this.state.formErrors[error]) {
          delete newErrors[error];
          this.setState({formErrors: newErrors});
        }
      }
    }
  }

  setFormValueSelect(newFieldName, newValue, valueKey, lang = 'und', error = null, index = '0') {

    if (this.state.formValues) {
      const formValues = this.state.formValues;
      // if not, we need to format like drupal field
      // This is the format Drupal needs for text fields
      let values = {
        [newFieldName]: {
          [lang]: {
            [valueKey]: newValue
          }
        }
      };
      Object.assign(formValues, values);

      // save value to state
      this.setState({formValues: formValues});
    }
    if (error) {
      let newErrors = this.state.formErrors;
      if (this.state.formErrors) {
        if (this.state.formErrors[error]) {
          delete newErrors[error];
          this.setState({formErrors: newErrors});
        }
      }
    }
  }

  setFormValueCheckbox(newFieldName, newValue, valueKey, error = null) {
    if (this.state.formValues) {
      const formValues = this.state.formValues;

      // Default set to null. This format needed for Drupal to work.
      let newFieldValue = {
          "und": null
      };

      // React uses true/false, but drupal needs 1/0 for booleans.
      if (newValue === true) {
        newFieldValue.und = [{[valueKey]: 1}];
      }

      // } else {
      //   newValue = 0;
      // }
      // let values = {
      //   [newFieldName]: {
      //     "und": [{[valueKey]: newValue}]
      //   }


        // [newFieldName]: {
        //   "und": {
        //     "0": {[valueKey]: newValue}
        //   }
        // }
      // };
      // Object.assign(formValues, values);

      // save value to state
      this.setState((state) => {
        state.formValues[newFieldName] = newFieldValue;
        return state;
      });
      // this.setState({formValues: formValues});
    }
    if (error) {
      let newErrors = this.state.formErrors;
      if (this.state.formErrors) {
        if (this.state.formErrors[error]) {
          delete newErrors[error];
          this.setState({formErrors: newErrors});
        }
      }
    }
  }

  setFormValueParagraph(paragraphFieldName, paragraphFormState) {
    if (this.state.formValues) {
      const formValues = this.state.formValues;
      // See the paragraph component for how paragraph state is formatted.
      // let values = {
      //   "paragraphs": {
      //     [paragraphFieldName]: {
      //       "und": {
      //         "0": paragraphFormState
      //       }
      //     }
      //   }
      // };

      let values = {
        'paragraphs': paragraphFormState
      };

      // Format Drupal needs for submissions:
      // "paragraphs": {
      //   "field_word_entry": {
      //     "und": {
      //       "0": {
      //         "field_alternate_spelling": {
      //           "und": {
      //             "0": {
      //               "value": "alternate spelling value 1"
      //             }
      //           }
      //         },
      //         "field_sample_sentence": {
      //           "und": {
      //             "0": {
      //               "value": "1-1"
      //             },
      //             "1": {
      //               "value": "1-2"
      //             }
      //           }
      //         },
      //         "field_source": {
      //           "und": {
      //             "0": {
      //               "value": "a"
      //             }
      //           }
      //         }
      //       },
      //       "1": {
      //         "field_alternate_spelling": {
      //           "und": {
      //             "0": {
      //               "value": "alternate spelling value 2"
      //             }
      //           }
      //         },
      //         "field_sample_sentence": {
      //           "und": {
      //             "0": {
      //               "value": "2-1"
      //             },
      //             "1": {
      //               "value": "2-2"
      //             }
      //           }
      //         }
      //       }
      //     }
      //   }
      // },

      Object.assign(formValues, values);

      // save value to state
      this.setState({formValues: formValues});
    }
  }

  setFormValueFieldCollection(fieldCollectionFieldName, fieldCollectionFormState) {
    if (this.state.formValues) {
      const formValues = this.state.formValues;

      let values = {
        'field_collection': fieldCollectionFormState
      };

      Object.assign(formValues, values);

      // save value to state
      this.setState({formValues: formValues});
    }
  }

  setFormValueDate(newFieldName, newValue, type) {
    if (this.state.formValues) {
      const formValues = this.state.formValues;
      let values = {};

      if (type === 'date_combo') {
        // If the type if date_combo, it needs slashes instead of dashes
        let dateValue = newValue.split('-').join('/');
        values = {
          [newFieldName]: {
            "und": {
              "0": {
                "value": {
                  "date": dateValue
                }
              }
            }
          }
        };

      } else {

        // Drupal's Partial Date field requires a format like this:
        // "field_original_date": {
        //     //   "und" : {
        //     //     "0": {
        //     //       "from": {
        //     //         "year": "2016",
        //     //             "month": "05",
        //     //             "day": "09"
        //     //       }
        //     //     }
        //     //   }
        //     // },
        // Date will be in format 2016-05-09

        let dateArray = newValue.split('-');

        values = {
          [newFieldName]: {
            "und": {
              "0": {
                "from": {
                  "year": dateArray[0],
                  "month": dateArray[1],
                  "day": dateArray[2]
                }
              }
            }
          }
        };
      }

      Object.assign(formValues, values);

      // save value to state
      this.setState({formValues: formValues});
    }
  }

  setFormValueLocation(newFieldName, latitude, longitude) {
    if (this.state.formValues) {
      const formValues = this.state.formValues;

      // Format Drupal needs for submissions:
      // "field_coverage": {
      //   "und": {
      //     "0": {
      //       "geom": {
      //         "lat": "14.6048471550539",
      //             "lon": "149.3713159125509"
      //       }
      //
      //     }
      //   }
      // },

      let values = {
        [newFieldName]: {
          "und": {
            "0": {
              "geom": {
                "lat": latitude,
                "lon": longitude
              }
            }
          }
        }
      };
      Object.assign(formValues, values);
      this.setState({formValues: formValues});

    }
    // save value to state

  }

  setFormValueConditionalSelect(newFieldName, val, index, valueKey) {
    if (this.state.formValues) {
      let formValues = this.state.formValues;
      let lang = 'und';


      // Drupal needs this format for conditional select fields:
      // OUTDATED?

      // "oggroup_fieldset": {
      //   "0": {
      //     "dropdown_first": "2",
      //         "dropdown_second": {
      //       "target_id": "4"
      //     }
      //
      //   }
      // },

      // let values = {
      //   ['oggroup_fieldset']: {
      //     "0": {
      //       "dropdown_first": parentVal,
      //       "dropdown_second": {
      //         "target_id": val
      //       }
      //     }
      //
      //   }
      // };
      // Object.assign(formValues, values);

      const newValues = {
        [index]: {
          [valueKey]: val
        }
      };
      this.setState((state) => {
        state.formValues[newFieldName] = { ...state.formValues[newFieldName], [lang]: newValues};
        return state;
      });
    }
  }

  setFormValueSelect2(newFieldName, newValue, valueKey, lang = 'und', options, key = '0') {

    if (this.state.formValues) {
      let formValues = this.state.formValues;

      // Drupal needs this format for select fields:
      // “field_related_dh_items”: {
      //   “und”: {
      //     “0”: “30"
      //     }
      //   },

      let newValues = {};
      if (!(formValues[newFieldName]) || formValues[newFieldName].length < 1) {
        newValues = {};
      }
      else {
        newValues = Object.assign({}, formValues[newFieldName][lang]);
      }


      // Cleanup if we have data from the server
      if (newValues[0] !== undefined && newValues[0][valueKey] !== undefined) {
        let cleanValues = [];
        for (let [k, v] of Object.entries(newValues)) {
          cleanValues.push(v[valueKey]);
        }
        newValues = Object.assign({}, cleanValues);
      }

      // Convert text from react to id for Drupal. Inverse is done in select2.js
      let selectedOption = options.filter(function (option) {
        return option.text === newValue;
      });
      let nid = newValue;
      if (selectedOption !== undefined && selectedOption.length !== 0) {
        nid = selectedOption[0].id;
      }

      if (nid) {
        newValues[key] = nid.toString();
        // formValues[newFieldName][lang] = originalOptions;
      }
      else {
        let remainingOptions = [];
        for (let [k, v] of Object.entries(newValues)) {
          if (k !== key.toString()) {
            remainingOptions.push(v);
          }
        }
        newValues = Object.assign({}, remainingOptions);
      }

      // save value to state
      // this.setState({formValues: formValues});
      this.setState((state) => {
        state.formValues[newFieldName] = { ...state.formValues[newFieldName], [lang]: newValues};
        return state;
      });
    }

  }

  setFormValueCheckboxes(newFieldName, newValue, valueKey, lang = 'und', isChecked = false, error = null) {
    // need different function for checkbox so we can unset values
    if (this.state.formValues) {
      const formValues = this.state.formValues;

      let newCheckedBoxes;
      // Remove if the box was checked.
      if (isChecked) {
        newCheckedBoxes = this.state.formValues[newFieldName][lang].filter(element => {
          return element[valueKey] !== newValue;
        });
      }
      else {
        newCheckedBoxes = [...this.state.formValues[newFieldName][lang], {[valueKey]: newValue}];
      }

      // // check if we are unchecking the box
      // if (this.state.formValues[newFieldName] && newValue === this.state.formValues[newFieldName][lang][valueKey]) {
      //   Object.assign(formValues, {[newFieldName]: {[lang]: {[valueKey]: ''}}});
      // } else {
      //   Object.assign(formValues, {[newFieldName]: {[lang]: {[valueKey]: newValue}}});
      // }
      // save value to state
      this.setState((state) => {
        // formValues: formValues
        state.formValues[newFieldName][lang] = newCheckedBoxes;
        return state;
      });
    }
    if (error) {
      let newErrors = this.state.formErrors;
      if (this.state.formErrors) {
        if (this.state.formErrors[error]) {
          delete newErrors[error];
          this.setState({formErrors: newErrors});
        }
      }
    }
  }

  setFormValueRadio(newFieldName, newValue, valueKey, lang = 'und', error = null) {
    // need different function for checkbox so we can unset values
    if (this.state.formValues) {
      const formValues = this.state.formValues;
      // check if we are unchecking the box
      if (this.state.formValues[newFieldName] && newValue === this.state.formValues[newFieldName][lang][valueKey]) {
        Object.assign(formValues, {[newFieldName]: {[lang]: {[valueKey]: ''}}});
      } else {
        Object.assign(formValues, {[newFieldName]: {[lang]: {[valueKey]: newValue}}});
      }
      // save value to state
      this.setState({formValues: formValues});
    }
    if (error) {
      let newErrors = this.state.formErrors;
      if (this.state.formErrors) {
        if (this.state.formErrors[error]) {
          delete newErrors[error];
          this.setState({formErrors: newErrors});
        }
      }
    }
  }

  setFormValueScald(fieldName, value, index = '0', valueKey = 'sid', lang = 'und', error = null) {
    // Save the URI to form state so that we can pass as prop to the Scald form item
    // This allows us to persist the value so that we can tab within the form without losing it
    this.setState({
      [fieldName]: {
        [index]: value
      }
    });
    if (this.state.formValues) {
      let formValues = this.state.formValues;
      let values;
      // If we already have a form value for this field, this is a new index
      if (formValues[fieldName] !== undefined && Object.keys(formValues[fieldName]).length > 0) {

        // If null is the new value, remove this item.
        if (value == null) {
          // Second case here prevents an error removing images
          if(typeof formValues[fieldName][lang].splice === 'function') {
            formValues[fieldName][lang].splice(index, 1);
          } else {
            formValues[fieldName][lang][index] = null;
          }
        }
        else {
          formValues[fieldName][lang][index] = {
            ['sid']: value
          };
        }
        let tempvalue = formValues[fieldName];
        values = {[fieldName]: tempvalue}
      } else {
        values = {
          [fieldName]: {
            [lang]: {
              [index]: {
                ['sid']: value
              }
            }
          }
        };
      }
      Object.assign(formValues, values);
      this.setState({formValues: formValues});

    }
  }


  saveNode() {
    if (!this.props.screenProps.isConnected) {

      // Generate a random ID for this, so that we can keep track of it until it's submitted and has a node ID
      let id = Math.floor(Math.random() * 1000000000);
      if (this.state.formValues.nid) {
        id = this.state.formValues.nid;
      } else if (this.props.did) {
        id = this.props.did;
      }
      this.props.screenProps.db.transaction(
        tx => {
          tx.executeSql('replace into saved_offline (blob, id, saved) values (?, ?, 0)',

            [JSON.stringify(this.state.formValues), id],
            (success) => {
              this.setState({
                formSubmitted: true,
                submitting: false
              })
            },
            (success, error) => {
              this.setState({
                formSubmitted: true,
                submitting: false
              });
              console.log('error');
              console.log(error);

            }
          );
        }
      );
    } else {

      if (this.state.formValues.nid) {
        this.setState({'submitting': true});

        let formValues = sanitizeFormValues(this.state.formValues, this.props.screenProps);

        // I have to do this right now because I am getting errors trying to use the postData method
        const token = this.props.screenProps.token;
        const cookie = this.props.screenProps.cookie;
        const data = {
          method: 'PUT',
          mode: 'cors',
          cache: 'no-cache',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-Token': token,
            'Cookie': cookie
          },
          redirect: 'follow',
          referrer: 'no-referrer',
          body: JSON.stringify(formValues)
        };


        fetch(this.props.screenProps.siteUrl + '/app/node/' + this.state.formValues.nid + '.json', data)
          .then((response) => response.json())
          .then((responseJson) => {
            if (typeof responseJson.form_errors === 'object') {
              if(typeof responseJson.form_errors.changed === 'string') {
                this.setState({
                  formErrors: {
                    'general': responseJson.form_errors.changed
                  }
                });
              } else {
                this.setState({formErrors: responseJson.form_errors});
              }
              this.setState({'submitting': false});
            } else if (typeof responseJson[0] === 'string' && (responseJson[0].indexOf('denied') !== -1)) {
              this.setState({
                formErrors: {
                  'general': responseJson[0]
                }
              });
              this.setState({'submitting': false});
            }


            else {
              this.props.screenProps.saveNode(this.state.formValues.nid);
              this.postFieldCollection(this.state.formValues.field_collection, this.state.formValues.nid);
              // Navigate back to main content screen
              this.setState({'submitting': false}, () => {
                this.props.navigation.navigate('NodeListing', {
                  contentType: this.props.contentType,
                  contentTypeLabel: 'Test Label'
                })
              });


            }
          })
          .catch((error) => {
            console.error(error);
            this.setState({'submitting': false});
          });

      } else {
        this.postData(this.props.screenProps.siteUrl + '/app/node.json', this.state.formValues);

      }

    }
  }

  resetForm() {
    this.setState({formSubmitted: false});
  }


  postData(url = '', data = {}, method = 'POST') {

    this.setState({'submitting': true});

    fetch(url, {
      method: method,

      mode: 'cors',
      cache: 'no-cache',
      // credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.props.screenProps.token,
        'Cookie': this.props.screenProps.cookie
      },
      redirect: 'follow',
      referrer: 'no-referrer',
      body: JSON.stringify(data),
    })
      .then((response) => response.json())
      .then((responseJson) => {
        if (typeof responseJson.form_errors === 'object') {
          this.setState({formErrors: responseJson.form_errors, submitting: false})
        } else if (typeof responseJson[0] === 'string' && responseJson[0].indexOf('denied') !== -1) {
          this.setState({
            formErrors: {
              'general': responseJson[0]
            }
          });
          this.setState({'submitting': false});
        } else {
          this.setState({
            formSubmitted: true,
            submitting: false
          });
          // Submit this nid to synced entities
          if (responseJson.hasOwnProperty('nid')) {
            this.props.screenProps.updateSyncedNids(responseJson.nid);
            // Using false for now for editable
            this.props.screenProps.saveNode(responseJson.nid, {}, false);
          }

        }
        return responseJson;
      })
      .then((responseJson) => {
        // Submit field collections, if we have any
        if (!data.field_collection || typeof data.field_collection !== 'object') {
          return responseJson
        }

        this.postFieldCollection(data.field_collection, responseJson.nid);

      })
      .catch((error) => {
        console.log(error);
        this.setState({
          submitting: false
        });
      })
    ;
  }

  postFieldCollection(data, nid) {
    if (typeof data !== "undefined") {


      // Need to submit like this:
      // {
      //   "host_nid": "472",
      //   "field_collection": {
      //   "field_name": "field_lesson_days",
      //     "field_day": {
      //     "und": {
      //       "0": {
      //         "value": "day 1"
      //       }
      //     }
      //   }
      // }

      // Get our first key, which is the field_name
      let fieldName = Object.keys(data)[0];

      let body = {
        'host_nid': nid,
        'field_collection': {
          'field_name': fieldName,
        }
      };

      let i = 0;
      for (let fcKey in data[fieldName]) {
        i++;

        // Put our values in the right place in the object
        let values = data[fieldName][fcKey]; // This 0 needs to be removed/addressed once we figure out multiple value submissions
        for (let key in values) {
          if (values.hasOwnProperty(key)) {
            body.field_collection[key] = values[key];
          }
        }

        // Endpoint:  /app/field-collection (no parameters)
        const token = this.props.screenProps.token;
        const cookie = this.props.screenProps.cookie;
        let submitData = {
          method: 'POST',
          mode: 'cors',
          cache: 'no-cache',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'X-CSRF-Token': token,
            'Cookie': cookie
          },
          redirect: 'follow',
          referrer: 'no-referrer',
          body: JSON.stringify(body)
        };


        // Looks like Drupal will throw a 500 error if these are sent right in a row, even if promises are done sequentially.
        // So we add a half second timeout to ensure Drupal can handle it.
        setTimeout(() => {
          fetch(this.props.screenProps.siteUrl + '/app/field-collection/', submitData)
            .then((response) => {
              // console.log(response);
            })
            .catch((response) => {
              console.log('field collection error');
            });
        }, i * 500);
      }
    }
  }

  // Replaced with screenprops method from app.js
  // updateSyncedNids(nid) {
  //
  //   fetch(this.props.screenProps.siteUrl + '/app/synced-entities/create', {
  //     method: 'post',
  //
  //     mode: 'cors',
  //     cache: 'no-cache',
  //     // credentials: 'same-origin',
  //     headers: {
  //       'Accept': 'application/json',
  //       'Content-Type': 'application/json',
  //       'X-CSRF-Token': this.props.screenProps.token,
  //       'Cookie': this.props.screenProps.cookie
  //     },
  //     redirect: 'follow',
  //     referrer: 'no-referrer',
  //     body: nid,
  //   })
  //     .then((response) => {
  //
  //     })
  //     .then((responseJson) => {
  //
  //     });
  //
  // }


  render() {
    let form = [];
    let sceneRoutes = {};
    let tabView = [];
    let buttons = [];
    let buttonGroup = [];
    let description = null;
    const {selectedIndex} = this.state;


    // iterate through groups
    for (var i = 0; i < this.props.form.length; i++) {
      // @TODO: we will add a tabbed wrapper component here based on group name
      form[i] = [];
      if (this.props.form[i]['label'] !== undefined) {
        buttons.push(this.props.form[i]['label']);
      }
      let oneLoop = false;

      try {
        let childrenFields;
        if (this.props.form[i].childrenFields === undefined) {
          childrenFields = this.props.form;
          oneLoop = true;
        } else {
          childrenFields = this.props.form[i].childrenFields;
        }


        for (var k = 0; k < childrenFields.length; k++) {
          var field = childrenFields[k];
          var fieldName = childrenFields[k]['machine_name'];


          // For now we're omitting the additional media field on the dictionary word content type,
          // until we figure out how we want to address media-in-text fields
          if (fieldName === 'field_additional_media') {
            continue;
          }

          var fieldArray = childrenFields[k];

          if (fieldName === undefined && fieldArray['#name'] !== undefined) {
            fieldName = fieldArray['#name'];
          }


          // Save original field array so we can access add more text for paragraph
          let originalFieldArray = fieldArray;

          description = fieldArray['#description'];
          if (!description && fieldArray['und']) {
            description = fieldArray['und']['#description'];

            if (!description && fieldArray['und'][0]) {
              description = fieldArray['und'][0]['#description'];
            }
          }


          if (fieldName === 'field_mukurtu_terms') {
            console.log('terms');
          }

          if (fieldArray['#type'] !== undefined) {

            // If field type is container, we need to drill down and find the form to render
            if (fieldArray['#type'] === 'container' && typeof fieldArray['field_collection_subfields'] !== 'object') {
              fieldArray = field['und'];

              if (typeof fieldArray['mukurtu_record'] === 'object') {

                fieldArray = fieldArray['mukurtu_record']['terms_all'];
                fieldArray['#value_key'] = field['und']['#columns'][0];
              }


              if (fieldArray['#type'] === undefined && fieldArray[0] !== undefined) {

                fieldArray = fieldArray[0];

                if (fieldName === undefined && fieldArray['#field_name'] !== undefined) {
                  fieldName = fieldArray['#field_name'];
                }

                if (fieldArray && fieldArray['#type'] === undefined) {


                  if (fieldArray['#entity_type'] !== undefined && fieldArray['#entity_type'] === 'paragraphs_item') {

                    // Default add more text in case it's not present in array
                    let addMoreText = 'Add Another';
                    let paragraphTitle = '';
                    if (originalFieldArray['und'] !== undefined) {

                      if (originalFieldArray['und']['#title'] !== undefined) {
                        paragraphTitle = originalFieldArray['und']['#title'];
                      }

                      if (originalFieldArray['und']['add_more'] !== undefined && originalFieldArray['und']['add_more']['add_more'] !== undefined) {
                        addMoreText = originalFieldArray['und']['add_more']['add_more']['#value'];
                      }
                    }

                    let paragraph = <Paragraph
                      formValues={this.state.formValues}
                      fieldName={fieldName}
                      field={fieldArray}
                      key={fieldName}
                      lang={fieldArray['#language']}
                      setFormValue={this.setFormValueParagraph.bind(this)}
                      addMoreText={addMoreText}
                      paragraphTitle={paragraphTitle}
                      screenProps={this.props.screenProps}
                    />;

                    // form[i].push(paragraph);

                  } else if (fieldArray['target_id'] !== undefined) {
                    fieldArray = fieldArray['target_id'];
                  } else if (fieldArray['nid'] !== undefined) {
                    fieldArray = field['und'][0]['nid'];
                  } else if (fieldArray['default'] !== undefined) {
                    fieldArray = field['und'][0]['default'];
                  } else if (fieldArray['sid'] !== undefined) {
                    fieldArray = field['und'][0]['sid'];
                  } else if (fieldArray['value'] !== undefined) {
                    fieldArray = field['und'][0]['value'];
                  } else if (fieldArray['geom'] !== undefined) {
                    fieldArray = field['und'][0]['geom'];
                  }
                }
              }
            }

            // Set required values
            let required = fieldArray['#required'];

            if (typeof fieldArray === 'object' && fieldArray['#type']) {


              // first determine if field is scald library because in FAPI that is a textfield
              if (fieldArray['#preview_context'] && ['sdl_editor_representation', 'mukurtu_scald_media_assets_edit_'].includes(fieldArray['#preview_context'])) {
                let chosenImage = null;
                if (this.state[fieldName]) {
                  chosenImage = this.state[fieldName];
                }
                let cardinality = null;

                if (originalFieldArray['und']) {
                  cardinality = originalFieldArray['und']['#cardinality'];
                }

                // form[i].push(<Scald
                //   formValues={this.state.formValues}
                //   fieldName={fieldName}
                //   field={fieldArray}
                //   key={fieldName}
                //   db={this.props.screenProps.db}
                //   documentDirectory={this.props.screenProps.documentDirectory}
                //   setFormValue={this.setFormValueScald.bind(this)}
                //   formErrors={this.state.formErrors}
                //   description={description}
                //   chosenImage={chosenImage}
                //   cookie={this.props.screenProps.cookie}
                //   token={this.props.screenProps.token}
                //   url={this.props.screenProps.siteUrl}
                //   cardinality={cardinality}
                //   enableSubmit={this.enableSubmit}
                //   disableSubmit={this.disableSubmit}
                // />);
              } else if (typeof fieldArray['field_collection_subfields'] === 'object') {
                form[i].push(<FieldCollectionForm
                  formValues={this.state.formValues}
                  title={fieldArray['und']['#title']}
                  fieldName={fieldArray['#array_parents'][0]}
                  field={fieldArray}
                  key={fieldName}
                  lang={'und'}
                  setFormValue={this.setFormValueFieldCollection.bind(this)}
                  formErrors={this.state.formErrors}
                  required={required}
                  description={description}
                  items={fieldArray['field_collection_subfields']}
                />)
              } else if (fieldArray['#type'] === 'textfield') {
                form[i].push(<Textfield
                  formValues={this.state.formValues}
                  fieldName={fieldName}
                  field={fieldArray}
                  key={fieldName}
                  setFormValue={this.setFormValue}
                  formErrors={this.state.formErrors}
                  required={required}
                  description={description}
                />);
              } else if (fieldArray['#type'] === 'text_format') {
                form[i].push(<Textarea
                  formValues={this.state.formValues}
                  fieldName={fieldName}
                  field={fieldArray}
                  key={fieldName}
                  setFormValue={this.setFormValue}
                  formErrors={this.state.formErrors}
                  required={required}
                  description={description}
                />);
              } else if (fieldArray['#type'] === 'textarea') {
                form[i].push(<Textarea
                  formValues={this.state.formValues}
                  fieldName={fieldName}
                  field={fieldArray}
                  key={fieldName}
                  setFormValue={this.setFormValue}
                  formErrors={this.state.formErrors}
                  required={required}
                  description={description}
                />);
              } else if (fieldArray['#type'] === 'radios') {
                form[i].push(<Radios
                  formValues={this.state.formValues}
                  fieldName={fieldName}
                  field={fieldArray}
                  key={fieldName}
                  setFormValue={this.setFormValueRadio.bind(this)}
                  formErrors={this.state.formErrors}
                  required={required}
                  description={description}
                />);
              } else if (fieldArray['#type'] === 'checkboxes') {
                form[i].push(<Checkboxes
                  formValues={this.state.formValues}
                  fieldName={fieldName}
                  field={fieldArray}
                  key={fieldName}
                  setFormValue={this.setFormValueCheckboxes.bind(this)}
                  formErrors={this.state.formErrors}
                  required={required}
                  description={description}
                />);
              } else if (fieldArray['#type'] === 'checkbox') {
                form[i].push(<Checkbox
                  formValues={this.state.formValues}
                  fieldName={fieldName}
                  field={fieldArray}
                  key={fieldName}
                  setFormValue={this.setFormValueCheckbox.bind(this)}
                  formErrors={this.state.formErrors}
                  required={required}
                  description={description}
                />);
              }
              // OG group gets special conditional select. Can expand to other conditional fields as needed
              else if (fieldArray['#type'] === 'select' && fieldName === 'og_group_ref') {
                form[i].push(<ConditionalSelect
                  formValues={this.state.formValues}
                  fieldName={fieldName}
                  field={fieldArray}
                  key={fieldName}
                  setFormValue={this.setFormValueConditionalSelect.bind(this)}
                  formErrors={this.state.formErrors}
                  required={required}
                  description={description}
                  nodes={this.props.screenProps.nodes}
                />);

              }
              else if (fieldArray['#type'] === 'select' && fieldName === 'field_mukurtu_terms') {
                form[i].push(<Select2
                  formValues={this.state.formValues}
                  fieldName={fieldName}
                  field={fieldArray}
                  key={fieldName}
                  setFormValue={this.setFormValueSelect2.bind(this)}
                  formErrors={this.state.formErrors}
                  required={required}
                  description={description}
                />);

              } else if (fieldArray['#type'] === 'select') {
                form[i].push(<Select
                  formValues={this.state.formValues}
                  fieldName={fieldName}
                  field={fieldArray}
                  key={fieldName}
                  setFormValue={this.setFormValueSelect.bind(this)}
                  formErrors={this.state.formErrors}
                  required={required}
                  description={description}
                />);
              } else if (['item', 'date_combo'].includes(fieldArray['#type'])) {
                form[i].push(<DatePick
                  formValues={this.state.formValues}
                  fieldName={fieldName}
                  field={fieldArray}
                  key={fieldName}
                  fieldType={fieldArray['#type']}
                  setFormValue={this.setFormValueDate.bind(this)}
                  formErrors={this.state.formErrors}
                  required={required}
                  description={description}
                  isNew={this.state.isNew}
                />);
              } else if (fieldArray['#type'] === 'geofield_latlon') {
                form[i].push(<Location
                  formValues={this.state.formValues}
                  fieldName={fieldName}
                  field={fieldArray}
                  key={fieldName}
                  setFormValue={this.setFormValueLocation.bind(this)}
                  formErrors={this.state.formErrors}
                  required={required}
                  description={description}
                />);
              } else if (fieldArray['#type'] === 'select2_hidden') {
                form[i].push(<Select2
                  formValues={this.state.formValues}
                  fieldName={fieldName}
                  field={fieldArray}
                  key={fieldName}
                  setFormValue={this.setFormValueSelect2.bind(this)}
                  formErrors={this.state.formErrors}
                  required={required}
                  description={description}
                />);
              } else if (fieldArray['#columns'] !== undefined) {
                form[i].push(<Textfield
                  formValues={this.state.formValues}
                  fieldName={fieldName}
                  field={fieldArray}
                  key={fieldName}
                  required={required}
                  setFormValue={this.setFormValue}
                />);

              }
            } else {

            }
          }


        }
      } catch (e) {
        console.log(e);
      }

      for (var p = 0; p < form.length; p++) {
        var groupName = this.props.form[p]['group_name'];
        sceneRoutes[groupName] = <View style={{width: 200, height: 200}}>{form[p]}</View>;
      }
      if (buttons.length > 0) {
        buttonGroup = <ButtonGroup
          onPress={this.updateIndex}
          selectedIndex={selectedIndex}
          buttons={buttons}
          containerStyle={styles.buttonContainer}
          buttonStyle={styles.buttonStyle}
          textStyle={styles.textStyle}
          selectedButtonStyle={styles.selectedButtonStyle}
        />;

      }
      if (oneLoop) {
        break;
      }
    }

    let activityIndicator;
    if (this.state.submitting === true) {
      activityIndicator =
        <Overlay
          isVisible={true}
          windowBackgroundColor="rgba(255, 255, 255, .5)"
          overlayBackgroundColor="rgba(255, 255, 255, 1)"
          width="auto"
          height="auto"
        >
          <View style={styles.activityContainer}>
            <Text style={{marginBottom: 10}}>Saving Node...</Text>
            <ActivityIndicator size="large" color="#159EC4"/>
          </View>
        </Overlay>
    }

    let formDisplay;

    if (this.state.formSubmitted) {
      if (!this.props.screenProps.isConnected) {
        formDisplay = <View>
          <Text>Your content has been queued for saving when connected.</Text>
          <Button
            title="Submit Another"
            onPress={this.resetForm}
          />
        </View>
      } else {
        formDisplay = <View>
          <Text>Your content has been submitted successfully.</Text>
          <Button
            title="Submit Another"
            onPress={this.resetForm}
          />
        </View>
      }

    } else {
      let generalFormError;
      if (this.state.formErrors !== null && typeof this.state.formErrors === 'object') {
        let formErrorsArray = [];
        for (let key in this.state.formErrors) {
          if(this.state.formErrors.hasOwnProperty(key)) {
            formErrorsArray.push(<Text style={styles.errorTextStyleError}>{this.state.formErrors[key]}</Text>);
          }
        }

        generalFormError = formErrorsArray;
      }
      formDisplay = <View>

        {buttonGroup}
        <View
          style={styles.view}
        >
          {form[this.state.selectedIndex]}
        </View>
        {activityIndicator}
        {generalFormError}
        <Button
          title="Save"
          onPress={this.saveNode}
          style={styles.button}
          disabled={!this.state.enabled}
        />
      </View>;
    }

    return formDisplay;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  button: {
    zIndex: -1
  },
  view: {
    zIndex: 100
  },
  buttonContainer: {
    // flexWrap: 'wrap',
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
    backgroundColor: Colors.primary,
    marginBottom: 10,
    // color: '#FFF',
    // fontSize: 16,
  },
  selectedButtonStyle: {
    backgroundColor: Colors.gold,
  },
  textStyle: {
    padding: 5,
    color: '#FFF',
    fontSize: 14,
    textTransform: 'uppercase'
  },
  activityContainer: {
    padding: 10
  },
  errorTextStyleError: {
    color: Colors.errorBackground,
    fontSize: 18,
    marginBottom: 10
  },
});
