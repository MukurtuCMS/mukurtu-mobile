import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { WebView } from 'react-native-webview';
import Validator from 'validator';
import {Overlay} from "react-native-elements";
import {PleaseLogin} from "../components/PleaseLogin";
import UnlockOrientation from "../components/UnlockOrientation";


export default class WebviewScreen extends React.Component {
  constructor(props) {
    super(props);
    const {navigation, screenProps} = this.props;

    this.state = {
      targetUrl: this.props.screenProps.siteUrl,
      isLoggedInBrowser: false,
      lastVisitedUrl: null,
      loading: true
    };
  }

  static navigationOptions = {
    title: 'Browse Site'
  };

  componentDidMount() {

    let isLoggedInBrowser = false;

    let url = this.props.screenProps.siteUrl;
    fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.props.screenProps.token,
        'Cookie': this.props.screenProps.cookie
      }
    })
      .then((response) => response.text())
      .then((html) => {

        isLoggedInBrowser = html.includes(' logged-in');
        this.setState({
          isLoggedInBrowser: isLoggedInBrowser,
          // loading: false
        });
        // If we're logged in to app but not browser, get one-time login link
        if (this.props.screenProps.loggedIn && !isLoggedInBrowser) {
          let returnUrl = null;
          let data = {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'X-CSRF-Token': this.props.screenProps.token,
              'Cookie': this.props.screenProps.cookie
            }
          };

          fetch(this.props.screenProps.siteUrl + '/app/one-time-login/retrieve', data)
            .then((response) => response.text())
            .then((responseText) => {

              // Get just the URL from the response text
              responseText = responseText.replace('["', '');

              returnUrl = responseText.replace('"]', '');

              this.setState({
                targetUrl: returnUrl,
                // loading: false
              });

            })
            .catch((error) => {
              console.error(error);
            });

        }
      })
      .catch((error) => {
        this.setState({
          loading: false
        });
      });

    const { navigation } = this.props;
    this.focusListener = navigation.addListener('didBlur', () => {
      this.props.screenProps.checkLogin(true);
    });

  }

  componentWillUnmount() {
    this.focusListener.remove();
  }

  render() {
    if(!this.props.screenProps.isConnected) {
      return(
        <View style={styles.wrapper}>
          <Text style={styles.text}>Browsing Site is Only Available When Connected to the Internet.</Text>
        </View>
      )
    }

    let activityIndicator;
    if (this.state.loading === true) {
      activityIndicator =
        <Overlay
          isVisible={true}
          windowBackgroundColor="rgba(255, 255, 255, .5)"
          overlayBackgroundColor="rgba(255, 255, 255, 1)"
          width="auto"
          height="auto"
        >
          <View style={styles.activityContainer}>
            <Text style={{marginBottom: 10}}>Loading Site...</Text>
            <ActivityIndicator size="large" color="#159EC4"/>
          </View>
        </Overlay>


    }

    // If it's an invalid URL or the user is not logged in, don't open browser
    if (!Validator.isURL(this.state.targetUrl) || !this.props.screenProps.loggedIn) {
      return (

        <PleaseLogin
          loginText='Please Log In to Browse Site.'
          navigation={this.props.navigation}
        />
      );

    }

    return (
      <View style={styles.container}>
        <UnlockOrientation />
        {activityIndicator}
        <WebView
          source={{uri: this.state.targetUrl +  this.props.navigation.getParam('path', '')}}
          useWebKit={true}
          allowsFullscreenVideo={true}
          onLoadStart={() => this.setState({loading: true})}
          onLoad={() => this.setState({loading: false})}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  wrapper: {
    padding: 30,
    textAlign: 'center'
  },
  text: {
    fontSize: 18,
    textAlign: 'center',
    paddingBottom: 20
  },
});
