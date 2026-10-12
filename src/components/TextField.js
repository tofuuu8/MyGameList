import { useState } from 'react';
import { Text, TextInput, View } from 'react-native';
import { fonts, useTheme } from '../theme';

export default function TextField({ label, style, inputStyle, ...props }) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={style}>
      <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.muted, marginBottom: 6 }}>
        {label}
      </Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={t.muted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoCapitalize="none"
        autoCorrect={false}
        style={{
          height: 48,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: focused ? t.red : t.border,
          backgroundColor: t.surface,
          color: t.text,
          paddingHorizontal: 14,
          fontFamily: fonts.regular,
          fontSize: 15,
          ...inputStyle,
        }}
        {...props}
      />
    </View>
  );
}
