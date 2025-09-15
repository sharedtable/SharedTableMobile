import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';
import { icons, IconName } from '@/assets';
import { scaleWidth } from '@/utils/responsive';

interface IconProps {
  name: IconName;
  size?: number;
  style?: StyleProp<ImageStyle>;
  tintColor?: string;
}

export const Icon: React.FC<IconProps> = ({ 
  name, 
  size = 24, 
  style,
  tintColor 
}) => {
  const scaledSize = scaleWidth(size);
  
  return (
    <Image
      source={icons[name]}
      style={[
        {
          width: scaledSize,
          height: scaledSize,
          tintColor,
        },
        style,
      ]}
      resizeMode="contain"
    />
  );
};