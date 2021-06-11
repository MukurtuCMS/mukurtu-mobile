import React from 'react';
import {Text, View} from 'react-native';

export class Term extends React.Component {

  constructor(props) {
    super(props);

    this.state = {
    }
  }

  componentDidMount() {

    const data = {
      method: 'get',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.props.token,
        //'Cookie': this.props.cookie,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': 0
      }
    };


    fetch(this.props.url + '/app/tax-term/' + this.props.tid + '.json', data)
      .then((response) => response.json())
      .then((term) => {
        this.setState({'name': term.name})
      })
      .catch((error) => {
        console.error(error);
      });

  }


  render() {

    return (
      <View>
        {/*<Text>{value.label}</Text>*/}
        <Text>{this.state.name}</Text>
      </View>
    )
  }
}

