import { Injectable } from '@angular/core';
import { Plugins, CameraResultType, Capacitor, FilesystemDirectory, CameraPhoto, CameraSource } from '@capacitor/core';
import { Platform } from '@ionic/angular';
import { HttpClient } from '@angular/common/http';

import { environment } from './../../environments/environment';

const { Camera, Filesystem } = Plugins;

@Injectable({
  providedIn: 'root'
})
export class PhotoService {
  private platform: Platform;
  searchObject: any;
  loading = false;

  constructor(
    platform: Platform,
    private http: HttpClient
  ) {
    this.platform = platform;
  }

  public async search() {
    try {
      const capturedPhoto = await Camera.getPhoto({
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera,
        quality: 50
      });

      this.loading = true;

      this.readAsBase64(capturedPhoto)
        .then(data => {
          this.consulta({ b64image: data });
        }, err => console.error);
    } catch (error) {
      return error;
    }
  }

  private async readAsBase64(cameraPhoto: CameraPhoto) {
    if (this.platform.is('hybrid')) {
      const file = await Filesystem.readFile({
        path: cameraPhoto.path
      });

      return file.data;
    } else {
      // tslint:disable-next-line: no-non-null-assertion
      const response = await fetch(cameraPhoto.webPath!);
      const blob = await response.blob();

      return await this.convertBlobToBase64(blob) as string;
    }
  }

  convertBlobToBase64 = (blob: Blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      resolve(reader.result);
    };
    reader.readAsDataURL(blob);
  })

  consulta(file) {
    this.consultaCloud(file).subscribe(
      success => {
        this.loading = false;
        this.searchObject = success;
      },
      error => {
        console.error(error);
      }
    );
  }

  consultaCloud(file) {
    try {
      return this.http.post(`${environment.wvr.url}`, file);
    } catch (e) {
      return e;
    }
  }
}

interface Photo {
  filepath: string;
  webviewPath: string;
  base64?: string;
}
