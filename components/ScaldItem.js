import React from 'react';
import {Image, StyleSheet, Text, View, WebView} from 'react-native';

export class ScaldItem extends React.Component {
  // A lot of overlap between this and the form scald components,
  // but those currently do a bunch of state updating on the node form,
  // and it seems very complicated to abstract that so that they could use a common scalditem component.

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
    fetch(url + '/app/scald/retrieve/' + this.props.sid, data)
        .then((response) => {
          return response.json();
        })
        .then((response) => {
          this.setState({[this.props.sid]: response});
        });
  }

  render() {

    let renderedItem;
    // First check for youtube video
    if (this.state && this.state[this.props.sid]) {
      let response = this.state[this.props.sid];
      if (response.base_id && response.provider === 'scald_youtube') {

        renderedItem = <WebView
            style={{
              height: 200,
              width: 200
            }}
            javaScriptEnabled={true}
            source={{uri: 'https://www.youtube.com/watch?v=' + response.base_id}}
        />;


      } else if (response.base_id && response.provider === 'scald_file') {
        renderedItem = <Text
            style={{
              height: 200,
              width: 200
            }}>
          {response.base_entity.filename}
        </Text>;

      } else if (typeof response.base_entity !== 'undefined') {

        renderedItem = <Image
            source={{uri: response.thumbnail_url}}
            style={{
              height: 200,
              width: 200
            }}/>;
      }
    }


    return (
        <View>
          {renderedItem}
        </View>
    )
  }
}

