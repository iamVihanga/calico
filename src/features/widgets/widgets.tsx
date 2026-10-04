import { FlexWidget, ImageWidget, OverlapWidget, TextWidget } from 'react-native-android-widget';
import type { ColorProp } from 'react-native-android-widget';

import { coverFor } from '@/components/calico/coverPalette';
import { copy } from '@/i18n/en';
import type { LocalDate } from '@/lib/dates';
import { dueTone } from '@/features/loans/logic';
import type { Theme } from '@/theme/themes';

import { dueIn, links, readFraction, type WidgetSnapshot } from './logic';

/**
 * Home-screen widgets (react-native-android-widget primitives → native views). No hooks here: the
 * task handler draws them while the app is closed, so the theme and data come in as props.
 */

const c = (hex: string) => hex as ColorProp;
const fonts = { ui: 'Nunito_400Regular', uiBold: 'Nunito_700Bold', display: 'PlayfairDisplay_700Bold' };
const RADIUS = 22;

type Props<K extends keyof WidgetSnapshot> = { data: WidgetSnapshot[K]; signedIn: boolean; t: Theme; today: LocalDate };

function Card({ t, uri, label, children }: { t: Theme; uri: string; label: string; children: React.ReactNode }) {
  return (
    <FlexWidget
      clickAction="OPEN_URI"
      clickActionData={{ uri }}
      accessibilityLabel={label}
      style={{
        height: 'match_parent',
        width: 'match_parent',
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        flexGap: 12,
        backgroundColor: c(t.surfaceCard),
        borderRadius: RADIUS,
      }}
    >
      {children}
    </FlexWidget>
  );
}

function Eyebrow({ t, text }: { t: Theme; text: string }) {
  return (
    <TextWidget text={text.toUpperCase()} style={{ fontSize: 11, fontFamily: fonts.uiBold, color: c(t.textAccent) }} />
  );
}

/** Empty, signed out, or nothing to show: one line and a way into the app. */
function Note({ t, eyebrow, text }: { t: Theme; eyebrow: string; text: string }) {
  return (
    <Card t={t} uri={links.home} label={`${eyebrow}. ${text}`}>
      <FlexWidget style={{ flex: 1, flexDirection: 'column', flexGap: 4 }}>
        <Eyebrow t={t} text={eyebrow} />
        <TextWidget
          text={text}
          maxLines={2}
          style={{ fontSize: 15, fontFamily: fonts.display, color: c(t.textPrimary) }}
        />
        <TextWidget
          text={copy.widgets.openCalico}
          style={{ fontSize: 12, fontFamily: fonts.ui, color: c(t.textMuted) }}
        />
      </FlexWidget>
    </Card>
  );
}

function Cover({ id, title, uri, width }: { id: string; title: string; uri: string | null; width: number }) {
  const p = coverFor(id);
  const height = Math.round(width * 1.5);
  return (
    <OverlapWidget style={{ width, height, borderRadius: 4 }}>
      <FlexWidget style={{ width, height, padding: 5, backgroundColor: c(p.bg), borderRadius: 4 }}>
        <TextWidget text={title} maxLines={4} style={{ fontSize: 9, fontFamily: fonts.display, color: c(p.ink) }} />
      </FlexWidget>
      {uri ? <ImageWidget image={uri as `https:${string}`} imageWidth={width} imageHeight={height} radius={4} /> : null}
    </OverlapWidget>
  );
}

function Bar({ t, fraction }: { t: Theme; fraction: number }) {
  const done = Math.round(fraction * 100);
  return (
    <FlexWidget
      style={{
        width: 'match_parent',
        height: 6,
        flexDirection: 'row',
        backgroundColor: c(t.surfaceSunk),
        borderRadius: 3,
      }}
    >
      {done > 0 ? (
        <FlexWidget style={{ flex: done, height: 6, backgroundColor: c(t.accentPrimary), borderRadius: 3 }} />
      ) : null}
      {done < 100 ? <FlexWidget style={{ flex: 100 - done, height: 6 }} /> : null}
    </FlexWidget>
  );
}

