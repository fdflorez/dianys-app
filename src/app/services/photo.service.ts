/**
 * =========================================================
 *  PASO 3 · Servicio de fotos  (ionic g service services/photo)
 * =========================================================
 *  Camera.getPhoto()       -> toma la foto
 *  Filesystem.writeFile()  -> guarda el archivo en Directory.Data
 *  Preferences.set()       -> guarda la lista de fotos (JSON)
 *  loadSaved()             -> al abrir la app, recupera las fotos
 *
 *  Uso en Dianys Technology: el cliente fotografía el equipo
 *  que trae a servicio técnico (daños, serial, accesorios).
 */
import { Injectable, inject } from '@angular/core';
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { Platform } from '@ionic/angular/lazy';
import { UserPhoto } from '../models/dispositivo.model';

@Injectable({ providedIn: 'root' })
export class PhotoService {
  public photos: UserPhoto[] = [];
  private PHOTO_STORAGE = 'dianys_fotos';

  private platform = inject(Platform);

  /** Toma una foto con la cámara y la agrega al inicio de la galería */
  public async addNewToGallery(): Promise<void> {
    const foto = await Camera.getPhoto({
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
      quality: 100,
    });

    const guardada = await this.savePicture(foto);
    this.photos.unshift(guardada);

    await Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos),
    });
  }

  /** Guarda el archivo de la foto en el almacenamiento del dispositivo */
  private async savePicture(photo: Photo): Promise<UserPhoto> {
    const base64Data = await this.readAsBase64(photo);
    const fileName = 'dianys_' + Date.now() + '.jpeg';

    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64Data,
      directory: Directory.Data,
    });

    if (this.platform.is('hybrid')) {
      // Android / iOS: se usa la ruta nativa convertida para el WebView
      return {
        filepath: savedFile.uri,
        webviewPath: Capacitor.convertFileSrc(savedFile.uri),
      };
    }
    // Navegador: la foto ya está en memoria
    return { filepath: fileName, webviewPath: photo.webPath };
  }

  /** Al abrir la app recupera la lista de fotos guardadas */
  public async loadSaved(): Promise<void> {
    const { value } = await Preferences.get({ key: this.PHOTO_STORAGE });
    this.photos = (value ? JSON.parse(value) : []) as UserPhoto[];

    // En el navegador hay que leer cada archivo y convertirlo a base64
    if (!this.platform.is('hybrid')) {
      for (const photo of this.photos) {
        try {
          const readFile = await Filesystem.readFile({
            path: photo.filepath,
            directory: Directory.Data,
          });
          photo.webviewPath = `data:image/jpeg;base64,${readFile.data}`;
        } catch {
          photo.webviewPath = undefined;
        }
      }
      this.photos = this.photos.filter(p => !!p.webviewPath);
    }
  }

  /** Elimina una foto de la lista y del almacenamiento */
  public async deletePicture(photo: UserPhoto, position: number): Promise<void> {
    this.photos.splice(position, 1);
    await Preferences.set({
      key: this.PHOTO_STORAGE,
      value: JSON.stringify(this.photos),
    });

    const filename = photo.filepath.substring(photo.filepath.lastIndexOf('/') + 1);
    await Filesystem.deleteFile({ path: filename, directory: Directory.Data });
  }

  private async readAsBase64(photo: Photo): Promise<string> {
    if (this.platform.is('hybrid')) {
      const file = await Filesystem.readFile({ path: photo.path! });
      return file.data as string;
    }
    const response = await fetch(photo.webPath!);
    const blob = await response.blob();
    return (await this.convertBlobToBase64(blob)) as string;
  }

  private convertBlobToBase64 = (blob: Blob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
}
