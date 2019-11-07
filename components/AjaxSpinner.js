import React from 'react';
import { View, StyleSheet, ActivityIndicator, Text} from 'react-native';
import {EvilIcons} from "@expo/vector-icons";

export default class AjaxSpinner extends React.Component {

    render() {
        return <View style={styles.container}>
          <ActivityIndicator size="large" color="#FFF" />
          <Text style={styles.text}>{this.props.text}</Text>
        </View>;
    }
}

const styles = StyleSheet.create({
   container: {
       backgroundColor: "#159EC4",
       flex: 1,
       justifyContent: 'center',
       alignItems: 'center',
   },
  text: {
     color: '#fff'
  }
});
