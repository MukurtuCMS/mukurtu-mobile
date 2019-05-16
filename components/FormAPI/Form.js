import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import Textfield from './Textfield';
import Textarea from './Textarea';
import Radios from './Radios';
import Checkboxes from './Checkboxes';
import Select from './Select';
import Date from './Date';
import Scald from './Scald';
import Select2 from './Select2';
import Location from './Location';
import JSONTree from "react-native-json-tree";
import { ButtonGroup, Button } from "react-native-elements";
import axios from "axios";
import {SQLite} from "expo";

const db = SQLite.openDatabase('db.db');

export default class FormComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {formValues: {"type": props.contentType}, selectedIndex: 0, ajax: ''}
        this.setFormValue = this.setFormValue.bind(this);
        this.updateIndex = this.updateIndex.bind(this);
        this.saveNode = this.saveNode.bind(this)
    }

    componentDidMount() {
        this.update();
    }

    updateIndex (selectedIndex) {
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

        let data = {
            method: 'GET',
            headers: {
                'Accept':       'application/json',
                'Content-Type': 'application/json',
                'X-CSRF-Token': token,
                'Cookie': cookie
            }
        };
        fetch('http://mukurtucms.kanopi.cloud/index.php?q=taxonomy/autocomplete/field_creator', data)
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
                Object.assign(formValues, {[newFieldName]:[{[valueKey]: newValue}]});
            }
            // save value to state
            this.setState({formValues: formValues});
        }
    }

    setFormValueSelect2(newFieldName, newValue, valueKey, key) {
        console.log(key);
        if (this.state.formValues) {
            let formValues = this.state.formValues;

            if (!(formValues[newFieldName])) {
                formValues[newFieldName] = {};
                formValues[newFieldName]['und'] = [];
            }

            formValues[newFieldName]['und'][key] = newValue;
            // save value to state
            this.setState({formValues: formValues});
        }
        console.log(this.state.formValues);


/*        if (this.state.formValues) {
            const formValues = this.state.formValues;
                let newFormValues = [];
                if (this.state.formValues[newFieldName]) {
                    newFormValues = this.state.formValues[newFieldName];
                }
                newFormValues.push({[valueKey]: newValue});
            Object.assign(formValues, {[newFieldName]: newFormValues});

            console.log(formValues);
            // save value to state
            this.setState({formValues: formValues});
        }
        console.log(this.state.formValues);*/
    }

    setFormValueCheckbox(newFieldName, newValue, valueKey) {
        // need different function for checkbox so we can unset values
        if (this.state.formValues) {
            const formValues = this.state.formValues;
            // check if we are unchecking the box
            if (this.state.formValues[newFieldName] && newValue === this.state.formValues[newFieldName][0][valueKey]) {
                Object.assign(formValues, {[newFieldName]:[{[valueKey]: ''}]});
            } else {
                Object.assign(formValues, {[newFieldName]: [{[valueKey]: newValue}]});
            }
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
                Object.assign(formValues, {[newFieldName]:[{[valueKey]: ''}]});
            } else {
                Object.assign(formValues, {[newFieldName]: [{[valueKey]: newValue}]});
            }
            // save value to state
            this.setState({formValues: formValues});
        }
    }

    saveNode(){
        console.log(this.state.formValues);
    }

    render() {
        let form = [];
        let sceneRoutes = {};
        let tabView = [];
        let buttons = [];
        let buttonGroup = [];
        const { selectedIndex } = this.state;

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

                 var fieldArray = childrenFields[k];

                 if (fieldArray['#type'] !== undefined) {
                     // If field type is container, we need to drill down and find the form to render
                     if (fieldArray['#type'] === 'container') {
                         fieldArray = field['und'];

                         if (fieldArray['#type'] === undefined) {
                             fieldArray = field['und'][0];

                             if (fieldArray && fieldArray['#type'] === undefined) {
                                 if (fieldArray['nid'] !== undefined) {
                                     fieldArray = field['und'][0]['nid'];
                                 }
                                 else if (fieldArray['default'] !== undefined) {
                                     fieldArray = field['und'][0]['default'];
                                 }
                                 else if (fieldArray['sid'] !== undefined) {
                                     fieldArray = field['und'][0]['sid'];
                                 }
                                 else if (fieldArray['value'] !== undefined) {
                                     fieldArray = field['und'][0]['value'];
                                 }
                                 else if (fieldArray['geom'] !== undefined) {
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
                         }
                         else if (fieldArray['#type'] === 'textfield') {
                             form[i].push(<Textfield
                                 formValues={this.state.formValues}
                                 fieldName={fieldName}
                                 field={fieldArray}
                                 key={fieldName}
                                 setFormValue={this.setFormValue}
                             />);
                         }
                         else if (fieldArray['#type'] === 'text_format') {
                             form[i].push(<Textarea
                                 formValues={this.state.formValues}
                                 fieldName={fieldName}
                                 field={fieldArray}
                                 key={fieldName}
                                 setFormValue={this.setFormValue}
                             />);
                         }
                         else if (fieldArray['#type'] === 'textarea') {
                             form[i].push(<Textarea
                                 formValues={this.state.formValues}
                                 fieldName={fieldName}
                                 field={fieldArray}
                                 key={fieldName}
                                 setFormValue={this.setFormValue}
                             />);
                         }
                         else if (fieldArray['#type'] === 'radios') {
                             form[i].push(<Radios
                                 formValues={this.state.formValues}
                                 fieldName={fieldName}
                                 field={fieldArray}
                                 key={fieldName}
                                 setFormValue={this.setFormValueCheckbox.bind(this)}
                             />);
                         }
                         else if (fieldArray['#type'] === 'checkboxes') {
                             form[i].push(<Checkboxes
                                 formValues={this.state.formValues}
                                 fieldName={fieldName}
                                 field={fieldArray}
                                 key={fieldName}
                                 setFormValue={this.setFormValueCheckboxes.bind(this)}
                             />);
                         }
                         else if (fieldArray['#type'] === 'select') {
                             form[i].push(<Select
                                 formValues={this.state.formValues}
                                 fieldName={fieldName}
                                 field={fieldArray}
                                 key={fieldName}
                                 setFormValue={this.setFormValue}
                             />);
                         }
                         else if (fieldArray['#type'] === 'item') {
                             form[i].push(<Date
                                 formValues={this.state.formValues}
                                 fieldName={fieldName}
                                 field={fieldArray}
                                 key={fieldName}
                                 setFormValue={this.setFormValue}
                             />);
                         }
                         else if (fieldArray['#type'] === 'geofield_latlon') {
                           form[i].push(<Location
                             formValues={this.state.formValues}
                             fieldName={fieldName}
                             field={fieldArray}
                             key={fieldName}
                             setFormValue={this.setFormValue}
                           />);
                         }
                         else if (fieldArray['#type'] === 'select2_hidden') {
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
             sceneRoutes[groupName] = <View style={{ width: 200, height: 200}}>{form[p]}</View>;
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
        return <View>
            <JSONTree data={this.props.form} />
            {buttonGroup}
            {form[this.state.selectedIndex]}
            <Button
                title="Save"
                onPress={this.saveNode}
            />
        </View>;
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