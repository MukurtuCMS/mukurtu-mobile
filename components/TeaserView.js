import React from 'react'
import {StyleSheet, View, Text, Image, TouchableOpacity} from "react-native";
import {Feather} from '@expo/vector-icons';
import PropTypes from 'prop-types'
import * as Colors from '../constants/Colors';

export default function TeaserView({image, title, type, meta, onClick, icon}) {
  return (
    <TouchableOpacity onPress={onClick}>
      <View style={styles.container}>
        {image.length > 0 && <Image
          style={styles.image}
          source={{uri: image}}
          resizeMode={'cover'}
        />}
        {image.length === 0 && icon.length > 0 && <Feather
          style={styles.icon}
          name={icon}
          size={40}
          color="black"
        />}
        <View style={styles.textContainer}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.type}>{type}</Text>
          {meta.map((item, i) => {
            return (<View key={`meta-line-${i}`} style={styles.meta}>
              {item.title != null &&
              <Text style={styles.metaTitle}>{item.title}:</Text>}
              <Text style={styles.metaValue}>{item.value}</Text>
            </View>);
          })}
        </View>
        <Feather name="chevron-right"style={styles.iconArrow} size={24} color="black" />
      </View>
    </TouchableOpacity>
  )
}

TeaserView.propTypes = {
  image: PropTypes.string,
  title: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  meta: PropTypes.array,
  onClick: PropTypes.func.isRequired,
  icon: PropTypes.string
}

TeaserView.defaultProps = {
  image: '',
  icon: '',
  meta: []
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 5,
    backgroundColor: Colors.default.mediumGray
  },
  textContainer: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 10
  },
  title: {
    fontSize: 18
  },
  type: {
    fontSize: 12,
    marginBottom: 10
  },
  icon: {
    padding: 20,
    maxWidth: 80,
    maxHeight: 80,
    alignSelf: 'center'
  },
  iconArrow: {
    alignSelf: 'center'
  },
  image: {
    height: '100%',
    minHeight: 80,
    width: 80,
    alignSelf: 'center'
  },
  meta: {
    flexDirection: 'row',
    marginBottom: 3,
    alignItems: 'flex-start',
    marginRight: 35
  },
  metaTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    paddingRight: 3
  },
  metaValue: {
    fontSize: 13
  }
});
