import React from 'react';
import {Image, StyleSheet, Text, View, WebView} from 'react-native';

export class ParagraphView extends React.Component {


  componentDidMount() {

    const data = {
      method: 'get',
      mode: 'cors',
      cache: 'no-cache',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.props.token,
        'Cookie': this.props.cookie
      },
      redirect: 'follow',
      referrer: 'no-referrer',
    };


    let url = this.props.url;
    let renderedItem = <Text>Item not available</Text>;
    fetch(url + '/app/paragraph/retrieve/' + this.props.pid, data)
        .then((response) => {
          return response.json();
        })
        .then((response) => {
          this.setState({'fields': response});
        });
  }

  render() {

    let renderedItem = [];
    // First check for text value
    if(this.state && this.state.fields && this.state.fields[this.props.pid] && this.props.viewableFields) {
      for (let [key, value] of Object.entries(this.props.viewableFields)) {
        if(this.state.fields[this.props.pid][key]) {
          if (typeof this.state.fields[this.props.pid][key] !== 'undefined' &&
              typeof this.state.fields[this.props.pid][key]['und'] !== 'undefined' &&
              typeof this.state.fields[this.props.pid][key]['und']['0']['value'] !== 'undefined'
          ) {
            renderedItem.push(
                <View>
                  <Text>{value.label}</Text>
                  <Text>{this.state.fields[this.props.pid][key]['und']['0']['value']}</Text>
                </View>
            )
          }
        }
      }

    }


    return (
        <View>
          {renderedItem}
        </View>
    )
  }
}

