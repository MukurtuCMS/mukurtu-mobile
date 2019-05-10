import React from 'react';
import { View, Dimensions, StyleSheet } from 'react-native';
import Textfield from './Textfield';
import Textarea from './Textarea';
import Radios from './Radios';
import Select from './Select';
import JSONTree from "react-native-json-tree";
import { ButtonGroup, Button } from "react-native-elements";
import axios from "axios";
import {SQLite} from "expo";

const db = SQLite.openDatabase('db.db');

export default class FormComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {formValues: {}, selectedIndex: 0, ajax: ''}
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

    setFormValue(newFieldName, newValue) {
        if (this.state.formValues) {
            const formValues = this.state.formValues;
            Object.assign(formValues, {[newFieldName]: newValue});
            this.setState({formValues: formValues});
        }
    }

    setFormValueCheckbox(newFieldName, newKey, newValue) {
        if (this.state.formValues) {
            const formValues = this.state.formValues;
            Object.assign(formValues, {[newFieldName]: {[newKey]: newValue}});
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
                                 if (fieldArray['default'] !== undefined) {
                                     fieldArray = field['und'][0]['default'];
                                 }
                                 if (fieldArray['sid'] !== undefined) {
                                     fieldArray = field['und'][0]['sid'];
                                 }
                             }
                         }
                     }

                     if (typeof fieldArray === 'object' && fieldArray['#type']) {
                         if (fieldArray['#type'] === 'textfield') {
                             form[i].push(<Textfield
                                 formValues={this.state.formValues}
                                 fieldName={fieldName}
                                 field={fieldArray}
                                 key={fieldName}
                                 setFormValue={this.setFormValue}
                             />);
                         }
                         if (fieldArray['#type'] === 'text_format') {
                             form[i].push(<Textarea
                                 formValues={this.state.formValues}
                                 fieldName={fieldName}
                                 field={fieldArray}
                                 key={fieldName}
                                 setFormValue={this.setFormValue}
                             />);
                         }
                         if (fieldArray['#type'] === 'radios') {
                             form[i].push(<Radios
                                 formValues={this.state.formValues}
                                 fieldName={fieldName}
                                 field={fieldArray}
                                 key={fieldName}
                                 setFormValueCheckbox={this.setFormValueCheckbox.bind(this)}
                             />);
                         }
                         if (fieldArray['#type'] === 'select') {
                             form[i].push(<Select
                                 formValues={this.state.formValues}
                                 fieldName={fieldName}
                                 field={fieldArray}
                                 key={fieldName}
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
             sceneRoutes[groupName] = <View style={{ width: 200, height: 200}}>{form[p]}</View>;
         }
         console.log(buttons);
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