import React from 'react';
import {StyleSheet, View, Dimensions, Text} from 'react-native';
import Carousel, {Pagination} from 'react-native-snap-carousel';
import {ScaldItem} from './ScaldItem';

export class ScaldSwipe extends React.Component {
  constructor(props) {
    super(props);
    let {width, height} = Dimensions.get('window');

    this.state = {
      width: width,
      widthItem: width - 10,
      activeSlide: 0
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
          inSlider={true}
          slideWidth={this.state.width}
        />
      </View>
    );
  }

  get pagination() {
    const { activeSlide } = this.state;
    const entries = this.props.items;

    return (
      <Pagination
        dotsLength={entries.length}
        activeDotIndex={activeSlide}
        containerStyle={{
          paddingVertical: 5,
        }}
        dotStyle={{
          width: 5,
          height: 5,
          borderRadius: 5,
          marginHorizontal: 8,
          backgroundColor: '#333'
        }}
        inactiveDotOpacity={0.4}
        inactiveDotScale={0.6}
      />
    );
  }

  render() {
    return (
      <View style={{height: 320}}>
        <Carousel
          ref={(c) => { this._carousel = c; }}
          data={this.props.items}
          layout={'default'}
          renderItem={this._renderItem}
          sliderWidth={this.state.width - 20}
          sliderHeight={300}
          itemWidth={this.state.width - 22}
          itemHeight={300}
          useScrollView={true}
          slideStyle={{}}
          onSnapToItem={(index) => this.setState({ activeSlide: index }) }
          containerCustomStyle={{
            borderWidth: 1,
            borderColor: '#ccc',
            backgroundColor: '#eee'
          }}
        />
        { this.pagination }
      </View>
    );
  }
}


const styles = StyleSheet.create({
  slide: {
    height: 300
  }
});
