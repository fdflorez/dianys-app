import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular/lazy';
import { AuthService } from '../services/auth.service';
import { CatalogoService } from '../services/catalogo.service';

@Component({
  selector: 'app-login',
  templateUrl: 'login.page.html',
  styleUrls: ['login.page.scss'],
  standalone: false,
})
export class LoginPage {
  email = '';
  password = '';
  verClave = false;
  cargando = false;
  error = '';

  private auth = inject(AuthService);
  private catalogo = inject(CatalogoService);
  private router = inject(Router);
  private toast = inject(ToastController);
  private alerta = inject(AlertController);
  private cdr = inject(ChangeDetectorRef);

  get formularioValido(): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim()) && this.password.length >= 4;
  }

  async ingresar() {
    if (!this.formularioValido || this.cargando) return;
    this.cargando = true;
    this.error = '';
    this.cdr.markForCheck();
    try {
      const u = await this.auth.login(this.email, this.password);
      this.password = '';
      const t = await this.toast.create({
        message: `Bienvenido, ${u.nombre}`, color: 'success', duration: 2000, position: 'top',
      });
      t.present();
      await this.router.navigateByUrl('/tabs/tab1', { replaceUrl: true });
    } catch (e: any) {
      this.error = e?.message ?? 'No se pudo iniciar sesión.';
    } finally {
      this.cargando = false;
      this.cdr.markForCheck();
    }
  }

  /** Permite cambiar la URL de la API antes de iniciar sesión (celular físico) */
  async configurarServidor() {
    const actual = await this.catalogo.getApiUrl();
    const a = await this.alerta.create({
      header: 'Servidor de la API',
      message: 'Emulador: 10.0.2.2 · Celular: IP del PC (ej. 192.168.1.10)',
      inputs: [{ name: 'url', type: 'url', value: actual }],
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        {
          text: 'Guardar',
          handler: async (v: { url: string }) => {
            await this.catalogo.setApiUrl(v.url);
            const ok = await this.catalogo.probarConexion(await this.catalogo.getApiUrl());
            const t = await this.toast.create({
              message: ok ? 'Conexión correcta con la API' : 'No se pudo conectar con esa URL',
              color: ok ? 'success' : 'danger', duration: 2500, position: 'top',
            });
            t.present();
          },
        },
      ],
    });
    await a.present();
  }
}
