/**
 * A fixed-height strip reserved for the anchored adaptive banner, so layouts
 * never jump when an ad loads or fails. Shows the real banner in the Android
 * build and a labelled placeholder in the preview.
 */
import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { game } from '@/constants/colors';
import { BANNER_SLOT_HEIGHT } from '../../config/adPolicy';
import { adUnitId } from '../../config/ads';
import { getNativeBanner } from '../../services/ads/admobBackend';
import { useAdStatus } from '../../services/ads/adManager';
import { S } from '../../strings';
import { BodyText } from './Typography';

export function BannerSlot({ position = 'bottom' }: { position?: 'top' | 'bottom' }) {
  const { backend, ready, canRequestAds, nonPersonalized } = useAdStatus();
  const Native = useMemo(() => (backend === 'admob' ? getNativeBanner() : null), [backend]);
  const [failed, setFailed] = useState(false);

  return (
    <View style={[styles.slot, position === 'top' ? styles.top : styles.bottom]}>
      {Native && ready && canRequestAds && !failed ? (
        <Native unitId={adUnitId('banner')} nonPersonalized={nonPersonalized} onFailed={() => setFailed(true)} />
      ) : backend === 'mock' && ready ? (
        <View style={styles.mock}>
          <View style={styles.adTag}>
            <BodyText size={10} weight="black" color={game.outline}>
              {S.ads.label}
            </BodyText>
          </View>
          <BodyText size={12} weight="bold" color={game.textMute}>
            {S.ads.banner}
          </BodyText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    height: BANNER_SLOT_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  top: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  bottom: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  mock: {
    width: 320,
    maxWidth: '94%',
    height: 50,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  adTag: {
    paddingHorizontal: 5,
    borderRadius: 4,
    backgroundColor: game.gold,
  },
});
