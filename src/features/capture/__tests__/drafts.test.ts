import { ExtractError } from '../api';
import { processDrafts, removeDraft, saveDraft, useDrafts } from '../drafts';
import type { Draft } from '../store';

const mockUpload = jest.fn();
const mockExtract = jest.fn();

jest.mock('expo-file-system', () => {
  class Directory {
    uri: string;
    exists = false;
    constructor(...parts: unknown[]) {
      this.uri = parts.map((p) => (typeof p === 'string' ? p : (p as { uri: string }).uri)).join('/');
    }
    create() {
      this.exists = true;
    }
    delete() {}
  }
  class File {
    uri: string;
    exists = false;
    constructor(...parts: unknown[]) {
      this.uri = parts.map((p) => (typeof p === 'string' ? p : (p as { uri: string }).uri)).join('/');
    }
    async copy() {}
    delete() {}
  }
  return { Directory, File, Paths: { document: { uri: 'file:///docs' } } };
});

jest.mock('../api', () => {
  class ExtractError extends Error {
    code: string;
    constructor(c: string) {
      super(c);
      this.code = c;
    }
  }
  return {
    ExtractError,
    uploadCover: (...a: unknown[]) => mockUpload(...a),
    extractBook: (...a: unknown[]) => mockExtract(...a),
  };
});

const draft = (itemId: string): Draft => ({
  itemId,
  isbn: null,
  lookup: null,
  front: 'file:///cache/front.jpg',
  back: null,
  pending: null,
  frontPath: null,
  backPath: null,
  extraction: null,
  error: null,
  resetsAt: null,
});

describe('offline capture drafts', () => {
  beforeEach(() => {
    useDrafts.getState().set([]);
    mockUpload.mockReset();
    mockExtract.mockReset();
  });

  it('keeps the photo in documents/drafts and lists it as waiting', async () => {
    const d = await saveDraft(draft('item-1'));
    expect(d.front).toBe('file:///docs/drafts/item-1/front.jpg');
    expect(useDrafts.getState().drafts).toHaveLength(1);
    expect(useDrafts.getState().drafts[0]?.state).toBe('waiting');
  });

  it('uploads and reads waiting drafts when back online', async () => {
    await saveDraft(draft('item-1'));
    mockUpload.mockResolvedValue('u/item-1/front.jpg');
    mockExtract.mockResolvedValue({ fields: { title_romanized: 'Madol Doova' }, remaining: 29 });
    await processDrafts();
    const d = useDrafts.getState().drafts[0]!;
    expect(d.state).toBe('ready');
    expect(d.frontPath).toBe('u/item-1/front.jpg');
    expect(mockExtract).toHaveBeenCalledWith('item-1', ['u/item-1/front.jpg']);
  });

  it('stays waiting while still offline', async () => {
    await saveDraft(draft('item-1'));
    mockUpload.mockRejectedValue(new Error('Network request failed'));
    await processDrafts();
    expect(useDrafts.getState().drafts[0]?.state).toBe('waiting');
  });

  it('marks unreadable covers failed (the user fills them in) but keeps the upload', async () => {
    await saveDraft(draft('item-1'));
    mockUpload.mockResolvedValue('u/item-1/front.jpg');
    mockExtract.mockRejectedValue(new ExtractError('daily_limit' as never));
    await processDrafts();
    const d = useDrafts.getState().drafts[0]!;
    expect(d.state).toBe('failed');
    expect(d.frontPath).toBe('u/item-1/front.jpg');
  });

  it('removes a draft once reviewed', async () => {
    await saveDraft(draft('item-1'));
    removeDraft('item-1');
    expect(useDrafts.getState().drafts).toHaveLength(0);
  });
});
