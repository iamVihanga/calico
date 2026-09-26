import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { copy } from '@/i18n/en';
import { colomboToday } from '@/lib/dates';

import { exportMyData } from './api';
import { booksCsv, exportFileName } from './logic';

/**
 * Settings → Export (plan §11.13): `export_my_data()` as pretty JSON, or the books as CSV, written to the
 * cache folder and handed to the share sheet.
 */
export async function shareExport(format: 'json' | 'csv'): Promise<void> {
  const data = await exportMyData();
  const today = colomboToday();
  const file = new File(
    Paths.cache,
    format === 'json' ? exportFileName(today, 'json') : exportFileName(today, 'csv', 'books'),
  );
  file.create({ overwrite: true });
  file.write(format === 'json' ? JSON.stringify(data, null, 2) : booksCsv(data));
  await Sharing.shareAsync(file.uri, {
    mimeType: format === 'json' ? 'application/json' : 'text/csv',
    dialogTitle: copy.account.exportTitle,
  });
}
