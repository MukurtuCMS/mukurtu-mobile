import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default class Required extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {

    let required = [];
    if (this.props.required) {
      required.push(<Text style={styles.requiredStyle} key={0}>* Required</Text>);
    }
    return <View>
      {required}
    </View>;
  }
}

const styles = StyleSheet.create({
  requiredStyle: {
    color: '#d9534f',
    fontSize: 12,
    fontWeight: 'normal',
    textTransform: 'uppercase',
    marginBottom: 5
  }
});
