import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { ActionSheetController } from '@ionic/angular/lazy';
import { PhotoService } from '../services/photo.service';
import { UserPhoto } from '../models/dispositivo.model';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  standalone: false,
})
export class Tab2Page implements OnInit {

  public photoService = inject(PhotoService);
  private actionSheetCtrl = inject(ActionSheetController);
  private cdr = inject(ChangeDetectorRef);

  async ngOnInit() {
    // loadSaved(): al abrir la app, recupera las fotos guardadas
    await this.photoService.loadSaved();
    this.cdr.markForCheck();
  }

  addPhotoToGallery() {
    this.photoService.addNewToGallery()
      .then(() => this.cdr.markForCheck())
      .catch(err => console.warn('Cámara cancelada', err));
  }

  async showActionSheet(photo: UserPhoto, position: number) {
    const sheet = await this.actionSheetCtrl.create({
      header: 'Foto del equipo',
      buttons: [
        {
          text: 'Eliminar',
          role: 'destructive',
          icon: 'trash',
          handler: () => {
            this.photoService.deletePicture(photo, position).then(() => this.cdr.markForCheck());
          },
        },
        { text: 'Cancelar', icon: 'close', role: 'cancel' },
      ],
    });
    await sheet.present();
  }
}
