import { Component } from 'react';
import { Text, View } from 'react-native';
import Button from './Button';
import { fonts, useTheme } from '../theme';

function Fallback({ onRetry }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Text style={{ fontFamily: fonts.bold, fontSize: 24, color: t.text, textAlign: 'center' }}>
        Something went wrong
      </Text>
      <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.muted, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
        The app ran into an unexpected problem. Please try again.
      </Text>
      <View style={{ alignSelf: 'stretch', marginTop: 24 }}>
        <Button title="Try again" onPress={onRetry} />
      </View>
    </View>
  );
}

// Shows a friendly screen instead of a crash if something unexpected breaks.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.warn('App error:', error);
  }

  render() {
    if (this.state.failed) return <Fallback onRetry={() => this.setState({ failed: false })} />;
    return this.props.children;
  }
}