export function ContinueReadingWidget({ data, signedIn, t }: Props<'reading'>) {
  if (!signedIn) return <Note t={t} eyebrow={copy.widgets.reading} text={copy.widgets.signIn} />;
  if (!data) return <Note t={t} eyebrow={copy.widgets.reading} text={copy.widgets.nothingReading} />;
  const page = copy.widgets.page(data.page, data.total);
  return (
    <Card t={t} uri={links.book(data.id)} label={`${copy.widgets.reading}: ${data.title}. ${page}`}>
      <Cover id={data.id} title={data.title} uri={data.cover} width={56} />
      <FlexWidget style={{ flex: 1, height: 'match_parent', flexDirection: 'column', justifyContent: 'space-between' }}>
        <FlexWidget style={{ width: 'match_parent', flexDirection: 'column', flexGap: 2 }}>
          <Eyebrow t={t} text={copy.widgets.reading} />
          <TextWidget
            text={data.title}
            maxLines={2}
            truncate="END"
            style={{ fontSize: 16, fontFamily: fonts.display, color: c(t.textPrimary) }}
          />
          {data.author ? (
            <TextWidget
              text={data.author}
              maxLines={1}
              truncate="END"
              style={{ fontSize: 12, fontFamily: fonts.ui, color: c(t.textMuted) }}
            />
          ) : null}
        </FlexWidget>
        <FlexWidget style={{ width: 'match_parent', flexDirection: 'column', flexGap: 6 }}>
          <Bar t={t} fraction={readFraction(data)} />
          <FlexWidget
            style={{
              width: 'match_parent',
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <TextWidget text={page} style={{ fontSize: 12, fontFamily: fonts.uiBold, color: c(t.textSecondary) }} />
            <FlexWidget
              clickAction="OPEN_URI"
              clickActionData={{ uri: links.ruler(data.id) }}
              accessibilityLabel={copy.widgets.logPage}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 6,
                backgroundColor: c(t.accentPrimary),
                borderRadius: 999,
              }}
            >
              <TextWidget
                text={copy.widgets.logPage}
                style={{ fontSize: 12, fontFamily: fonts.uiBold, color: c(t.textOnAccent) }}
              />
            </FlexWidget>
          </FlexWidget>
        </FlexWidget>
      </FlexWidget>
    </Card>
  );
}

export function NextEpisodeWidget({ data, signedIn, t }: Props<'next'>) {
  if (!signedIn) return <Note t={t} eyebrow={copy.widgets.next} text={copy.widgets.signIn} />;
  if (!data) return <Note t={t} eyebrow={copy.widgets.next} text={copy.widgets.caughtUp} />;
  const code = copy.episodeSheet.code(data.season, data.episode);
  const line = data.name ? `${code} · ${data.name}` : code;
  return (
    <Card
      t={t}
      uri={links.episode(data.showId, data.season, data.episode)}
      label={`${copy.widgets.next}: ${data.title}, ${line}`}
    >
      {data.still ? (
        <ImageWidget image={data.still as `https:${string}`} imageWidth={96} imageHeight={72} radius={12} />
      ) : null}
      <FlexWidget style={{ flex: 1, flexDirection: 'column', flexGap: 2 }}>
        <Eyebrow t={t} text={copy.widgets.next} />
        <TextWidget
          text={data.title}
          maxLines={1}
          truncate="END"
          style={{ fontSize: 16, fontFamily: fonts.display, color: c(t.textPrimary) }}
        />
        <TextWidget
          text={line}
          maxLines={2}
          truncate="END"
          style={{ fontSize: 12, fontFamily: fonts.ui, color: c(t.textSecondary) }}
        />
        {data.failed ? (
          <TextWidget
            text={copy.widgets.tickFailed}
            maxLines={2}
            style={{ fontSize: 11, fontFamily: fonts.uiBold, color: c(t.statusDanger) }}
          />
        ) : null}
      </FlexWidget>
      <FlexWidget
        clickAction="TICK"
        clickActionData={{ itemId: data.showId, season: data.season, episode: data.episode }}
        accessibilityLabel={copy.widgets.tick(code)}
        style={{
          width: 48,
          height: 48,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: c(t.accentPrimary),
          borderRadius: 24,
        }}
      >
        <TextWidget text="✓" style={{ fontSize: 22, fontFamily: fonts.uiBold, color: c(t.textOnAccent) }} />
      </FlexWidget>
    </Card>
  );
}

export function DueSoonWidget({ data, signedIn, t, today }: Props<'due'>) {
  if (!signedIn) return <Note t={t} eyebrow={copy.widgets.due} text={copy.widgets.signIn} />;
  if (!data) return <Note t={t} eyebrow={copy.widgets.due} text={copy.widgets.nothingDue} />;
  const days = dueIn(data.dueOn, today);
  const tone = dueTone(days);
  const line = copy.loan.dueLine(days);
  return (
    <Card t={t} uri={links.renew(data.id)} label={`${data.title}, ${line}, ${data.party}`}>
      <FlexWidget style={{ flex: 1, height: 'match_parent', flexDirection: 'column', justifyContent: 'space-between' }}>
        <FlexWidget style={{ width: 'match_parent', flexDirection: 'column', flexGap: 4 }}>
          <Eyebrow t={t} text={copy.widgets.due} />
          <TextWidget
            text={data.title}
            maxLines={2}
            truncate="END"
            style={{ fontSize: 16, fontFamily: fonts.display, color: c(t.textPrimary) }}
          />
        </FlexWidget>
        <FlexWidget style={{ width: 'match_parent', flexDirection: 'column', flexGap: 2 }}>
          <TextWidget
            text={line}
            style={{
              fontSize: 13,
              fontFamily: fonts.uiBold,
              color: c(tone === 'overdue' ? t.statusDanger : tone === 'soon' ? t.textAccent : t.textSecondary),
            }}
          />
          <TextWidget
            text={data.party}
            maxLines={1}
            truncate="END"
            style={{ fontSize: 11, fontFamily: fonts.ui, color: c(t.textMuted) }}
          />
        </FlexWidget>
      </FlexWidget>
    </Card>
  );
}
