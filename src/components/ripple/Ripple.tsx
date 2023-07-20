import React, {ReactElement, memo, useImperativeHandle, useState} from 'react';
import {StyleSheet, View} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

export type RippleTargetEvent = {x: number; y: number};

type RippleProps = {
  children: ReactElement;
  duration?: number;
};

export type RippleRef = {
  onPress: ({x, y}: RippleTargetEvent) => void;
};

const Ripple = React.forwardRef<RippleRef, RippleProps>(
  ({children, duration = 500}, ref) => {
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

    useImperativeHandle(ref, () => ({
      onPress: ({x, y}) => {
        'worklet';
        centerX.value = x;
        centerY.value = y;
        rippleOpacity.value = 1;

        scale.value = 0;
        scale.value = withTiming(1, {duration}, success => {
          if (success) {
            isFinished.value = success;
            scale.value = withTiming(0, {duration: 0});
          }
        });
      },
    }));

    return (
      <View
        pointerEvents="none"
        onLayout={event => {
          setRadius(
            Math.sqrt(event.nativeEvent.layout.width ** 2) +
              event.nativeEvent.layout.height ** 2,
          );
        }}>
        {radius !== -1 && (
          <Animated.View
            style={[
              styles.container,
              animatedStyle,
              {
                width: radius * 2,
                height: radius * 2,
                borderRadius: radius,
              },
            ]}>
            {children}
          </Animated.View>
        )}
      </View>
    );
  },
);

const styles = StyleSheet.create({
  container: {
    top: 0,
    left: 0,
    zIndex: 1111,
    position: 'absolute',
  },
});

export default memo(Ripple);
