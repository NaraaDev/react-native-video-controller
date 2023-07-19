import React from 'react';
import {StyleSheet, View} from 'react-native';

import VideoPlayer from '@/screens/VideoPlayer';

export default function App() {
  return (
    <View style={styles.container}>
      <VideoPlayer />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
});
