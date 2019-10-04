import React from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text, TouchableHighlight,
  TouchableOpacity,
  View,
  WebView
} from 'react-native';
import Validator from 'validator';
import {Overlay} from "react-native-elements";


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
    header: null,
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
      }
    })
      .then((response) => response.text())
      .then((html) => {

        isLoggedInBrowser = html.includes(' logged-in');
        this.setState({isLoggedInBrowser: isLoggedInBrowser});
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
                loading: false
              });

            })
            .catch((error) => {
              console.error(error);
            });

        }
      })
      .catch((error) =>{
        this.setState({
          loading: false
        });
      });
  }


  /**
   * Checks browser login status by fetching the homepage HTML and checking for logged-in class
   * @returns {boolean}
   * @private
   */
  _checkBrowserLoginStatus = async (url) => {
    let isLoggedInBrowser = false;

    try {
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }
      });
      const html = await response.text();
      // Might be better to use a dom parser
      isLoggedInBrowser = html.includes(' logged-in');
    } catch (e) {
      isLoggedInBrowser = false;
    }

    return isLoggedInBrowser;
  }


  render() {

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
        <View style={styles.container}>
          <TouchableHighlight style={styles.buttonContainer} onPress={() => this.props.navigation.navigate('Login')}>
            <Text>Please Log In to Browse Offline</Text>
          </TouchableHighlight>
        </View>
      )
    }

    return (
      <View style={styles.container}>
        {activityIndicator}
        <WebView
          source={{uri: this.state.targetUrl}}
          style={{marginTop: 20}}
          useWebKit={true}
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
  developmentModeText: {
    marginBottom: 20,
    color: 'rgba(0,0,0,0.4)',
    fontSize: 14,
    lineHeight: 19,
    textAlign: 'center',
  },
  contentContainer: {
    paddingTop: 30,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  welcomeImage: {
    width: 100,
    height: 80,
    resizeMode: 'contain',
    marginTop: 3,
    marginLeft: -10,
  },
  getStartedContainer: {
    alignItems: 'center',
    marginHorizontal: 50,
  },
  homeScreenFilename: {
    marginVertical: 7,
  },
  codeHighlightText: {
    color: 'rgba(96,100,109, 0.8)',
  },
  codeHighlightContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 3,
    paddingHorizontal: 4,
  },
  getStartedText: {
    fontSize: 17,
    color: 'rgba(96,100,109, 1)',
    lineHeight: 24,
    textAlign: 'center',
  },
  tabBarInfoContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...Platform.select({
      ios: {
        shadowColor: 'black',
        shadowOffset: {height: -3},
        shadowOpacity: 0.1,
        shadowRadius: 3,
      },
      android: {
        elevation: 20,
      },
    }),
    alignItems: 'center',
    backgroundColor: '#fbfbfb',
    paddingVertical: 20,
  },
  tabBarInfoText: {
    fontSize: 17,
    color: 'rgba(96,100,109, 1)',
    textAlign: 'center',
  },
  navigationFilename: {
    marginTop: 5,
  },
  helpContainer: {
    marginTop: 15,
    alignItems: 'center',
  },
  helpLink: {
    paddingVertical: 15,
  },
  helpLinkText: {
    fontSize: 14,
    color: '#2e78b7',
  },
});
