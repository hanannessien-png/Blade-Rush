/** Knife store: filter tabs, a 3-column grid, a detail sheet and collection bonuses. */
import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { game } from '@/constants/colors';
import { BOSSES } from '../../data/bosses';
import { COLLECTION_BONUS, COLLECTION_ORDER, KNIVES, type KnifeDef } from '../../data/knives';
import { audio } from '../../services/audio';
import { haptic } from '../../services/haptics';
import { useGame } from '../../state/store';
import { fmt, S } from '../../strings';
import { BouncyModal } from '../components/BouncyModal';
import { Confetti } from '../components/Confetti';
import { CurrencyIcon } from '../components/CurrencyIcon';
import { feedbackTap, GlossyButton } from '../components/GlossyButton';
import { Icon } from '../components/Icon';
import { KnifeImage } from '../components/KnifeImage';
import { ProgressBar, Screen } from '../components/Screen';
import { toast } from '../components/Toasts';
import { BodyText, DisplayText } from '../components/Typography';
import { celebrateReward } from '../rewards';
import { useFreeApples } from './HomeScreen';

type Tab = 'all' | 'apples' | 'gems' | 'boss' | 'owned';
const TABS: readonly Tab[] = ['all', 'apples', 'gems', 'boss', 'owned'];

function filterKnives(tab: Tab, owned: string[]): readonly KnifeDef[] {
  switch (tab) {
    case 'apples':
      return KNIVES.filter((k) => k.priceApples !== undefined);
    case 'gems':
      return KNIVES.filter((k) => k.priceGems !== undefined);
    case 'boss':
      return KNIVES.filter((k) => k.bossIndex !== undefined);
    case 'owned':
      return KNIVES.filter((k) => owned.includes(k.id));
    default:
      return KNIVES;
  }
}

function PriceTag({ k }: { k: KnifeDef }) {
  if (k.bossIndex !== undefined) {
    return (
      <View style={styles.price}>
        <Icon name="skull" size={14} color={game.danger} detail={game.white} />
        <BodyText size={12} weight="black" color={game.textDim}>
          {fmt(S.store.defeatBoss, { n: (k.bossIndex + 1) * 5 })}
        </BodyText>
      </View>
    );
  }
  return (
    <View style={styles.price}>
      {k.priceApples !== undefined && (
        <>
          <CurrencyIcon kind="apples" size={15} />
          <BodyText size={12} weight="black" color={game.white}>
            {String(k.priceApples)}
          </BodyText>
        </>
      )}
      {k.priceGems !== undefined && (
        <>
          <CurrencyIcon kind="gems" size={15} />
          <BodyText size={12} weight="black" color={game.white}>
            {String(k.priceGems)}
          </BodyText>
        </>
      )}
    </View>
  );
}

function KnifeCard({ k, owned, equipped, isNew, onPress }: { k: KnifeDef; owned: boolean; equipped: boolean; isNew: boolean; onPress(): void }) {
  const R = game.rarity[k.rarity];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={S.knives[k.id]?.name ?? k.id}
      onPress={() => {
        feedbackTap();
        onPress();
      }}
      style={styles.cell}
    >
      <View style={[styles.card, { borderColor: equipped ? game.gold : R.frame }]}>
        <View style={[styles.cardGlow, { backgroundColor: R.dark }]} />
        <KnifeImage id={k.id} size={74} dim={!owned} />
        <View style={styles.cardFoot}>
          {equipped ? (
            <View style={styles.price}>
              <Icon name="check" size={14} color={game.success} />
              <BodyText size={12} weight="black" color={game.success}>
                {S.common.equipped}
              </BodyText>
            </View>
          ) : owned ? (
            <BodyText size={12} weight="black" color={game.textDim}>
              {S.common.owned}
            </BodyText>
          ) : (
            <PriceTag k={k} />
          )}
        </View>
        {isNew && (
          <View style={styles.newBadge}>
            <BodyText size={10} weight="black" color={game.white}>
              {S.common.newBadge}
            </BodyText>
          </View>
        )}
        {!owned && k.bossIndex !== undefined && (
          <View style={styles.lock}>
            <Icon name="lock" size={14} color={game.white} detail={game.outline} />
          </View>
        )}
      </View>
    </Pressable>
  );
}

