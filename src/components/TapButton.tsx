import React, {PropsWithChildren} from 'react';
import {Insets, StyleProp, ViewStyle} from 'react-native';

import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';

const hitSlop: Insets = {left: 8, bottom: 4, right: 8, top: 4};

type TapButtonProps = {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export const TapButton: React.FC<PropsWithChildren<TapButtonProps>> = ({
  onPress,
  style,
  children,
}) => {
  const gesture = Gesture.Tap().onEnd((_, success) => {
    if (success) {
      onPress();
    }
  });

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={style} hitSlop={hitSlop}>
        {children}
      </Animated.View>
    </GestureDetector>
  );
};
