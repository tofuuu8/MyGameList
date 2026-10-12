import { Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TabIcon from '../components/Icons';
import LibraryScreen from '../screens/LibraryScreen';
import AddGameScreen from '../screens/AddGameScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import { fonts, useTheme } from '../theme';

function ComingSoon({ title, text }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: t.bg, paddingTop: insets.top + 16, paddingHorizontal: 20 }}>
      <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 26, color: t.text }}>{title}</Text>
      <Text style={{ fontFamily: fonts.regular, fontSize: 15, color: t.muted, marginTop: 12, lineHeight: 22 }}>{text}</Text>
    </View>
  );
}

const StatsScreen = () => <ComingSoon title="Stats" text="Total hours, completed games and installed vs. not installed. Coming soon." />;
const MyPcScreen = () => <ComingSoon title="My PC" text="Enter your RAM, GPU and CPU to see which games your PC can run. Coming soon." />;

const Tab = createBottomTabNavigator();

export default function MainTabs() {
  const t = useTheme();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: t.link,
        tabBarInactiveTintColor: t.muted,
        tabBarStyle: { backgroundColor: t.tabBar, borderTopColor: t.border },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
        tabBarIcon: ({ color }) => <TabIcon name={route.name} color={color} />,
      })}
    >
      <Tab.Screen name="Library" component={LibraryScreen} />
      <Tab.Screen name="Discover" component={DiscoverScreen} />
      <Tab.Screen name="Add" component={AddGameScreen} />
      <Tab.Screen name="Stats" component={StatsScreen} />
      <Tab.Screen name="My PC" component={MyPcScreen} />
    </Tab.Navigator>
  );
}
