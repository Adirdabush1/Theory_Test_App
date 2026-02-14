import React from "react";
import { Platform, ViewStyle } from "react-native";
import LottieView from "lottie-react-native";
import Lottie from "lottie-react";

interface Props {
  source: any;
  style?: ViewStyle;
}

export default function LottieWrapper({ source, style }: Props) {
  // אם זה Web → חייב CSS אמיתי
  if (Platform.OS === "web") {
    const webStyle: React.CSSProperties = {
      width: style?.width as number | undefined,
      height: style?.height as number | undefined,
      // אפשר להוסיף כאן עוד אם תרצה
    };

    return (
      <Lottie
        animationData={source}
        loop
        autoplay
        style={webStyle}
      />
    );
  }

  // iOS + Android (React Native)
  return (
    <LottieView
      source={source}
      autoPlay
      loop
      style={style}
    />
  );
}
