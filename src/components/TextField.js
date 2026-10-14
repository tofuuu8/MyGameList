import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { fonts, useTheme } from '../theme';

// A labelled text box. Password boxes (secureTextEntry) get a Show / Hide button.
export default function TextField({ label, style, inputStyle, secureTextEntry, ...props }) {
  const t = useTheme();
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);
  const isPassword = !!secureTextEntry;

  return (
    <View style={style}>
      <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.muted, marginBottom: 6 }}>
        {label}
      </Text>
      <View>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor={t.muted}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={isPassword && hidden}
          style={{
            height: 48,
            borderRadius: 12,
            borderWidth: 1,
            borderColor: focused ? t.red : t.border,
            backgroundColor: t.surface,
            color: t.text,
            paddingLeft: 14,
            paddingRight: isPassword ? 52 : 14,
            fontFamily: fonts.regular,
            fontSize: 15,
            ...inputStyle,
          }}
          {...props}
        />
        {isPassword && (
          <Pressable
            onPress={() => setHidden((h) => !h)}
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Show password' : 'Hide password'}
            hitSlop={4}
            style={{
              position: 'absolute', right: 0, top: 0, width: 48, height: 48,
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke={t.muted} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              {hidden ? (
                <>
                  <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <Circle cx="12" cy="12" r="3" />
                </>
              ) : (
                <>
                  <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                  <Path d="M1 1l22 22" />
                </>
              )}
            </Svg>
          </Pressable>
        )}
      </View>
    </View>
  );
}
