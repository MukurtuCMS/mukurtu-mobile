import React from 'react';
import {View, Text} from 'react-native';
import {CheckBox} from "react-native-elements";
import Textfield from "./Textfield";

export default class Paragraph extends React.Component {

  constructor(props) {
    super(props);
    this.state = {
      checked: this.props.field['#default_value'] === 1
    };

  }

  render() {

    let debugProps = this.props;
    let paragraphForm = [];

    paragraphForm.push(<Text>Test Paragraph Form</Text>);

    let fields = this.props.field;

    for (const key of Object.keys(fields)) {
      if (fields.hasOwnProperty(key) && key.charAt(0) !== '#') {


        let subfield = fields[key];
        if(subfield['#type'] === 'container' && subfield['und'] !== undefined) {
          subfield = subfield['und'][0];
        }

        if(subfield !== undefined && subfield['#columns'] !== undefined) {
          paragraphForm.push(<Textfield
              formValues={this.props.formValues}
              fieldName={subfield['#field_name']}
              field={subfield}
              key={subfield['#field_name']}
              setFormValue={this.setFormValue}
          />);

        }

        // We have to sort these into




        let breakpoint;


      }


    }



    return <View>
      {paragraphForm}

    </View>;
  }
}