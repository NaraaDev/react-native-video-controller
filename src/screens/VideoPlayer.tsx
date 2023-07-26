import React, {useEffect, useRef, useState} from 'react';
import {
  Dimensions,
  StatusBar,
  StyleSheet,
  Text,
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
import Orientation from 'react-native-orientation-locker';
import Video, {
  OnLoadData,
  OnProgressData,
  OnSeekData,
} from 'react-native-video';

import {Slider} from 'react-native-awesome-slider';

import {secondToTime, useRefs} from '@/components/ripple/VideoUtils';
import Ripple from '@/components/ripple/Ripple';
import {TapButton} from '@/components/TapButton';

import PauseIcon from '@/assets/pause.svg';
import PlayIcon from '@/assets/play.svg';
import ForwardIcon from '@/assets/forward.svg';
import BackwardIcon from '@/assets/backward.svg';
import MinimumIcon from '@/assets/minimumScreen.svg';
import MaximumIcon from '@/assets/fullscreen.svg';

const controlTimeout = 2000;
const doubleTapInterval = 500;

const controlAnimateConfig: WithTimingConfig = {
  duration: 200,
};

const {width, height} = Dimensions.get('window');

const VIDEO_CUSTOM_HEIGHT = width * (9 / 16);

export default function CustomVideoPlayer() {
  const insets = useSafeAreaInsets();
  const insetsRef = useRef<EdgeInsets>(insets);
  const isSeeking = useRef(false);
  const dimension = useWindowDimensions();

  const lBoundary = dimension.width / 2 - insets.left - insets.right - 80;
  const rBoundary = dimension.width - lBoundary - insets.left - insets.right;

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [paused, setPaused] = useState(true);

  const videoRef = useRef<Video>(null);

  const {rippleLeft, rippleRight} = useRefs();

  useEffect(() => {
    Orientation.lockToPortrait();
    StatusBar.setBarStyle('light-content');

    return () => {
      clearControlTimeout();
      pause();
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
  const minSliderValue = useSharedValue(0);
  const maxSliderValue = useSharedValue(0);
  const progress = useSharedValue(0);
  const isScrubbing = useSharedValue(false);

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
      backgroundColor: '#00000040',
    };
  });

  const fullScreenSliderStyle = useAnimatedStyle(() => {
    return {
      opacity: withTiming(isFullScreen.value ? 1 : 0),
    };
  });

  const bottomTapsStyle = useAnimatedStyle(() => {
    return {
      width: withTiming(
        isFullScreen.value
          ? height - insetsRef.current.top - insetsRef.current.bottom - 40
          : width - 40,
      ),
    };
  });

  const sliderInsetsStyle = useAnimatedStyle(() => {
    return {
      marginBottom: withTiming(
        isFullScreen.value ? (insets.bottom > 10 ? insets.bottom : 10) : 0,
      ),
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

  const seekByStep = (isBack = false) => {
    if (isBack) {
      seekTo(Math.max(0, currentTime - 10));
    } else {
      seekTo(Math.min(duration, currentTime + 10));
    }
  };

  const doubleTapHandler = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(doubleTapInterval)
    .onStart(event => {
      doubleTapIsAlive.value = event.x < lBoundary && event.x > rBoundary;
    })
    .onEnd((event, success) => {
      if (success) {
        if (event.numberOfPointers !== 1 || !isFullScreen.value) {
          return;
        }

        if (event.x < lBoundary) {
          doubleLeftOpacity.value = 1;
          rippleLeft.current?.onPress({x: event.x, y: event.y});

          runOnJS(seekByStep)(true);
          return;
        }

        if (event.x > rBoundary) {
          doubleRightOpacity.value = 1;
          rippleRight.current?.onPress({x: event.x - rBoundary, y: event.y});

          runOnJS(seekByStep)(false);
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

  const onLoad = (data: OnLoadData) => {
    setDuration(data?.duration);
    maxSliderValue.value = data?.duration;
    setLoading(false);
    setControlTimeout();
  };

  const onSeek = (data: OnSeekData) => {
    if (isScrubbing.value) {
      if (!isSeeking.current) {
        setControlTimeout();
        pause();
      }
      isSeeking.current = false;
      isScrubbing.value = false;

      setCurrentTime(data.currentTime);
    } else {
      isSeeking.current = false;
    }
  };

  const onEnd = () => {};

  const onProgress = (data: OnProgressData) => {
    if (!isScrubbing.value) {
      if (!isSeeking.current) {
        progress.value = data.currentTime;
      }
      setCurrentTime(data.currentTime);
    }
  };

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

  // line Control

  const pause = () => {
    setPaused(true);
  };

  const play = () => {
    setPaused(false);
  };

  const togglePlayOnJS = () => {
    paused ? play() : pause();
  };

  const onPauseTapHandler = () => {
    'worklet';

    const status = checkTapTakesEffect();
    if (!status) {
      return;
    }
    runOnJS(togglePlayOnJS)();
  };

  // slide functions

  const seekTo = (time = 0) => {
    setCurrentTime(time);
    videoRef.current?.seek(time);
  };

  const onTapSlider = () => {
    if (controlViewOpacity.value === 0) {
      showControlAnimation();
    }
  };

  const onSlidingComplete = (val: number) => {
    isSeeking.current = true;
    seekTo(val);
  };

  const onSlidingStart = () => {
    clearControlTimeout();
  };

  const handleBackward = () => {
    'worklet';

    if (!isFullScreen.value) {
      return;
    }

    runOnJS(seekByStep)(true);
  };

  const handleForward = () => {
    'worklet';

    if (!isFullScreen.value) {
      return;
    }
    runOnJS(seekByStep)(false);
  };

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={[styles.screen, videoStyle]}>
        <Video
          ref={videoRef}
          paused={paused}
          style={styles.video}
          resizeMode="contain"
          fullscreenAutorotate
          controls={false}
          source={{
            uri: 'https://assets.mixkit.co/videos/download/mixkit-countryside-meadow-4075.mp4',
          }}
          onSeek={onSeek}
          onEnd={onEnd}
          onLoad={onLoad}
          onLoadStart={onLoadStart}
          onProgress={onProgress}
        />
        <Animated.View style={StyleSheet.absoluteFillObject}>
          <Animated.View style={[styles.container, viewStyle]}>
            <Animated.View style={styles.lineControl}>
              <TapButton onPress={handleBackward} style={fullScreenSliderStyle}>
                <BackwardIcon width={40} height={40} color="#FFF" />
              </TapButton>
              <TapButton onPress={onPauseTapHandler}>
                {paused ? (
                  <PlayIcon width={48} height={48} color="#FFF" />
                ) : (
                  <PauseIcon width={48} height={48} color="#FFF" />
                )}
              </TapButton>
              <TapButton onPress={handleForward} style={fullScreenSliderStyle}>
                <ForwardIcon width={40} height={40} color="#FFF" />
              </TapButton>
            </Animated.View>
            <Animated.View style={[styles.buttonControl, bottomTapsStyle]}>
              <Animated.Text style={[fullScreenSliderStyle, styles.time]}>
                {new Date(currentTime * 1000).toISOString().slice(14, 19)} /
                {new Date(duration * 1000).toISOString().slice(14, 19)}
              </Animated.Text>
              <TapButton onPress={toggleFullScreen}>
                {isFullScreen.value ? (
                  <MinimumIcon color="#FFF" width={24} height={24} />
                ) : (
                  <MaximumIcon color="#FFF" width={24} height={24} />
                )}
              </TapButton>
            </Animated.View>

            <Animated.View
              style={[
                sliderInsetsStyle,
                styles.sliderStyle,
                {
                  width:
                    height -
                    insetsRef.current.top -
                    insetsRef.current.bottom -
                    40,
                },
                fullScreenSliderStyle,
              ]}>
              {duration > 0 && (
                <Slider
                  disable={!isFullScreen.value}
                  isScrubbing={isScrubbing}
                  minimumValue={minSliderValue}
                  maximumValue={maxSliderValue}
                  onSlidingComplete={onSlidingComplete}
                  onSlidingStart={onSlidingStart}
                  onTap={onTapSlider}
                  sliderHeight={2}
                  progress={progress}
                  thumbWidth={12}
                  theme={{
                    bubbleTextColor: '#FFF',
                    minimumTrackTintColor: '#00000090',
                    maximumTrackTintColor: '#ffffff50',
                    bubbleBackgroundColor: '#00000090',
                  }}
                  disableTapEvent
                  bubble={value => {
                    return secondToTime(value);
                  }}
                  thumbScaleValue={controlViewOpacity}
                />
              )}
            </Animated.View>
          </Animated.View>
        </Animated.View>
        <Ripple
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
        </Ripple>
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
  container: {
    overflow: 'hidden',
    alignItems: 'center',
    ...StyleSheet.absoluteFillObject,
  },
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
  lineControl: {
    paddingTop: 36,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    width: '100%',
    flex: 1,
  },
  buttonControl: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderStyle: {marginTop: 10},
  time: {color: '#FFF'},
});
