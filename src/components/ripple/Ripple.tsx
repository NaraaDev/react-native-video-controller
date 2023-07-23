import React, {
  ReactElement,
  forwardRef,
  memo,
  useImperativeHandle,
  useState,
} from 'react';
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export type RippleTargetEvent = {x: number; y: number};

type RippleProps = {
  children: ReactElement;
  duration?: number;
  containerStyle?: StyleProp<ViewStyle>;
  onAnimationEnd?: () => void;
  style?: StyleProp<ViewStyle>;
};

export type RippleRef = {
  onPress: ({x, y}: RippleTargetEvent) => void;
};

const Ripple = forwardRef<RippleRef, RippleProps>(
  ({children, duration = 600, containerStyle, style, onAnimationEnd}, ref) => {
    const scale = useSharedValue(0);
    const centerX = useSharedValue(0);
    const centerY = useSharedValue(0);
    const isFinished = useSharedValue(false);
    const rippleOpacity = useSharedValue(1);
    const [radius, setRadius] = useState(-1);

    const animatedStyle = useAnimatedStyle(() => {
      const translateX = centerX.value - radius;
      const translateY = centerY.value - radius;

      return {
        transform: [{translateX}, {translateY}, {scale: scale.value}],
      };
    }, [radius]);

    useImperativeHandle(
      ref,
      () => ({
        onPress({x, y}) {
          'worklet';

          centerX.value = x;
          centerY.value = y;

          rippleOpacity.value = 1;
          scale.value = 0;
          scale.value = withTiming(1, {duration}, success => {
            if (success) {
              isFinished.value = success;
              scale.value = withTiming(0, {duration: 0});
              if (onAnimationEnd) {
                runOnJS(onAnimationEnd)();
              }
            }
          });

          console.log(x, y);
        },
      }),
      [],
    );

    return (
      <View
        pointerEvents="none"
        onLayout={event => {
          setRadius(
            Math.sqrt(
              event.nativeEvent.layout.width ** 2 +
                event.nativeEvent.layout.height ** 2,
            ),
          );
        }}
        style={style}>
        {radius !== -1 && (
          <Animated.View style={[styles.overStyle, containerStyle, style]}>
            {children}
            <Animated.View
              style={[
                styles.container,
                {width: radius * 2, height: radius * 2, borderRadius: radius},
                animatedStyle,
              ]}
            />
          </Animated.View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  overStyle: {overflow: 'hidden'},
  container: {
    top: 0,
    left: 0,
    zIndex: 1111,
    position: 'absolute',
    backgroundColor: 'red',
  },
});

export default memo(Ripple);
