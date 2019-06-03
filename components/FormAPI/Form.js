import React from 'react';
import {View, Dimensions, StyleSheet} from 'react-native';
import Textfield from './Textfield';
import Textarea from './Textarea';
import Radios from './Radios';
import Checkboxes from './Checkboxes';
import Checkbox from './Checkbox';
import Select from './Select';
import Date from './Date';
import Scald from './Scald';
import Select2 from './Select2';
import ConditionalSelect from './ConditionalSelect';
import Location from './Location';
import JSONTree from "react-native-json-tree";
import {ButtonGroup, Button, Text} from "react-native-elements";
import axios from "axios";
import {SQLite} from "expo";

const db = SQLite.openDatabase('db.db');

export default class FormComponent extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      formValues: {"type": props.contentType},
      selectedIndex: 0,
      ajax: '',
      cookie: null,
      token: null,
      formSubmitted: false
    };
    this.setFormValue = this.setFormValue.bind(this);
    this.updateIndex = this.updateIndex.bind(this);
    this.saveNode = this.saveNode.bind(this)
    this.resetForm = this.resetForm.bind(this)
  }

  componentDidMount() {
    this.update();
  }

  updateIndex(selectedIndex) {
    this.setState({selectedIndex})
  }

  update() {
    db.transaction(tx => {
      tx.executeSql(
          'select * from auth limit 1;',
          '',
          (_, {rows: {_array}}) => this.getToken(_array)
      );
    });
  }

  getToken(array) {
    if (array === undefined || array.length < 1) {

      this.alertNotLoggedIn();
      return false;
    }

    const token = array[0].token;
    const cookie = array[0].cookie;

    this.setState({
      cookie: cookie,
      token: token
    });

    let data = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': token,
        'Cookie': cookie
      }
    };
    fetch(this.props.url + '/index.php?q=taxonomy/autocomplete/field_creator', data)
        .then((response) => response.json())
        .then((responseJson) => {
          let form = responseJson;


          this.setState({ajax: form});
        })
        .catch((error) => {
          // console.error(error);
        });

  }

  setFormValue(newFieldName, newValue, valueKey) {
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
            "und": {
              "0": {[valueKey]: newValue}
            }
          }
        };
        Object.assign(formValues, values);

      }
      // save value to state
      this.setState({formValues: formValues});
    }
  }


  setFormValueCheckbox(newFieldName, newValue, valueKey) {
    if (this.state.formValues) {
      const formValues = this.state.formValues;

      // React uses true/false, but drupal needs 1/0 for booleans.
      if (newValue === true) {
        newValue = 1;
      } else {
        newValue = 0;
      }
      let values = {
        [newFieldName]: {
          "und": {
            "0": {[valueKey]: newValue}
          }
        }
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


  setFormValueConditionalSelect(newFieldName, val) {

    if (this.state.formValues) {
      let formValues = this.state.formValues;

      // Drupal needs this format for conditional select fields:

      // "oggroup_fieldset": {
      //   "0": {
      //     "dropdown_first": "2",
      //         "dropdown_second": {
      //       "target_id": "4"
      //     }
      //
      //   }
      // },

      let values = {
        ['oggroup_fieldset']: {
            "0": {
              "dropdown_first": "2",
              "dropdown_second": {
                "target_id": val
              }
            }

        }
      };
      Object.assign(formValues, values);
      this.setState({formValues: formValues});
    }
  }


  setFormValueSelect2(newFieldName, newValue, valueKey, key, options) {

    if (this.state.formValues) {
      let formValues = this.state.formValues;

      // Drupal needs this format for select fields:
      // “field_related_dh_items”: {
      //   “und”: {
      //     “0”: “30"
      //     }
      //   },

      if (!(formValues[newFieldName])) {
        formValues[newFieldName] = {};
        formValues[newFieldName]['und'] = {};
      }

      // Convert text from react to id for Drupal. Inverse is done in select2.js
      let selectedOption = options.filter(function(option) {
        return option.text === newValue;
      });
      let nid = newValue;
      if (selectedOption !== undefined && selectedOption.length !== 0) {
       nid = selectedOption[0].id;
      }

      formValues[newFieldName]['und'][key] = nid;

      // save value to state
      this.setState({formValues: formValues});
    }

  }


  setFormValueCheckboxes(newFieldName, newValue, valueKey) {
    // need different function for checkbox so we can unset values
    if (this.state.formValues) {
      const formValues = this.state.formValues;
      // check if we are unchecking the box
      if (this.state.formValues[newFieldName] && newValue === this.state.formValues[newFieldName][0][valueKey]) {
        Object.assign(formValues, {[newFieldName]: [{[valueKey]: ''}]});
      } else {
        Object.assign(formValues, {[newFieldName]: [{[valueKey]: newValue}]});
      }
      // save value to state
      this.setState({formValues: formValues});
    }
  }

  saveNode() {
    console.log('form values');
    console.log(this.state.formValues);

    this.postData(this.props.url + '/app/node.json', this.state.formValues)
    // .then(data => console.log(JSON.stringify(data))) // JSON-string from `response.json()` call
        .then(
            () => {
              this.setState({
                formSubmitted: true
              })
            }
        )
        .catch(error => console.error(error));
  }

  resetForm() {
    this.setState({formSubmitted: false});
  }


  postData(url = '', data = {}) {
    return fetch(url, {
      method: 'POST',

      mode: 'cors',
      cache: 'no-cache',
      // credentials: 'same-origin',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.state.token,
        'Cookie': this.state.cookie
      },
      redirect: 'follow',
      referrer: 'no-referrer',
      body: JSON.stringify(data),
    })
        .then(response => console.log(response))
        .catch(error => console.error(error)); // parses JSON response into native Javascript objects
  }


  render() {
    let form = [];
    let sceneRoutes = {};
    let tabView = [];
    let buttons = [];
    let buttonGroup = [];
    const {selectedIndex} = this.state;


    // iterate through groups
    for (var i = 0; i < this.props.form.length; i++) {
      // @TODO: we will add a tabbed wrapper component here based on group name
      form[i] = [];
      buttons.push(this.props.form[i]['label']);

      try {
        var childrenFields = this.props.form[i].childrenFields;

        for (var k = 0; k < childrenFields.length; k++) {
          var field = childrenFields[k];
          var fieldName = childrenFields[k]['machine_name'];

          //


          var fieldArray = childrenFields[k];

          if (fieldArray['#type'] !== undefined) {

            // If field type is container, we need to drill down and find the form to render
            if (fieldArray['#type'] === 'container') {
              fieldArray = field['und'];


              if (fieldArray['#type'] === undefined) {

                fieldArray = fieldArray[0];

                if (fieldArray && fieldArray['#type'] === undefined) {

                  if (fieldArray['target_id'] !== undefined) {
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


            if (typeof fieldArray === 'object' && fieldArray['#type']) {

              // first determine if field is scald library because in FAPI that is a textfield
              if (fieldArray['#preview_context'] && fieldArray['#preview_context'] === 'mukurtu_scald_media_assets_edit_') {
                form[i].push(<Scald
                    formValues={this.state.formValues}
                    fieldName={fieldName}
                    field={fieldArray}
                    key={fieldName}
                    setFormValue={this.setFormValue}
                />);
              } else if (fieldArray['#type'] === 'textfield') {
                form[i].push(<Textfield
                    formValues={this.state.formValues}
                    fieldName={fieldName}
                    field={fieldArray}
                    key={fieldName}
                    setFormValue={this.setFormValue}
                />);
              } else if (fieldArray['#type'] === 'text_format') {
                form[i].push(<Textarea
                    formValues={this.state.formValues}
                    fieldName={fieldName}
                    field={fieldArray}
                    key={fieldName}
                    setFormValue={this.setFormValue}
                />);
              } else if (fieldArray['#type'] === 'textarea') {
                form[i].push(<Textarea
                    formValues={this.state.formValues}
                    fieldName={fieldName}
                    field={fieldArray}
                    key={fieldName}
                    setFormValue={this.setFormValue}
                />);
              } else if (fieldArray['#type'] === 'radios') {
                form[i].push(<Radios
                    formValues={this.state.formValues}
                    fieldName={fieldName}
                    field={fieldArray}
                    key={fieldName}
                    setFormValue={this.setFormValueCheckbox.bind(this)}
                />);
              } else if (fieldArray['#type'] === 'checkboxes') {
                form[i].push(<Checkboxes
                    formValues={this.state.formValues}
                    fieldName={fieldName}
                    field={fieldArray}
                    key={fieldName}
                    setFormValue={this.setFormValueCheckboxes.bind(this)}
                />);
              } else if (fieldArray['#type'] === 'checkbox') {
                form[i].push(<Checkbox
                    formValues={this.state.formValues}
                    fieldName={fieldName}
                    field={fieldArray}
                    key={fieldName}
                    setFormValue={this.setFormValueCheckbox.bind(this)}
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
                />);

              } else if (fieldArray['#type'] === 'select') {
                form[i].push(<Select
                    formValues={this.state.formValues}
                    fieldName={fieldName}
                    field={fieldArray}
                    key={fieldName}
                    setFormValue={this.setFormValue}
                />);
              } else if (['item', 'date_combo'].includes(fieldArray['#type'])) {
                form[i].push(<Date
                    formValues={this.state.formValues}
                    fieldName={fieldName}
                    field={fieldArray}
                    key={fieldName}
                    fieldType={fieldArray['#type']}
                    setFormValue={this.setFormValueDate.bind(this)}
                />);
              } else if (fieldArray['#type'] === 'geofield_latlon') {
                form[i].push(<Location
                    formValues={this.state.formValues}
                    fieldName={fieldName}
                    field={fieldArray}
                    key={fieldName}
                    setFormValue={this.setFormValueLocation.bind(this)}
                />);
              } else if (fieldArray['#type'] === 'select2_hidden') {
                form[i].push(<Select2
                    formValues={this.state.formValues}
                    fieldName={fieldName}
                    field={fieldArray}
                    key={fieldName}
                    setFormValue={this.setFormValueSelect2.bind(this)}
                />);
              }
            } else {
              console.log(fieldArray['#title']);
            }
          }
        }
      } catch (e) {
        // console.log(e);
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
        />;

      }
    }

    let formDisplay;

    if (this.state.formSubmitted) {
      formDisplay = <View>
        <Text>Your content has been submitted successfully.</Text>
        <Button
            title="Submit Another"
            onPress={this.resetForm}
        />
      </View>

    } else {
      formDisplay = <View>
        <JSONTree data={this.props.form}/>
        {buttonGroup}
        {form[this.state.selectedIndex]}
        <Button
            title="Save"
            onPress={this.saveNode}
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
  buttonContainer: {
    flexWrap: 'wrap',
    flex: 1,
    flexDirection: 'column',
    height: 'auto'
  },
  buttonStyle: {
    flex: 1,
    padding: 5
  }
});