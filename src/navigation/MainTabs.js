import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TabIcon from '../components/Icons';
import AddGameScreen from '../screens/AddGameScreen';
import DiscoverScreen from '../screens/DiscoverScreen';
import LibraryScreen from '../screens/LibraryScreen';
import MyPcScreen from '../screens/MyPcScreen';
import StatsScreen from '../screens/StatsScreen';
import { fonts, useTheme } from '../theme';

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
