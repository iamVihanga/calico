/* Dev-only component gallery (plan §6.1). Visual check for Phase 0: compare against the prototype in both themes. */
import { type ReactNode, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  BilingualTitle,
  CollectionMosaic,
  coverPalettes,
  DateStamp,
  EpisodeSquare,
  type EpisodeState,
  GeneratedCover,
  Kiri,
  MediaCountDot,
  MediaShapeIcon,
  TicketStub,
} from '@/components/calico';
import {
  Avatar,
  Badge,
  BookCard,
  BookCover,
  Button,
  Card,
  Checkbox,
  EmptyState,
  Icon,
  IconButton,
  Input,
  ProgressBar,
  ScreenHeader,
  SearchField,
  SegmentedControl,
  Select,
  Sheet,
  SheetPanel,
  Switch,
  TabBar,
  Tag,
  Toast,
  Txt,
} from '@/components/ds';
import { copy } from '@/i18n/en';
import { layout, space, type ThemeName, ThemeProvider, roles, type TypeRole, useTheme } from '@/theme';

const SAMPLE = {
  madol: {
    id: 'madol',
    en: 'Madol Doova',
    si: 'මඩොල් දූව',
    author: 'Martin Wickramasinghe',
    authorSi: 'මාර්ටින් වික්‍රමසිංහ',
  },
  it: { id: 'it', en: 'IT', author: 'Stephen King' },
  fireblood: { id: 'fireblood', en: 'Fire & Blood', author: 'George R. R. Martin' },
  maali: { id: 'maali', en: 'The Seven Moons of Maali Almeida', author: 'Shehan Karunatilaka' },
  gamperaliya: { id: 'gamperaliya', en: 'Gamperaliya', si: 'ගම්පෙරළිය' },
  shining: { id: 'shining', en: 'The Shining', author: 'Stephen King' },
  hathpana: { id: 'hathpana', en: 'Hath Pana', si: 'හත් පණ' },
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { t } = useTheme();
  return (
    <View style={{ gap: space[4], paddingVertical: space[6], borderTopWidth: 1, borderTopColor: t.borderHairline }}>
      <Txt role="label" color="textMuted">
        {title}
      </Txt>
      {children}
    </View>
  );
}

function Row({ children, wrap = true }: { children: ReactNode; wrap?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: wrap ? 'wrap' : 'nowrap', gap: space[3], alignItems: 'center' }}>
      {children}
    </View>
  );
}

