/**
 * =========================================================
 *  Servicio de autenticación
 *  POST {apiUrl}/auth/login   { email, password }  -> token JWT
 *  GET  {apiUrl}/auth/perfil  Authorization: Bearer <token>
 *
 *  La sesión (token + usuario + vencimiento) se guarda con
 *  Capacitor Preferences para que el usuario no tenga que
 *  iniciar sesión cada vez que abre la app.
 * =========================================================
 */
import { Injectable, computed, inject, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { CatalogoService } from './catalogo.service';
import { RespuestaApi, Sesion, Usuario } from '../models/dispositivo.model';

interface RespuestaLogin {
  token: string;
  tipo: string;
  expira_en: number; // segundos
  usuario: Usuario;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly CLAVE_SESION = 'dianys_sesion';
  private catalogo = inject(CatalogoService);

  private sesion = signal<Sesion | null>(null);
  private cargada = false;

  /** Usuario actual (null si no hay sesión) */
  readonly usuario = computed(() => this.sesion()?.usuario ?? null);
  readonly autenticado = computed(() => this.sesionVigente(this.sesion()));

  /** Lee la sesión guardada en el dispositivo (una sola vez) */
  async cargarSesion(): Promise<void> {
    if (this.cargada) return;
    const { value } = await Preferences.get({ key: this.CLAVE_SESION });
    let guardada: Sesion | null = null;
    try {
      guardada = value ? (JSON.parse(value) as Sesion) : null;
    } catch {
      guardada = null;
    }
    if (guardada && !this.sesionVigente(guardada)) {
      await Preferences.remove({ key: this.CLAVE_SESION });
      guardada = null;
    }
    this.sesion.set(guardada);
    this.cargada = true;
  }

  /** ¿Hay una sesión válida? (usado por el guard de rutas) */
  async estaAutenticado(): Promise<boolean> {
    await this.cargarSesion();
    return this.sesionVigente(this.sesion());
  }

  /** Inicia sesión contra la API REST. Lanza un Error con un mensaje legible. */
  async login(email: string, password: string): Promise<Usuario> {
    let resp: Response;
    try {
      resp = await this.catalogo.peticion('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
    } catch {
      throw new Error('No hay conexión con el servidor. Revisa tu red o la URL de la API.');
    }

    let json: RespuestaApi<RespuestaLogin> | null = null;
    try {
      json = (await resp.json()) as RespuestaApi<RespuestaLogin>;
    } catch {
      json = null;
    }

    if (!resp.ok || !json?.ok || !json.datos?.token) {
      if (resp.status === 401) throw new Error('Correo o contraseña incorrectos.');
      if (resp.status === 403) throw new Error('La cuenta está desactivada.');
      if (resp.status === 422) throw new Error('Escribe un correo válido y la contraseña.');
      throw new Error(json?.mensaje || `El servidor respondió con error (${resp.status}).`);
    }

    const nueva: Sesion = {
      token: json.datos.token,
      usuario: json.datos.usuario,
      expira: Date.now() + json.datos.expira_en * 1000,
    };
    await Preferences.set({ key: this.CLAVE_SESION, value: JSON.stringify(nueva) });
    this.sesion.set(nueva);
    this.cargada = true;
    return nueva.usuario;
  }

  /** Comprueba con la API que el token siga siendo válido */
  async verificarToken(): Promise<boolean> {
    const s = this.sesion();
    if (!s) return false;
    try {
      const resp = await this.catalogo.peticion('/auth/perfil', {
        headers: { Authorization: `Bearer ${s.token}` },
      });
      if (resp.status === 401) {
        await this.logout();
        return false;
      }
      return resp.ok;
    } catch {
      // Sin conexión: se mantiene la sesión local mientras no venza
      return this.sesionVigente(s);
    }
  }

  /** Encabezado Authorization para peticiones protegidas */
  encabezadoAuth(): Record<string, string> {
    const s = this.sesion();
    return s ? { Authorization: `Bearer ${s.token}` } : {};
  }

  async logout(): Promise<void> {
    await Preferences.remove({ key: this.CLAVE_SESION });
    this.sesion.set(null);
  }

  private sesionVigente(s: Sesion | null): boolean {
    return !!s && !!s.token && s.expira > Date.now();
  }
}
