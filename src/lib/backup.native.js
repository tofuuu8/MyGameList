// Phone version: saves a file and opens the share sheet; picks a backup file to restore.
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

export async function saveAndShare(filename, mimeType, content) {
  const file = new File(Paths.cache, filename);
  if (file.exists) file.delete();
  file.create();
  await file.write(content);
  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Sharing is not available on this phone.');
  }
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: 'Save or share your file' });
}

// Returns the text inside the chosen file, or null if the person cancelled.
export async function pickTextFile() {
  const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, type: '*/*' });
  if (result.canceled || !result.assets || result.assets.length === 0) return null;
  const file = new File(result.assets[0]);
  return await file.text();
}
