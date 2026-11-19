import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular/lazy';
import { Capacitor } from '@capacitor/core';
import { CatalogoService } from '../services/catalogo.service';
import { AuthService } from '../services/auth.service';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: false,
})
export class Tab3Page implements OnInit {
  apiUrl = '';
  plataforma = Capacitor.getPlatform();
  probando = false;

  servicios = [
    { titulo: 'Mantenimiento y reparación', icono: 'build-outline',
      texto: 'Diagnóstico y reparación de hardware y software en portátiles y PC.' },
    { titulo: 'Instalación de cámaras', icono: 'videocam-outline',
      texto: 'Instalación, configuración y monitoreo de videovigilancia.' },
    { titulo: 'Asesoría y venta', icono: 'cart-outline',
      texto: 'Periféricos y equipos con acompañamiento técnico.' },
    { titulo: 'Soporte corporativo', icono: 'business-outline',
      texto: 'Mantenimiento preventivo para empresas y oficinas.' },
  ];

  plugins = [
    { nombre: '@capacitor/camera', uso: 'Abre la cámara y devuelve la foto' },
    { nombre: '@capacitor/filesystem', uso: 'Guarda la imagen en el dispositivo' },
    { nombre: '@capacitor/preferences', uso: 'Guarda la sesión, el carrito, los pedidos y la lista de fotos (JSON)' },
    { nombre: '@ionic/pwa-elements', uso: 'Permite usar la cámara en el navegador' },
  ];

  version = environment.version;
  auth = inject(AuthService);
  private router = inject(Router);
  private alerta = inject(AlertController);
  private catalogo = inject(CatalogoService);
  private toast = inject(ToastController);
  private cdr = inject(ChangeDetectorRef);

  async ngOnInit() {
    this.apiUrl = await this.catalogo.getApiUrl();
    this.cdr.markForCheck();
  }

  async guardarUrl() {
    await this.catalogo.setApiUrl(this.apiUrl);
    this.apiUrl = await this.catalogo.getApiUrl();
    this.probando = true;
    this.cdr.markForCheck();
    const ok = await this.catalogo.probarConexion(this.apiUrl);
    this.probando = false;
    this.cdr.markForCheck();
    const t = await this.toast.create({
      message: ok ? 'Conexión correcta con la API ✔' : 'No se pudo conectar. Revisa XAMPP y la URL.',
      color: ok ? 'success' : 'danger', duration: 2500, position: 'top',
    });
    t.present();
  }

  async restaurarUrl() {
    this.apiUrl = this.catalogo.urlPorDefecto;
    await this.guardarUrl();
  }

  async cerrarSesion() {
    const a = await this.alerta.create({
      header: 'Cerrar sesión',
      message: '¿Deseas salir de tu cuenta?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Salir', role: 'destructive', handler: async () => {
            await this.auth.logout();
            await this.router.navigateByUrl('/login', { replaceUrl: true });
          },
        },
      ],
    });
    await a.present();
  }

  abrirWhatsApp() {
    window.open('https://wa.me/573133463592?text=' +
      encodeURIComponent('Hola Dianys Technology, quiero información.'), '_system');
  }
}
