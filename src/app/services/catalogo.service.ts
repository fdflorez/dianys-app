/**
 * =========================================================
 *  Servicio de catálogo
 *  Consume la API REST del proyecto web Dianys Technology
 *  (PHP + MySQL en XAMPP):  GET {apiUrl}/dispositivos
 *
 *  Si la API no responde (XAMPP apagado, sin red...), la app
 *  muestra el catálogo de respaldo incluido en /assets, para
 *  que las pruebas en el emulador nunca queden en blanco.
 * =========================================================
 */
import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { Dispositivo, RespuestaApi } from '../models/dispositivo.model';
import { CATALOGO_LOCAL } from './catalogo-local';

export type OrigenDatos = 'api' | 'local';

@Injectable({ providedIn: 'root' })
export class CatalogoService {
  private readonly CLAVE_URL = 'dianys_api_url';
  private apiUrl = '';

  /**
   * URL por defecto de la API:
   *  - Navegador (ionic serve)        -> mismo origen + proxy.conf.json (o localhost)
   *  - Android (emulador o celular)   -> 127.0.0.1 con "adb reverse tcp:80 tcp:80"
   *                                      (si no, prueba 10.0.2.2 = PC visto desde el emulador)
   *  - Otra IP: cambiarla en la pestaña Tienda (ej. 192.168.1.10)
   */
  get urlPorDefecto(): string {
    if (Capacitor.getPlatform() === 'android') {
      return 'http://127.0.0.1/dianys_technology/api/v1';
    }
    // Navegador: mismo origen de ionic serve (proxy.conf.json reenvía a XAMPP)
    return `${window.location.origin}/dianys_technology/api/v1`;
  }

  /** URLs que se prueban en orden cuando el usuario no ha fijado una */
  private get candidatas(): string[] {
    const ruta = '/dianys_technology/api/v1';
    return Capacitor.getPlatform() === 'android'
      ? [`http://127.0.0.1${ruta}`, `http://10.0.2.2${ruta}`]
      : [`${window.location.origin}${ruta}`, `http://localhost${ruta}`];
  }

  private urlFijada = false;

  async getApiUrl(): Promise<string> {
    if (!this.apiUrl) {
      const { value } = await Preferences.get({ key: this.CLAVE_URL });
      this.urlFijada = !!value;
      this.apiUrl = value || this.urlPorDefecto;
    }
    return this.apiUrl;
  }

  async setApiUrl(url: string): Promise<void> {
    this.apiUrl = (url || this.urlPorDefecto).trim().replace(/\/+$/, '');
    this.urlFijada = true;
    await Preferences.set({ key: this.CLAVE_URL, value: this.apiUrl });
  }

  /**
   * Hace una petición a la API probando las URL candidatas
   * (o solo la URL fijada por el usuario). Devuelve la respuesta
   * de la primera URL que conteste; si ninguna responde, lanza el error.
   */
  async peticion(ruta: string, init: RequestInit = {}, ms = 6000): Promise<Response> {
    await this.getApiUrl();
    const urls = this.urlFijada ? [this.apiUrl] : [this.apiUrl, ...this.candidatas.filter(u => u !== this.apiUrl)];
    let ultimoError: unknown = new Error('Sin conexión');
    for (const base of urls) {
      try {
        const resp = await this.fetchConTiempo(`${base}${ruta}`, ms, init);
        this.apiUrl = base; // recuerda la que funcionó en esta sesión
        return resp;
      } catch (e) {
        ultimoError = e;
      }
    }
    throw ultimoError;
  }

  /** Lista los dispositivos activos. Devuelve también el origen de los datos. */
  async listar(q = ''): Promise<{ datos: Dispositivo[]; origen: OrigenDatos; error?: string }> {
    const params = new URLSearchParams({ activo: '1', limite: '100', orden: 'nombre' });
    if (q.trim()) params.set('q', q.trim());
    try {
      const resp = await this.peticion(`/dispositivos?${params}`, {}, 5000);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const json = (await resp.json()) as RespuestaApi<Dispositivo[]>;
      const datos = (json.datos ?? []).map(d => ({ ...d, imagen_url: this.ajustarUrlImagen(d.imagen_url) }));
      return { datos, origen: 'api' };
    } catch (e: any) {
      const texto = q.trim().toLowerCase();
      const datos = CATALOGO_LOCAL.filter(d =>
        !texto ||
        d.nombre.toLowerCase().includes(texto) ||
        d.marca.nombre.toLowerCase().includes(texto) ||
        d.tipo.nombre.toLowerCase().includes(texto));
      return { datos, origen: 'local', error: e?.message ?? 'Sin conexión' };
    }
  }

  /**
   * La API arma las URL de las imágenes con "localhost". En el emulador o
   * en un celular ese host no es el PC, así que se cambia por el servidor
   * que respondió (por ejemplo 10.0.2.2 o la IP del PC).
   */
  private ajustarUrlImagen(url: string | null): string | null {
    if (!url) return url;
    try {
      const imagen = new URL(url);
      const api = new URL(this.apiUrl);
      if (['localhost', '127.0.0.1'].includes(imagen.hostname) && imagen.host !== api.host) {
        imagen.protocol = api.protocol;
        imagen.host = api.host;
        return imagen.toString();
      }
    } catch {
      // URL relativa o inválida: se deja igual
    }
    return url;
  }

  /** Comprueba si la API responde (GET /) */
  async probarConexion(url: string): Promise<boolean> {
    try {
      const resp = await this.fetchConTiempo(url.replace(/\/+$/, '') + '/', 5000);
      return resp.ok;
    } catch {
      return false;
    }
  }

  private async fetchConTiempo(url: string, ms: number, init: RequestInit = {}): Promise<Response> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
      const headers = { Accept: 'application/json', ...(init.headers as Record<string, string> | undefined) };
      return await fetch(url, { ...init, signal: ctrl.signal, headers });
    } finally {
      clearTimeout(t);
    }
  }
}
