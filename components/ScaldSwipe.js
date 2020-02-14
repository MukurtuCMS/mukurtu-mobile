import React, {Component} from 'react';
import {StyleSheet, View, Dimensions, Text} from 'react-native';
import Carousel from 'react-native-snap-carousel';
import {ScaldItem} from './ScaldItem';

export class ScaldSwipe extends React.Component {
  constructor(props) {
    super(props);
    let {width, height} = Dimensions.get('window');

    this.state = {
      width: width,
      widthItem: width - 10,
    }
  }

  _renderItem = ({item, index}) => {
    return (
      <View style={styles.slide}>
        <ScaldItem
          token={this.props.token}
          cookie={this.props.cookie}
          url={this.props.siteUrl}
          sid={item.sid}
          db={this.props.db}
          key={index}
          documentDirectory={this.props.documentDirectory}
        />
      </View>
    );
  }

  render() {
    return (
      <View style={{height: 300}}>
        <Carousel
          // ref={(c) => { this._carousel = c; }}
          data={this.props.items}
          layout={'default'}
          renderItem={this._renderItem}
          sliderWidth={this.state.width - 20}
          sliderHeight={300}
          itemWidth={this.state.width - 22}
          itemHeight={300}
          useScrollView={true}
          slideStyle={{}}
          containerCustomStyle={{
            borderWidth: 1,
            borderColor: '#ccc',
            backgroundColor: '#eee'
          }}
        />
        <Text>Swipe for more</Text>
      </View>
    );
  }
}


const styles = StyleSheet.create({
  slide: {}
});
