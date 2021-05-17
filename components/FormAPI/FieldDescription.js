import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

export default class FieldDescription extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {

    let description = [];
    if (this.props.description) {
      description.push(<Text
        key={0}
        style={styles.descriptionStyle}>
        {this.props.description}
      </Text>);
    }
    return <View>
      {description}
    </View>;
  }
}

const styles = StyleSheet.create({
  descriptionStyle: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'normal',
    marginBottom: 5
  }
});