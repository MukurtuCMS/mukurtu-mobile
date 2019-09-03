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
          return response;
        })
        .then((fields) => {

          const data = {
            method: 'get',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'X-CSRF-Token': this.props.token,
              'Cookie': this.props.cookie,
              'Cache-Control': 'no-cache, no-store, must-revalidate',
              'Pragma': 'no-cache',
              'Expires': 0
            }
          };
          // If there are referenced nodes, we need to retrieve them to get their titles
          for (let [key, value] of Object.entries(this.props.viewableFields[this.props.fieldName]['fields'])) {
            if (fields[this.props.pid][key]) {
              // Node reference
              if (typeof fields[this.props.pid][key] !== 'undefined' &&
                  typeof fields[this.props.pid][key]['und'] !== 'undefined' &&
                  typeof fields[this.props.pid][key]['und']['0']['target_id'] !== 'undefined'
              ) {
                for (let i = 0; i < fields[this.props.pid][key]['und'].length; i++) {
                  let nid = fields[this.props.pid][key]['und'][i]['target_id'];


                  // These nids won't necessarily be in our synced nodes, so we have to fetch it and then get the title
                  fetch(this.props.url + '/app/node/' + nid + '.json', data)
                      .then((response) => response.json())
                      .then((node) => {
                        this.setState({[nid]: node.title})
                      })
                      .catch((error) => {
                        console.error(error);
                      });
                }

              }
              // Get our taxonomy term titles
              else if (typeof fields[this.props.pid][key] !== 'undefined' &&
                  typeof fields[this.props.pid][key]['und'] !== 'undefined' &&
                  typeof fields[this.props.pid][key]['und']['0']['tid'] !== 'undefined'
              ) {
                for (let i = 0; i < this.state.fields[this.props.pid][key]['und'].length; i++) {
                  let tid = this.state.fields[this.props.pid][key]['und'][i]['tid'];

                  fetch(this.props.url + '/app/tax-term/' + tid + '.json', data)
                      .then((response) => response.json())
                      .then((term) => {
                        this.setState({[tid]: term.name})
                      })
                      .catch((error) => {
                        console.error(error);
                      });


                }
              }
            }
          }
        });
  }


  render() {

    let renderedItem = [];
    // First check for text value
    if (this.state && this.state.fields && this.state.fields[this.props.pid] && this.props.viewableFields) {
      for (let [key, value] of Object.entries(this.props.viewableFields[this.props.fieldName]['fields'])) {
        if (this.state.fields[this.props.pid][key]) {
          if (typeof this.state.fields[this.props.pid][key] !== 'undefined' &&
              typeof this.state.fields[this.props.pid][key]['und'] !== 'undefined' &&
              typeof this.state.fields[this.props.pid][key]['und']['0']['value'] !== 'undefined'
          ) {
            renderedItem.push(
                <View key={key}>
                  <Text style={styles.titleTextStyle}>{value.label}</Text>
                  <Text>{this.state.fields[this.props.pid][key]['und']['0']['value']}</Text>
                </View>
            )
          }
          // Taxonomy term
          else if (typeof this.state.fields[this.props.pid][key] !== 'undefined' &&
              typeof this.state.fields[this.props.pid][key]['und'] !== 'undefined' &&
              typeof this.state.fields[this.props.pid][key]['und']['0']['tid'] !== 'undefined'
          ) {
            for (let i = 0; i < this.state.fields[this.props.pid][key]['und'].length; i++) {

              let tid = this.state.fields[this.props.pid][key]['und'][i]['tid'];
              if (this.state[tid]) {
                let termTitle = this.state[tid];
                renderedItem.push(
                    <View key={i}>
                      <Text style={styles.titleTextStyle}>{value.label}</Text>
                      <Text>{termTitle}</Text>
                    </View>
                )
              }
            }

          }
          // Node reference
          else if (typeof this.state.fields[this.props.pid][key] !== 'undefined' &&
              typeof this.state.fields[this.props.pid][key]['und'] !== 'undefined' &&
              typeof this.state.fields[this.props.pid][key]['und']['0']['target_id'] !== 'undefined'
          ) {
            for (let i = 0; i < this.state.fields[this.props.pid][key]['und'].length; i++) {
              let nid = this.state.fields[this.props.pid][key]['und'][i]['target_id'];
              if(this.state[nid]) {
                let nodeTitle = this.state[nid];
                renderedItem.push(
                    <View key={i}>
                      <Text style={styles.titleTextStyle}>{value.label}</Text>
                      <Text>{nodeTitle}</Text>
                    </View>
                );
              }
            }
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

const styles = StyleSheet.create({
  titleTextStyle: {
    marginBottom: 5,
    color: '#000',
    fontSize: 24
  }
});


