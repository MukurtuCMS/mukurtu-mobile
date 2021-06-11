import React from 'react';
import {
  ActivityIndicator, SafeAreaView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { WebView } from 'react-native-webview';
import Validator from 'validator';
import {Overlay} from "react-native-elements";
import {PleaseLogin} from "../components/PleaseLogin";


export default class WebviewScreen extends React.Component {
  constructor(props) {
    super(props);
    const {navigation, screenProps} = this.props;

    this.state = {
      targetUrl: '',
      isLoggedInBrowser: false,
      lastVisitedUrl: null,
      loading: true,
      lastPropsPath: ''
    };
  }

  static navigationOptions = {
    title: 'Browse Site'
  };

  componentDidMount() {

    let isLoggedInBrowser = false;

 /*    let url = this.props.screenProps.siteUrl;
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
      }); */

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

    const propsPath = this.props.navigation.getParam('path', '');
    let webUrl = this.props.screenProps.siteUrl + propsPath;
    if (this.state.targetUrl.length > 0 && propsPath === this.state.lastPropsPath) {
      webUrl = this.state.targetUrl;
    }

    // If it's an invalid URL or the user is not logged in, don't open browser
    if (!this.props.screenProps.loggedIn) {
      return (

        <PleaseLogin
          loginText='Please Log In to Browse Site.'
          navigation={this.props.navigation}
        />
      );

    }

    return (
      <SafeAreaView style={styles.container}>

        {activityIndicator}
        <WebView
          source={{
            uri: webUrl,
            headers: {
              //Cookie: this.props.screenProps.cookie
            }
          }}
         // mixedContentMode={'always'}
          useWebKit={true}
          allowsFullscreenVideo={true}
          allowsInlineMediaPlayback={true}
          /*onShouldStartLoadWithRequest={(request) => {
            // If we have an invalid url don't go there. Stops pop-ups.
            if (!Validator.isURL(request.url)) return false;
            // If we're loading the current URI, allow it to load
            if (request.url === webUrl) return true;
            // We're loading a new URL -- change state first
            this.setState({targetUrl: request.url, lastPropsPath: propsPath})
            return false;
          }}*/
          onLoadStart={() => this.setState({loading: true})}
          onLoad={() => this.setState({loading: false})}
          // If a site takes longer than ten seconds to load, don't block the UI any more.
          useEffect={() => setTimeout(() => { this.setState({ loading: false }); }, 10000)}
        />
      </SafeAreaView>
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