function Gallery({ name, setName }: { name: ThemeName; setName: (n: ThemeName) => void }) {
  const { t } = useTheme();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [query, setQuery] = useState('මඩොල්');
  const [sort, setSort] = useState<'updated' | 'title' | 'rating' | 'added'>('updated');
  const [checked, setChecked] = useState(true);
  const [on, setOn] = useState(true);
  const [seg, setSeg] = useState<'Books' | 'Movies' | 'Shows'>('Books');
  const [tab, setTab] = useState<'home' | 'library' | 'upnext' | 'collections'>('home');
  const [filter, setFilter] = useState('Reading');
  const [sheetOpen, setSheetOpen] = useState(false);

  const episodes: EpisodeState[] = [
    'watched',
    'watched',
    'watched',
    'watched',
    'next',
    'unwatched',
    'unwatched',
    'unaired',
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.surfacePage }}
      contentContainerStyle={{ paddingTop: insets.top, paddingBottom: insets.bottom + 140 }}
    >
      <ScreenHeader
        hand="phase 0 · dev only"
        title="Components"
        trailing={
          <IconButton
            icon={name === 'night' ? 'light_mode' : 'dark_mode'}
            label="Toggle theme"
            tone="card"
            onPress={() => setName(name === 'night' ? 'day' : 'night')}
          />
        }
      />
      <View style={{ paddingHorizontal: layout.gutterScreen }}>
        <SegmentedControl
          items={[
            { id: 'day', label: 'Day' },
            { id: 'night', label: 'Night reading' },
          ]}
          value={name}
          onChange={setName}
        />

        <Section title="Type roles">
          {(Object.keys(roles) as TypeRole[]).map((r) => (
            <Txt key={r} role={r}>
              {r === 'numeric' ? '412 / 1138' : `${r} — Calico`}
            </Txt>
          ))}
          <Txt role="accent" color="textAccent">
            everything you own
          </Txt>
        </Section>

        <Section title="Sinhala">
          <Txt role="title">මාර්ටින් වික්‍රමසිංහ</Txt>
          <Txt role="body">මඩොල් දූව is due in 3 days</Txt>
          <Txt role="section">ගම්පෙරළිය · Gamperaliya</Txt>
          <Txt role="accent" color="textAccent">
            හත් පණ
          </Txt>
          <Txt role="label">BORROWED · මඩොල් දූව</Txt>
        </Section>

        <Section title="Icons">
          <Row>
            {(
              [
                'home',
                'grid_view',
                'playlist_play',
                'category',
                'add',
                'search',
                'local_library',
                'event_repeat',
                'auto_awesome',
                'photo_camera',
                'cloud_off',
                'dark_mode',
                'drag_indicator',
                'more_vert',
              ] as const
            ).map((n) => (
              <Icon key={n} name={n} color="textSecondary" />
            ))}
          </Row>
        </Section>

        <Section title="Button">
          {(['primary', 'accent', 'secondary', 'ghost', 'inverse'] as const).map((v) => (
            <Row key={v}>
              {(['sm', 'md', 'lg'] as const).map((s) => (
                <Button key={s} variant={v} size={s}>
                  {`${v} ${s}`}
                </Button>
              ))}
            </Row>
          ))}
          <Row>
            <Button variant="accent" icon="add">
              Add a book
            </Button>
            <Button variant="secondary" iconAfter="arrow_forward">
              Next
            </Button>
            <Button disabled>Disabled</Button>
            <Button loading variant="accent">
              Loading
            </Button>
          </Row>
          <Button hand block variant="primary">
            {"can't decide? Pick for me"}
          </Button>
          <Button hand size="lg" variant="accent" block>
            let Kiri choose
          </Button>
        </Section>

        <Section title="IconButton">
          <Row>
            {(['quiet', 'card', 'accent', 'ink'] as const).map((tone) => (
              <IconButton key={tone} icon="search" label={`${tone} search`} tone={tone} />
            ))}
            <IconButton icon="dark_mode" label="active" tone="card" active />
            <IconButton icon="more_vert" label="square" tone="card" round={false} />
            <IconButton icon="close" label="small" tone="card" size="sm" />
            <IconButton icon="add" label="large" tone="accent" size="lg" />
          </Row>
          <View style={{ backgroundColor: t.surfaceInverse, padding: space[4], borderRadius: 14 }}>
            <IconButton icon="arrow_back" label="inverse" tone="inverse" />
          </View>
        </Section>

        <Section title="Badge">
          <Row>
            {(['accent', 'forest', 'sand', 'pink', 'honey', 'ink'] as const).map((tone) => (
              <Badge key={tone} tone={tone}>
                {tone}
              </Badge>
            ))}
            <Badge tone="honey" icon="local_library">
              Due 26 Sep
            </Badge>
            <Badge caps={false}>not caps</Badge>
          </Row>
        </Section>

        <Section title="Tag">
          <Row>
            {['All', 'Reading', 'To read', 'Read'].map((f, i) => (
              <Tag
                key={f}
                selected={filter === f}
                count={f === 'All' ? undefined : [0, 2, 2, 1][i]}
                onPress={() => setFilter(f)}
              >
                {f}
              </Tag>
            ))}
          </Row>
          <Row>
            <Tag icon="add">Add</Tag>
            <Tag onRemove={() => undefined}>Stephen King</Tag>
            <Tag selected icon="check">
              Sinhala classics
            </Tag>
          </Row>
        </Section>

        <Section title="Avatar">
          <Row>
            {(['xs', 'sm', 'md', 'lg', 'xl'] as const).map((s) => (
              <Avatar key={s} name="Dilini Kumari" size={s} />
            ))}
          </Row>
          <Row>
            {(['sand', 'pink', 'forest', 'honey', 'accent', 'ink'] as const).map((tone) => (
              <Avatar key={tone} name="Dilini Kumari" tone={tone} />
            ))}
            <Avatar name="Dilini Kumari" ring="accent" />
            <Avatar name="Dilini Kumari" ring="forest" tone="pink" />
          </Row>
        </Section>

        <Section title="Card">
          {(['paper', 'warm', 'quiet', 'forest', 'accent', 'ink'] as const).map((tone) => (
            <Card key={tone} tone={tone}>
              <Txt
                role="bodyStrong"
                tint={
                  tone === 'forest' || tone === 'ink' ? t.textInverse : tone === 'accent' ? t.textOnAccent : undefined
                }
              >
                {`${tone} card`}
              </Txt>
            </Card>
          ))}
          <Card onPress={() => undefined} shadow="md" radius="xl" pad="lg">
            <Txt role="body">Pressable card (xl radius, md shadow, lg pad)</Txt>
          </Card>
        </Section>

        <Section title="Forms">
          <Input label="Title" placeholder="Madol Doova" value={text} onChange={setText} />
          <Input
            label="Author"
            hint="As printed on the cover"
            value="මාර්ටින් වික්‍රමසිංහ"
            onChange={() => undefined}
          />
          <Input
            label="ISBN"
            error="That ISBN doesn't look right."
            value="978955"
            onChange={() => undefined}
            icon="bolt"
          />
          <Input label="Library" value="Colombo Public Library" disabled onChange={() => undefined} />
          <Input
            label="Note"
            multiline
            rows={3}
            placeholder="What stayed with you?"
            value=""
            onChange={() => undefined}
          />
          <SearchField value={query} onChange={setQuery} onClear={() => setQuery('')} />
          <SearchField value="" onChange={() => undefined} />
          <Select
            label="Sort"
            value={sort}
            onChange={setSort}
            options={[
              { value: 'updated', label: 'Recently updated' },
              { value: 'title', label: 'Title' },
              { value: 'rating', label: 'Rating' },
              { value: 'added', label: 'Date added' },
            ]}
          />
          <Checkbox
            label="Also create a collection"
            description="IT Collection"
            checked={checked}
            onChange={setChecked}
          />
          <Checkbox label="Disabled" disabled />
          <Switch label="3 days before" description="At 9:00 AM" checked={on} onChange={setOn} />
          <Switch label="Include specials" checked={false} disabled />
        </Section>

        <Section title="Navigation">
          <SegmentedControl items={['Books', 'Movies', 'Shows'] as const} value={seg} onChange={setSeg} />
          <View style={{ marginHorizontal: -layout.gutterScreen }}>
            <ScreenHeader
              hand="everything you own"
              title="Library"
              trailing={<IconButton icon="search" label="Search" tone="card" />}
            />
            <ScreenHeader eyebrow="Settings" title="Reminders" />
          </View>
          <View style={{ backgroundColor: t.surfaceInverse, borderRadius: 20, marginHorizontal: -8 }}>
            <ScreenHeader tone="inverse" hand="a shelf that remembers" title="Calico" />
          </View>
          <View style={{ paddingTop: 30 }}>
            <TabBar
              inline
              value={tab}
              onChange={setTab}
              items={[
                { id: 'home', label: copy.tabs.home, icon: 'home' },
                { id: 'library', label: copy.tabs.library, icon: 'grid_view' },
                { id: 'upnext', label: copy.tabs.upNext, icon: 'playlist_play' },
                { id: 'collections', label: copy.tabs.collections, icon: 'category' },
              ]}
            />
          </View>
        </Section>

        <Section title="ProgressBar">
          <ProgressBar value={36} label="Page 412 of 1138" showValue />
          {(['accent', 'forest', 'honey', 'ink'] as const).map((tone, i) => (
            <ProgressBar key={tone} value={20 + i * 20} tone={tone} />
          ))}
          <ProgressBar value={70} height={4} track={t.surfaceSunk} />
        </Section>

        <Section title="BookCover">
          <Row>
            {(['xs', 'sm', 'md', 'lg'] as const).map((s) => (
              <BookCover key={s} size={s} title={SAMPLE.it.en} author={SAMPLE.it.author} cover="marmalade" />
            ))}
          </Row>
          <BookCover size="xl" title={SAMPLE.madol.si} author={SAMPLE.madol.authorSi} cover="forest" tilt={-3} />
          <Row>
            {(Object.keys(coverPalettes) as (keyof typeof coverPalettes)[]).map((c) => (
              <BookCover key={c} size="sm" title={c} author="Palette" cover={c} />
            ))}
          </Row>
        </Section>

        <Section title="BookCard">
          <BookCard
            title={SAMPLE.it.en}
            author={SAMPLE.it.author}
            seed="it"
            progress={36}
            meta="About 35 pages a day"
            badge="Reading"
          />
          <BookCard
            title={SAMPLE.madol.si}
            author={SAMPLE.madol.authorSi}
            seed="madol"
            progress={70}
            meta="Due in 3 days"
          />
          <Row>
            <BookCard layout="stack" title={SAMPLE.fireblood.en} author={SAMPLE.fireblood.author} seed="fireblood" />
            <BookCard
              layout="stack"
              title={SAMPLE.shining.en}
              author={SAMPLE.shining.author}
              seed="shining"
              progress={27}
            />
          </Row>
        </Section>

        <Section title="Feedback">
          <Toast message={copy.theme.nightOn} action={{ label: copy.common.dismiss, onPress: () => undefined }} />
          <Toast
            message="Returned to Colombo Public Library"
            tone="forest"
            icon="assignment_return"
            action={{ label: copy.common.undo, onPress: () => undefined }}
          />
          <Toast message="Stephen King +1" tone="accent" hand />
          <Toast
            message="Removed from up next"
            tone="ink"
            action={{ label: copy.common.undo, onPress: () => undefined }}
          />
          <SheetPanel hand="something new for the shelf" title="What are you adding?">
            <Txt role="body" color="textSecondary">
              Inline sheet panel. The modal sheet below uses the same paper, handle and header.
            </Txt>
          </SheetPanel>
          <Button variant="secondary" onPress={() => setSheetOpen(true)}>
            Open sheet
          </Button>
          <Sheet
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
            hand="bring it back!"
            title="Renew until…"
            actions={
              <Button variant="accent" block onPress={() => setSheetOpen(false)}>
                Renew
              </Button>
            }
          >
            <Row>
              <Tag selected>+7 days</Tag>
              <Tag>+14 days</Tag>
              <Tag>+21 days</Tag>
              <Tag>+30 days</Tag>
            </Row>
          </Sheet>
          <Card tone="warm" pad="none" shadow="none">
            <EmptyState
              art={<Kiri pose="curled" width={150} />}
              hand="nothing on the shelf yet"
              title="Your shelf is empty"
              body="Add the book you're reading right now."
              action={
                <Button variant="accent" size="lg">
                  Add a book
                </Button>
              }
            />
          </Card>
        </Section>

        <Section title="Media shapes">
          <Row>
            {(['book', 'movie', 'show'] as const).map((k) => (
              <View key={k} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <MediaShapeIcon kind={k} />
                <MediaShapeIcon kind={k} scale={2} color="textAccent" />
                <MediaCountDot kind={k} />
                <Txt role="caption" color="textMuted">
                  {copy.media[k]}
                </Txt>
              </View>
            ))}
          </Row>
        </Section>

        <Section title="GeneratedCover (prototype rotation)">
          <Row>
            {Object.values(SAMPLE).map((s) => (
              <GeneratedCover key={s.id} seed={s.id} title={s.en} width={64} />
            ))}
            <GeneratedCover seed="it2017" title="IT" width={64} spine={false} />
          </Row>
        </Section>

        <Section title="BilingualTitle">
          <BilingualTitle title={SAMPLE.madol.en} titleNative={SAMPLE.madol.si} lead="en" />
          <BilingualTitle title={SAMPLE.madol.en} titleNative={SAMPLE.madol.si} lead="si" />
          <BilingualTitle title={SAMPLE.it.en} lead="si" size="lg" />
        </Section>

        <Section title="DateStamp">
          <Row>
            <DateStamp date="2026-08-24" variant="borrowed" rotate={-2} />
            <DateStamp date="2026-09-07" variant="old" />
            <DateStamp date="2026-09-21" variant="current" />
            <DateStamp date="2026-09-26" />
          </Row>
        </Section>

        <Section title="TicketStub">
          <TicketStub date="Sat 12 Sep" rating={4} note="Still scary." />
          <TicketStub date="Sat 31 Oct" rating={4.5} note="Halloween rewatch." />
          <TicketStub date="Fri 22 Sep" rating={5} />
        </Section>

        <Section title="EpisodeSquare">
          <Row>
            {episodes.map((s, i) => (
              <EpisodeSquare key={i} season={2} episode={i + 1} state={s} onPress={() => undefined} />
            ))}
          </Row>
          <Txt family="hand" weight={400} size={17} color="textMuted">
            tap a square · hold one to fill the season
          </Txt>
        </Section>

        <Section title="CollectionMosaic">
          <Row wrap={false}>
            <View style={{ flex: 1 }}>
              <CollectionMosaic
                items={[
                  { id: 'it', title: 'IT' },
                  { id: 'shining', title: 'The Shining' },
                  { id: 'it2017', title: 'IT' },
                  { id: 'it2', title: 'IT Chapter Two' },
                ]}
              />
            </View>
            <View style={{ flex: 1 }}>
              <CollectionMosaic
                items={[
                  { id: 'fireblood', title: 'Fire & Blood' },
                  { id: 'got', title: 'Game of Thrones' },
                ]}
              />
            </View>
          </Row>
          <CollectionMosaic
            variant="strip"
            items={[
              { id: 'madol', title: 'මඩොල් දූව' },
              { id: 'gamperaliya', title: 'ගම්පෙරළිය' },
              { id: 'hathpana', title: 'හත් පණ' },
            ]}
          />
        </Section>

        <Section title="Kiri (placeholder art)">
          <Row>
            <Kiri pose="curled" width={140} />
            <Kiri pose="asleep" width={140} />
          </Row>
          <Row>
            <Kiri pose="stretch" width={160} />
            <Kiri pose="paw" width={70} />
          </Row>
        </Section>
      </View>
    </ScrollView>
  );
}

export default function ComponentsGallery() {
  const { name: appTheme } = useTheme();
  const [name, setName] = useState<ThemeName>(appTheme);
  return (
    <ThemeProvider forced={name}>
      <Gallery name={name} setName={setName} />
    </ThemeProvider>
  );
}
