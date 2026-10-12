import { Image, Text, View } from 'react-native';
import { fonts, useTheme } from '../theme';

const COVER_COLORS = ['#8A1620', '#B01E2B', '#4A4A4A', '#6B1018', '#2F2F2F', '#7A1A24'];
const STATUS = { playing: 'Playing', completed: 'Completed', want_to_play: 'Want to Play' };

function Pill({ label, bg, fg, outline }) {
  return (
    <View
      style={{
        backgroundColor: bg, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99,
        borderWidth: outline ? 1 : 0, borderColor: outline,
      }}
    >
      <Text style={{ fontFamily: fonts.bold, fontSize: 11, color: fg }}>{label}</Text>
    </View>
  );
}

export default function GameCard({ game }) {
  const t = useTheme();
  const hash = [...game.title].reduce((n, c) => n + c.charCodeAt(0), 0);
  const statusKey = game.status === 'want_to_play' ? 'want' : game.status;
  const sb = t.badge[statusKey];
  const rating = game.rating != null ? `${Number(game.rating).toFixed(1)} ★` : 'Not rated';
  const hours = `${Number(game.hours_played || 0)} h`;

  return (
    <View
      style={{
        flexDirection: 'row', gap: 12, padding: 10, borderRadius: 14, borderWidth: 1,
        borderColor: t.border, backgroundColor: t.surface,
      }}
    >
      {game.cover_url ? (
        <Image source={{ uri: game.cover_url }} style={{ width: 64, height: 84, borderRadius: 10 }} />
      ) : (
        <View
          style={{
            width: 64, height: 84, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
            backgroundColor: COVER_COLORS[hash % COVER_COLORS.length],
          }}
        >
          <Text style={{ fontFamily: fonts.bold, fontSize: 26, color: '#FFFFFF' }}>
            {game.title.charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ fontFamily: fonts.bold, fontSize: 16, color: t.text }}>
          {game.title}
        </Text>
        {!!game.genre && (
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.muted, marginTop: 2 }}>
            {game.genre}
          </Text>
        )}
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          <Pill label={STATUS[game.status]} bg={sb.bg} fg={sb.fg} />
          {game.is_installed ? (
            <Pill label="Installed" bg="transparent" fg={t.text} outline={t.text} />
          ) : (
            <Pill label="Not Installed" bg={t.badge.notInstalled.bg} fg={t.badge.notInstalled.fg} />
          )}
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 'auto' }}>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.text }}>{rating}</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: t.muted }}>{hours}</Text>
        </View>
      </View>
    </View>
  );
}
