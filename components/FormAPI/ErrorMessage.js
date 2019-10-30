import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import * as Colors from "../../constants/Colors";

export default class ErrorMessage extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {

    let error = [];
    if (this.props.error) {
      error.push(<Text style={styles.errorStyle} key={0}>{this.props.error}</Text>);
    }
    return <View>
      {error}
    </View>;
  }
}

const styles = StyleSheet.create({
  errorStyle: {
    color: Colors.default.errorBackground,
    fontSize: 18,
    marginBottom: 10,
    marginTop: 10
  }
});
