import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Linking, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { loadGameInfo } from '../lib/gameInfo';
import { fonts, useTheme } from '../theme';

const formatDate = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

// "About this game": release date, developer, score, description and screenshots from RAWG.
export default function GameAbout({ game, onFoundId }) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const [info, setInfo] = useState(undefined); // undefined = loading, null = nothing found
  const [expanded, setExpanded] = useState(false);
  const [viewing, setViewing] = useState(null);

  useEffect(() => {
    let off = false;
    loadGameInfo(game)
      .then((i) => {
        if (off) return;
        setInfo(i);
        if (i && !game.rawg_id && onFoundId) onFoundId(i.id);
      })
      .catch(() => { if (!off) setInfo(null); });
    return () => { off = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.id]);

  const card = { backgroundColor: t.surface, borderColor: t.border, borderWidth: 1, borderRadius: 14, padding: 14, gap: 10 };
  const small = { fontFamily: fonts.regular, fontSize: 13, color: t.muted, lineHeight: 19 };

  if (info === undefined) {
    return (
      <View style={[card, { alignItems: 'center' }]}>
        <ActivityIndicator color={t.red} />
      </View>
    );
  }
  if (!info) return null; // nothing found for this game, so show nothing

  const long = info.description.length > 420;
  const description = expanded || !long ? info.description : `${info.description.slice(0, 420).trim()}…`;
  const facts = [
    info.released ? `Released ${formatDate(info.released)}` : null,
    info.developers.length ? info.developers.join(', ') : null,
  ].filter(Boolean);

  return (
    <View style={card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: t.text }}>About this game</Text>
        {!!info.metacritic && (
          <View style={{ borderWidth: 1, borderColor: t.text, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Text accessibilityLabel={`Metacritic score ${info.metacritic}`} style={{ fontFamily: fonts.bold, fontSize: 13, color: t.text }}>
              {info.metacritic}
            </Text>
          </View>
        )}
      </View>

      {facts.map((f) => <Text key={f} style={small}>{f}</Text>)}
      {info.genres.length > 0 && <Text style={small}>{info.genres.join(' · ')}</Text>}

      {info.screenshots.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {info.screenshots.map((uri) => (
            <Pressable key={uri} onPress={() => setViewing(uri)} accessibilityRole="button" accessibilityLabel="Open screenshot">
              <Image source={{ uri }} style={{ width: 200, height: 112, borderRadius: 10, backgroundColor: t.border }} />
            </Pressable>
          ))}
        </ScrollView>
      )}

      {!!info.description && (
        <View>
          <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: t.text, lineHeight: 21 }}>{description}</Text>
          {long && (
            <Pressable onPress={() => setExpanded((e) => !e)} accessibilityRole="button" style={{ minHeight: 40, justifyContent: 'center' }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: t.link }}>{expanded ? 'Show less' : 'Read more'}</Text>
            </Pressable>
          )}
        </View>
      )}

      <Pressable onPress={() => Linking.openURL('https://rawg.io')} accessibilityRole="link" style={{ minHeight: 32, justifyContent: 'center' }}>
        <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: t.muted }}>Game data from RAWG</Text>
      </Pressable>

      <Modal visible={!!viewing} transparent animationType="fade" onRequestClose={() => setViewing(null)}>
        <View style={{ flex: 1, backgroundColor: '#000000', justifyContent: 'center' }}>
          {!!viewing && <Image source={{ uri: viewing }} style={{ width: '100%', height: '70%' }} resizeMode="contain" />}
          <Pressable
            onPress={() => setViewing(null)}
            accessibilityRole="button"
            accessibilityLabel="Close screenshot"
            style={{ position: 'absolute', top: insets.top + 12, right: 16, minHeight: 44, minWidth: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}
          >
            <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: '#FFFFFF' }}>✕</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}
