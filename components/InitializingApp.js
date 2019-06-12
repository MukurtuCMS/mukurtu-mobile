import React from 'react';
import { TextInput, View, Text, StyleSheet, Image } from 'react-native';

export default class InitializingApp extends React.Component {

    render() {
        return <View style={styles.container}>
            <Image
              style={styles.image}
              source={require('../assets/images/logo.png')}
            />
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
    image: {
        justifyContent: 'center',
        alignItems: 'center',
    }
});