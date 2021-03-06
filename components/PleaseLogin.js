import React from 'react';
import {Image, StyleSheet, Text, TouchableHighlight, View} from 'react-native';

export class PleaseLogin extends React.Component {

  render() {

    let text = 'Please Log In';

    if (this.props.loginText) {
      text = this.props.loginText;
    }

    let loginButton;
    if(this.props.hideButton !== true) {
      loginButton = (
        <TouchableHighlight
          style={[styles.buttonContainer, styles.loginButton]}
          onPress={() => this.props.navigation.navigate('Login')}>
          <Text style={styles.loginText}>Log In</Text>
        </TouchableHighlight>
      );
    }

    return (
      <View style={styles.wrapper}>
        <Text style={styles.titleText}>Welcome to Mukurtu Mobile</Text>
        <Text style={styles.text}>{text}</Text>
        {loginButton}
        <Image
          style={styles.image}
          source={require('../assets/images/logo.png')}
        />
      </View>
    )
  }
}

const styles = StyleSheet.create({

  wrapper: {
    padding: 30,
    textAlign: 'center',
    justifyContent: 'center',
    alignItems: 'center'
  },

  text: {
    fontSize: 18,
    textAlign: 'center',
    paddingBottom: 20
  },
  buttonContainer: {
    height: 48,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderRadius: 5,
    alignSelf: 'stretch',
    marginTop: 2
  },
  loginButton: {
    backgroundColor: "#159ec4",
  },
  loginText: {
    color: 'white',
  },
  titleText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10
  },
  image: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10
  }
});
