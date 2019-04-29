import React from 'react';
import { View } from 'react-native';
import Textfield from './Textfield';
import Textarea from './Textarea';
import Radios from './Radios';
import Select from './Select';

export default class FormComponent extends React.Component {
    constructor(props) {
        super(props);
        this.state = {formValues: {}}
        this.setFormValue = this.setFormValue.bind(this);
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

    render() {
        // iterate through form and build form elements
        let form = [];
        for (const [fieldName, field] of Object.entries(this.props.form)) {
            let fieldArray = field;
            // check that the array has a key of type before proceeding
            if (fieldArray['#type'] !== undefined) {
                // If field type is container, we need to drill down and find the form to render
                if (fieldArray['#type'] === 'container') {
                    fieldArray = field['und'];

                    if (fieldArray['#type'] === undefined) {
                        fieldArray = field['und'][0];

                        if (fieldArray['#type'] === undefined) {
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
                        form.push(<Textfield
                            formValues={this.state.formValues}
                            fieldName={fieldName}
                            field={fieldArray}
                            key={fieldName}
                            setFormValue={this.setFormValue}
                        />);
                    }
                    if (fieldArray['#type'] === 'text_format') {
                        form.push(<Textarea
                            formValues={this.state.formValues}
                            fieldName={fieldName}
                            field={fieldArray}
                            key={fieldName}
                            setFormValue={this.setFormValue}
                        />);
                    }
                    if (fieldArray['#type'] === 'radios') {
                        form.push(<Radios
                            formValues={this.state.formValues}
                            fieldName={fieldName}
                            field={fieldArray}
                            key={fieldName}
                            setFormValueCheckbox={this.setFormValueCheckbox.bind(this)}
                        />);
                    }
                    if (fieldArray['#type'] === 'select') {
                        form.push(<Select
                            formValues={this.state.formValues}
                            fieldName={fieldName}
                            field={fieldArray}
                            key={fieldName}
                            setFormValue={this.setFormValue}
                        />);
                    }
                } else {
                    console.log(fieldName);
                }
            }
        }
        return <View>
            {form}
        </View>;
    }
}