function KnifeDetail({ k, onClose, onBought }: { k: KnifeDef | null; onClose(): void; onBought(): void }) {
  const owned = useGame((s) => (k ? s.owned.includes(k.id) : false));
  const equipped = useGame((s) => s.equipped);
  const apples = useGame((s) => s.apples);
  const gems = useGame((s) => s.gems);
  const buyKnife = useGame((s) => s.buyKnife);
  const equip = useGame((s) => s.equip);
  const last = React.useRef<KnifeDef | null>(null);
  if (k) last.current = k;
  const show = k ?? last.current;
  if (!show) return null;
  const R = game.rarity[show.rarity];
  const name = S.knives[show.id]?.name ?? show.id;

  const buy = (currency: 'apples' | 'gems') => {
    const r = buyKnife(show.id, currency);
    if (r === 'ok') {
      audio.play('reward');
      haptic('success');
      toast(S.store.purchased, 'success');
      onBought();
    } else if (r === 'needApples') {
      toast(fmt(S.store.notEnoughApples, { n: (show.priceApples ?? 0) - apples }), 'info');
    } else if (r === 'needGems') {
      toast(fmt(S.store.notEnoughGems, { n: (show.priceGems ?? 0) - gems }), 'info');
    }
  };

  return (
    <BouncyModal visible={k !== null} onClose={onClose} accent={R.frame}>
      <View style={[styles.rarityPill, { backgroundColor: R.frame }]}>
        <BodyText size={12} weight="black" color={game.white}>
          {S.store.rarity[show.rarity]}
        </BodyText>
      </View>
      <View style={styles.detailArt}>
        <View style={[styles.detailGlow, { backgroundColor: R.dark }]} />
        <KnifeImage id={show.id} size={170} motion="sway" />
      </View>
      <DisplayText size={28}>{name}</DisplayText>
      <BodyText size={14} align="center" color={game.textDim} style={styles.flavor}>
        {S.knives[show.id]?.flavor ?? ''}
      </BodyText>
      <BodyText size={12} weight="black" align="center" color={game.textMute}>
        {S.collections[show.collection]}
      </BodyText>
      <View style={styles.detailActions}>
        {owned ? (
          equipped === show.id ? (
            <GlossyButton label={S.common.equipped} icon="check" skin="green" disabled />
          ) : (
            <GlossyButton
              label={S.common.equip}
              icon="check"
              skin="green"
              onPress={() => {
                equip(show.id);
                toast(S.store.equippedToast, 'success');
              }}
            />
          )
        ) : show.bossIndex !== undefined ? (
          <BodyText size={15} weight="black" align="center" color={game.white}>
            {fmt(S.store.defeatBossLong, { name: S.bosses[BOSSES[show.bossIndex]?.id ?? ''] ?? '' })}
          </BodyText>
        ) : (
          <View style={styles.buyRow}>
            {show.priceApples !== undefined && (
              <GlossyButton
                skin="primary"
                onPress={() => buy('apples')}
                style={styles.flex}
                accessibilityLabel={`${S.store.buyApples} ${show.priceApples} ${S.common.apples}`}
                iconRight={<CurrencyIcon kind="apples" size={24} />}
                label={String(show.priceApples)}
              />
            )}
            {show.priceGems !== undefined && (
              <GlossyButton
                skin="blue"
                onPress={() => buy('gems')}
                style={styles.flex}
                accessibilityLabel={`${S.store.buyGems} ${show.priceGems} ${S.common.gems}`}
                iconRight={<CurrencyIcon kind="gems" size={24} />}
                label={String(show.priceGems)}
              />
            )}
          </View>
        )}
      </View>
      <BodyText size={11} align="center" color={game.textMute} style={styles.cosmetic}>
        {S.store.cosmetic}
      </BodyText>
    </BouncyModal>
  );
}

function CollectionsSheet({ visible, onClose }: { visible: boolean; onClose(): void }) {
  const owned = useGame((s) => s.owned);
  const claimed = useGame((s) => s.collectionsClaimed);
  const claim = useGame((s) => s.claimCollection);
  return (
    <BouncyModal visible={visible} title={S.store.collections} onClose={onClose}>
      <ScrollView style={styles.collList} contentContainerStyle={styles.collContent}>
        {COLLECTION_ORDER.filter((c) => c !== 'starter').map((c) => {
          const all = KNIVES.filter((k) => k.collection === c);
          const have = all.filter((k) => owned.includes(k.id)).length;
          const done = have === all.length;
          const isClaimed = claimed.includes(c);
          const bonus = COLLECTION_BONUS[c];
          return (
            <View key={c} style={styles.collRow}>
              <View style={styles.flex}>
                <View style={styles.collHead}>
                  <BodyText size={15} weight="black" color={game.white}>
                    {S.collections[c]}
                  </BodyText>
                  <BodyText size={12} weight="black" color={game.textDim}>
                    {fmt(S.store.collectionProgress, { have, total: all.length })}
                  </BodyText>
                </View>
                <ProgressBar value={have} max={all.length} height={10} color={done ? game.gold : game.success} />
              </View>
              {isClaimed ? (
                <Icon name="check" size={24} color={game.success} />
              ) : (
                <GlossyButton
                  size="sm"
                  skin={done ? 'gold' : 'disabled'}
                  disabled={!done}
                  label={bonus.gems > 0 ? `+${bonus.gems}` : `+${bonus.apples}`}
                  iconRight={<CurrencyIcon kind={bonus.gems > 0 ? 'gems' : 'apples'} size={18} />}
                  onPress={() => celebrateReward(claim(c))}
                />
              )}
            </View>
          );
        })}
      </ScrollView>
    </BouncyModal>
  );
}

