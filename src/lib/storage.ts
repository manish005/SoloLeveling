import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
  type StorageReference,
} from 'firebase/storage'
import { storage } from './firebase'

/** Upload a file with progress callback, returns download URL */
export const uploadFile = (
  path: string,
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> => {
  return new Promise((resolve, reject) => {
    const storageRef: StorageReference = ref(storage, path)
    const uploadTask = uploadBytesResumable(storageRef, file)

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const percent = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        onProgress?.(percent)
      },
      (error) => reject(error),
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref)
        resolve(url)
      }
    )
  })
}

/** Upload avatar image */
export const uploadAvatar = (uid: string, file: File, onProgress?: (p: number) => void) =>
  uploadFile(`avatars/${uid}/avatar_${Date.now()}`, file, onProgress)

/** Upload cover photo */
export const uploadCover = (uid: string, file: File, onProgress?: (p: number) => void) =>
  uploadFile(`covers/${uid}/cover_${Date.now()}`, file, onProgress)

/** Delete file by URL */
export const deleteFile = async (url: string): Promise<void> => {
  try {
    const storageRef = ref(storage, url)
    await deleteObject(storageRef)
  } catch {
    // Ignore if file doesn't exist
  }
}
