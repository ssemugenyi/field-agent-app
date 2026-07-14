import * as ImagePicker from 'expo-image-picker';
import { File, Directory, Paths } from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { insertPhoto } from '../db/photos.repo';

function getPhotosDir(): Directory {
  const dir = new Directory(Paths.document, 'inspection-photos');
  if (!dir.exists) dir.create();
  return dir;
}

async function persist(uri: string, inspectionLocalId: string, roomId: string): Promise<string> {
  const localId = Crypto.randomUUID();
  const ext = uri.split('.').pop()?.split('?')[0] || 'jpg';
  const dest = new File(getPhotosDir(), `${localId}.${ext}`);
  const src = new File(uri);
  await src.copy(dest);
  await insertPhoto(localId, dest.uri, inspectionLocalId, roomId);
  return localId;
}

export async function captureFromCamera(inspectionLocalId: string, roomId: string): Promise<string | null> {
  const perm = await ImagePicker.requestCameraPermissionsAsync();
  if (!perm.granted) return null;
  const result = await ImagePicker.launchCameraAsync({ quality: 0.6, mediaTypes: ['images'] });
  if (result.canceled || !result.assets?.[0]) return null;
  return persist(result.assets[0].uri, inspectionLocalId, roomId);
}

export async function pickFromLibrary(inspectionLocalId: string, roomId: string): Promise<string | null> {
  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.6, mediaTypes: ['images'] });
  if (result.canceled || !result.assets?.[0]) return null;
  return persist(result.assets[0].uri, inspectionLocalId, roomId);
}