export function StoreScreen() {
  const owned = useGame((s) => s.owned);
  const equipped = useGame((s) => s.equipped);
  const unseen = useGame((s) => s.unseen);
  const markSeen = useGame((s) => s.markSeen);
  const [tab, setTab] = useState<Tab>('all');
  const [selected, setSelected] = useState<KnifeDef | null>(null);
  const [collections, setCollections] = useState(false);
  const [confetti, setConfetti] = useState(0);
  const free = useFreeApples();
  const data = useMemo(() => filterKnives(tab, owned), [tab, owned]);

  return (
    <Screen
      title={S.store.title}
      headerRight={
        <GlossyButton
          size="sm"
          skin={free.waiting ? 'disabled' : 'gold'}
          icon={free.waiting ? 'clock' : 'ad'}
          label={free.label}
          disabled={free.waiting}
          onPress={() => void free.claim()}
        />
      }
    >
      <View style={styles.tabs}>
        {TABS.map((t) => (
          <Pressable
            key={t}
            accessibilityRole="tab"
            accessibilityState={{ selected: tab === t }}
            onPress={() => {
              feedbackTap();
              setTab(t);
            }}
            style={[styles.tab, tab === t && styles.tabOn]}
          >
            <BodyText size={13} weight="black" color={tab === t ? game.outline : game.textDim} align="center">
              {S.store.tabs[t]}
            </BodyText>
          </Pressable>
        ))}
      </View>
      <FlatList
        data={data}
        keyExtractor={(k) => k.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          tab === 'all' ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                feedbackTap();
                setCollections(true);
              }}
              style={styles.collBtn}
            >
              <Icon name="medal" size={22} color={game.gold} />
              <BodyText size={15} weight="black" color={game.white} style={styles.flex}>
                {S.store.collections}
              </BodyText>
              <BodyText size={13} weight="black" color={game.textDim}>
                {S.store.collectionBonus}
              </BodyText>
              <Icon name="play" size={14} color={game.textDim} />
            </Pressable>
          ) : null
        }
        ListEmptyComponent={
          <BodyText align="center" color={game.textMute} style={styles.empty}>
            {S.store.emptyOwned}
          </BodyText>
        }
        renderItem={({ item }) => (
          <KnifeCard
            k={item}
            owned={owned.includes(item.id)}
            equipped={equipped === item.id}
            isNew={unseen.includes(item.id)}
            onPress={() => {
              markSeen(item.id);
              setSelected(item);
            }}
          />
        )}
      />
      <KnifeDetail k={selected} onClose={() => setSelected(null)} onBought={() => setConfetti((c) => c + 1)} />
      <CollectionsSheet visible={collections} onClose={() => setCollections(false)} />
      <Confetti burstKey={confetti} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 14,
    marginBottom: 10,
    padding: 4,
    gap: 4,
    borderRadius: 16,
    backgroundColor: game.surfaceLo,
    borderWidth: 2,
    borderColor: game.stroke,
  },
  tab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 12,
  },
  tabOn: {
    backgroundColor: game.gold,
  },
  grid: {
    paddingHorizontal: 10,
    paddingBottom: 16,
  },
  cell: {
    width: '33.333%',
    padding: 4,
  },
  card: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 8,
    borderRadius: 18,
    borderWidth: 3,
    backgroundColor: game.surface,
    overflow: 'hidden',
  },
  cardGlow: {
    position: 'absolute',
    top: 10,
    width: 70,
    height: 70,
    borderRadius: 35,
    opacity: 0.55,
  },
  cardFoot: {
    height: 20,
    justifyContent: 'center',
    marginTop: 2,
  },
  price: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  newBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 8,
    backgroundColor: game.danger,
  },
  lock: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  rarityPill: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: game.outline,
  },
  detailArt: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  detailGlow: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.6,
  },
  flavor: {
    marginTop: 2,
    marginBottom: 4,
  },
  detailActions: {
    marginTop: 14,
  },
  buyRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cosmetic: {
    marginTop: 10,
  },
  collBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 4,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: game.surface,
    borderWidth: 2,
    borderColor: game.stroke,
  },
  collList: {
    maxHeight: 420,
  },
  collContent: {
    gap: 12,
  },
  collRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  collHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  empty: {
    marginTop: 40,
  },
});
