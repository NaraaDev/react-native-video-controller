import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

export default function VideoPlayer() {
  return (
    <View style={styles.screen}>
      <Text>VideoPlayer</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {flex: 1},
});
