import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase } from '../lib/supabase';
import { fonts, useTheme } from '../theme';

const fmt = (n) => String(Math.round(n * 10) / 10);

export default function StatsScreen() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [games, setGames] = useState(null);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      supabase.from('games').select('status,genre,is_installed,hours_played,goal_hours').then(({ data, error: err }) => {
        if (err) setError(err.message);
        else { setGames(data); setError(''); }
      });
    }, [])
  );

  const s = useMemo(() => {
    if (!games) return null;
    const hours = games.reduce((n, g) => n + Number(g.hours_played || 0), 0);
    const byGenre = {};
    games.forEach((g) => {
      if (!g.genre) return;
      const e = byGenre[g.genre] || { hours: 0, count: 0 };
      e.hours += Number(g.hours_played || 0);
      e.count += 1;
      byGenre[g.genre] = e;
    });
    const top = Object.entries(byGenre).sort((a, b) => b[1].hours - a[1].hours || b[1].count - a[1].count)[0];
    return {
      total: games.length,
      hours,
      completed: games.filter((g) => g.status === 'completed').length,
      installed: games.filter((g) => g.is_installed).length,
      topGenre: top ? top[0] : '—',
      playing: games.filter((g) => g.status === 'playing').length,
      want: games.filter((g) => g.status === 'want_to_play').length,
      dropped: games.filter((g) => g.status === 'dropped').length,
      goalsSet: games.filter((g) => g.goal_hours).length,
      goalsMet: games.filter((g) => g.goal_hours && Number(g.hours_played || 0) >= Number(g.goal_hours)).length,
    };
  }, [games]);

  const card = { backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 14 };

  function Stat({ label, value }) {
    return (
      <View style={[card, { flexBasis: '47%', flexGrow: 1, padding: 14 }]}>
        <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.muted }}>{label}</Text>
        <Text numberOfLines={1} adjustsFontSizeToFit style={{ fontFamily: fonts.bold, fontSize: 28, color: t.text, marginTop: 4 }}>
          {value}
        </Text>
      </View>
    );
  }

  function Bar({ label, count, max, color }) {
    return (
      <View>
        <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.text }}>{label} · {count}</Text>
        <View style={{ height: 10, borderRadius: 5, backgroundColor: t.track, marginTop: 6, overflow: 'hidden' }}>
          <View style={{ height: 10, borderRadius: 5, backgroundColor: color, width: `${max ? (count / max) * 100 : 0}%` }} />
        </View>
      </View>
    );
  }

  const header = (
    <View>
      <Text accessibilityRole="header" style={{ fontFamily: fonts.bold, fontSize: 26, color: t.text }}>Stats</Text>
      <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.muted, marginTop: 2 }}>Your library at a glance</Text>
    </View>
  );

  let body;
  if (error) {
    body = <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.link }}>{error}</Text>;
  } else if (!s) {
    body = <ActivityIndicator color={t.red} style={{ marginTop: 32 }} />;
  } else if (s.total === 0) {
    body = (
      <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.muted, lineHeight: 20 }}>
        Add some games to see your stats here.
      </Text>
    );
  } else {
    const maxStatus = Math.max(s.playing, s.completed, s.want, s.dropped);
    body = (
      <>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          <Stat label="Total hours" value={fmt(s.hours)} />
          <Stat label="Completed" value={String(s.completed)} />
          <Stat label="Installed" value={`${s.installed} / ${s.total}`} />
          <Stat label="Top genre" value={s.topGenre} />
        </View>

        <View style={[card, { padding: 14 }]}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: t.text, marginBottom: 10 }}>Install status</Text>
          <View style={{ height: 14, borderRadius: 7, backgroundColor: t.track, overflow: 'hidden' }}>
            <View style={{ height: 14, backgroundColor: t.red, width: `${(s.installed / s.total) * 100}%` }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 }}>
            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.link }}>{s.installed} installed</Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.muted }}>{s.total - s.installed} not installed</Text>
          </View>
        </View>

        <View style={[card, { padding: 14, gap: 12 }]}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: t.text }}>By play status</Text>
          <Bar label="Playing" count={s.playing} max={maxStatus} color={t.red} />
          <Bar label="Completed" count={s.completed} max={maxStatus} color={t.text} />
          <Bar label="Want to Play" count={s.want} max={maxStatus} color={t.muted} />
          <Bar label="Dropped" count={s.dropped} max={maxStatus} color="#7A7A7A" />
        </View>

        {s.goalsSet > 0 && (
          <View style={[card, { padding: 14, gap: 10 }]}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: t.text }}>Play-time goals</Text>
            <View style={{ height: 10, borderRadius: 5, backgroundColor: t.track, overflow: 'hidden' }}>
              <View style={{ height: 10, backgroundColor: t.red, width: `${(s.goalsMet / s.goalsSet) * 100}%` }} />
            </View>
            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.muted }}>{s.goalsMet} of {s.goalsSet} goals reached</Text>
          </View>
        )}
      </>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.bg }}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 20, paddingBottom: 32, gap: 14 }}
    >
      {header}
      {body}
    </ScrollView>
  );
}
