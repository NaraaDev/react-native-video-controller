import React, {useEffect, useRef, useState} from 'react';
import {
  Dimensions,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';

import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  WithTimingConfig,
  cancelAnimation,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import {EdgeInsets, useSafeAreaInsets} from 'react-native-safe-area-context';

import Video, {OnProgressData, OnSeekData} from 'react-native-video';

import {useRefs} from '@/components/ripple/VideoUtils';
import Ripple from '@/components/ripple/Ripple';
import Orientation from 'react-native-orientation-locker';
import {TapButton} from '@/components/TapButton';

const controlTimeout = 2000;
const doubleTapInterval = 500;
const showOnStart = false;

const controlAnimateConfig: WithTimingConfig = {
  duration: 200,
};

const {width, height} = Dimensions.get('window');

const VIDEO_CUSTOM_HEIGHT = width * (9 / 16);

export default function CustomVideoPlayer() {
  const insets = useSafeAreaInsets();
  const insetsRef = useRef<EdgeInsets>(insets);
  const dimension = useWindowDimensions();

  const lBoundary = dimension.width / 2 - insets.left - insets.right - 80;
  const rBoundary = dimension.width - lBoundary - insets.left - insets.right;

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const videoRef = useRef<Video>(null);

  const {rippleLeft, rippleRight} = useRefs();

  useEffect(() => {
    Orientation.lockToPortrait();
    StatusBar.setBarStyle('light-content');

    return () => {
      clearControlTimeout();
      Orientation.lockToPortrait();
    };
  }, []);

  const controlViewOpacity = useSharedValue(0);
  const isFullScreen = useSharedValue(false);
  const videoScale = useSharedValue(1);
  const panIsVertical = useSharedValue(false);
  const doubleTapIsAlive = useSharedValue(false);
  const doubleLeftOpacity = useSharedValue(0);
  const doubleRightOpacity = useSharedValue(0);
  const videoHeight = useSharedValue(VIDEO_CUSTOM_HEIGHT);
  const videoWidth = useSharedValue(width);

  const videoStyle = useAnimatedStyle(() => {
    return {
      transform: [{scale: videoScale.value}],
      height: videoHeight.value,
      width: videoWidth.value,
    };
  });

  const viewStyle = useAnimatedStyle(() => {
    return {
      opacity: controlViewOpacity.value,
      justifyContent: 'center',
    };
  });

  const setControlTimeout = () => {
    'worklet';
    controlViewOpacity.value = withDelay(controlTimeout, withTiming(0));
  };

  const clearControlTimeout = () => {
    'worklet';
    cancelAnimation(controlViewOpacity);
  };

  const resetControlTimeout = () => {
    'worklet';
    clearControlTimeout();
    setControlTimeout();
  };

  const showControlAnimation = () => {
    'worklet';

    controlViewOpacity.value = withTiming(1, controlAnimateConfig);
    setControlTimeout();
  };

  // const hideControlTimeout = () => {
  //   'worklet';
  //   controlViewOpacity.value = withTiming(0, controlAnimateConfig);
  // };

  const checkTapTakesEffect = () => {
    'worklet';

    resetControlTimeout();
    if (controlViewOpacity.value === 0) {
      showControlAnimation();
      return false;
    }

    return true;
  };

  const videoPanGesture = Gesture.Pan()
    .onStart(event => {
      panIsVertical.value =
        Math.abs(event.velocityY) > Math.abs(event.velocityX);
    })
    .onUpdate(event => {
      controlViewOpacity.value = withTiming(0, {duration: 100});

      if (isFullScreen.value) {
        if (event.translationY > 0 && Math.abs(event.translationY) < 100) {
          videoScale.value = 1;
        }
      }
    });

  const singleTapHandler = Gesture.Tap().onEnd((_event, success) => {
    if (success) {
      if (controlViewOpacity.value === 0) {
        controlViewOpacity.value = withTiming(
          1,
          controlAnimateConfig,
          animationEnded => {
            if (animationEnded) {
              setControlTimeout();
            }
          },
        );
      } else {
        controlViewOpacity.value = withTiming(0, controlAnimateConfig);
      }
    }
  });

  const doubleTapHandler = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(doubleTapInterval)
    .onStart(event => {
      doubleTapIsAlive.value = event.x < lBoundary && event.x > rBoundary;
    })
    .onEnd((event, success) => {
      if (success) {
        if (event.numberOfPointers !== 1) {
          return;
        }

        if (event.x < lBoundary) {
          doubleLeftOpacity.value = 1;
          rippleLeft.current?.onPress({x: event.x, y: event.y});

          /*TODO seek video*/
          return;
        }

        if (event.x > rBoundary) {
          doubleRightOpacity.value = 1;
          rippleRight.current?.onPress({x: event.x - lBoundary, y: event.y});

          /*TODO seek video*/
          return;
        }
      }
    });

  const taps = Gesture.Exclusive(doubleTapHandler, singleTapHandler);

  const gesture = Gesture.Race(videoPanGesture, taps);

  //Video functions

  const onLoadStart = () => {
    setLoading(true);
  };

  const onSeek = (data: OnSeekData) => {};

  const onEnd = () => {};

  const onProgress = (data: OnProgressData) => {};

  /**
   * Fullscreen functions
   */

  const enterFullScreen = () => {
    setFullscreen(true);
    StatusBar.setHidden(true, 'fade');
    Orientation.lockToLandscape();
    isFullScreen.value = true;
    videoHeight.value = withTiming(width);
    videoWidth.value = withTiming(height);
  };

  const exitFullScreen = () => {
    setFullscreen(false);
    StatusBar.setHidden(false, 'fade');
    Orientation.lockToPortrait();
    isFullScreen.value = false;
    videoHeight.value = withTiming(VIDEO_CUSTOM_HEIGHT);
    videoWidth.value = withTiming(width);
  };

  const toggleFullScreenOnJS = () => {
    if (isFullScreen.value) {
      exitFullScreen();
    } else {
      enterFullScreen();
    }
  };

  const toggleFullScreen = () => {
    'worklet';
    const status = checkTapTakesEffect();
    if (!status) {
      return;
    }

    runOnJS(toggleFullScreenOnJS)();
  };

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.screen, videoStyle]}>
        <Video
          ref={videoRef}
          paused={true}
          style={styles.video}
          resizeMode="contain"
          fullscreenAutorotate
          controls={false}
          source={{
            uri: 'https://assets.mixkit.co/videos/download/mixkit-countryside-meadow-4075.mp4',
          }}
          onSeek={onSeek}
          onEnd={onEnd}
          onLoadStart={onLoadStart}
          onProgress={onProgress}
        />
        <Animated.View style={StyleSheet.absoluteFillObject}>
          <Animated.View
            style={[
              {
                overflow: 'hidden',
                justifyContent: 'center',
                ...StyleSheet.absoluteFillObject,
              },
              viewStyle,
            ]}>
            <TapButton
              style={{
                height: 50,
                width: 50,
                backgroundColor: 'red',
                alignSelf: 'center',
              }}
              onPress={toggleFullScreen}></TapButton>
          </Animated.View>
        </Animated.View>

        {/* <Ripple
          ref={rippleLeft}
          containerStyle={{width: lBoundary}}
          style={[styles.doubleTap, styles.leftDoubleTap]}
          onAnimationEnd={() => {
            doubleRightOpacity.value = 0;
          }}>
          <Text>sda</Text>
        </Ripple>
        <Ripple
          ref={rippleRight}
          style={[styles.doubleTap, styles.rightDoubleTapContainer]}
          containerStyle={{width: lBoundary}}
          onAnimationEnd={() => {
            doubleRightOpacity.value = 0;
          }}>
          <Text>sdafasd</Text>
        </Ripple> */}
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#000',
    alignItems: 'center',
    zIndex: 10,
    width: '100%',
    justifyContent: 'center',
  },
  video: {height: '100%', width: '100%'},
  doubleTap: {
    position: 'absolute',
    height: '100%',
    justifyContent: 'center',
    alignContent: 'center',
    alignItems: 'center',
  },
  leftDoubleTap: {
    left: 0,
    borderTopRightRadius: width,
    borderBottomRightRadius: width,
  },
  rightDoubleTapContainer: {
    borderTopLeftRadius: width,
    borderBottomLeftRadius: width,
    right: 0,
  },
});
