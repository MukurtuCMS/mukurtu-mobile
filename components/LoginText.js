import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

export class LoginText extends React.Component {

  render() {

    let text = 'You are not logged in';

    if (this.props.loggedIn) {
      text = 'You are logged in to ' + this.props.url;
    }

    return (
        <View style={styles.header}>
          <Text style={styles.headerText}>{text}</Text>
        </View>
    )
  }
}

const styles = StyleSheet.create({

  header: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingTop: 50,
    paddingBottom: 7,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    borderBottomWidth: 1,

  },

  headerText: {
    textAlign: 'center',
  }

});
