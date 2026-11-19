/**
 * Modelo de un dispositivo (producto) tal como lo devuelve
 * la API REST de Dianys Technology:  GET /api/v1/dispositivos
 */
export interface Dispositivo {
  id: number;
  nombre: string;
  descripcion: string | null;
  specs: string | null;
  precio: number;
  stock: number;
  fecha_lanzamiento: string;
  activo: boolean;
  imagen: string | null;
  imagen_url: string | null;
  marca: { id: number; nombre: string };
  tipo: { id: number; nombre: string };
}

/** Respuesta estándar de la API ( { ok, mensaje, datos, meta } ) */
export interface RespuestaApi<T> {
  ok: boolean;
  mensaje?: string;
  datos: T;
  meta?: { total?: number; pagina?: number; limite?: number; paginas?: number };
}

/** Foto guardada en el dispositivo (Paso 3 · Servicio de fotos) */
export interface UserPhoto {
  filepath: string;     // nombre/ruta del archivo en Directory.Data
  webviewPath?: string; // ruta que puede mostrar el <ion-img>
}

/** Usuario autenticado (respuesta de POST /auth/login) */
export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

/** Sesión guardada en el dispositivo */
export interface Sesion {
  token: string;
  usuario: Usuario;
  expira: number; // milisegundos (epoch) en que vence el token
}

/** Producto dentro del carrito de compras */
export interface ItemCarrito {
  id: number;
  nombre: string;
  precio: number;
  imagen: string | null;      // nombre del archivo (para la imagen de respaldo)
  imagen_url: string | null;
  stock: number;
  cantidad: number;
}

/** Pedido confirmado (historial local) */
export interface Pedido {
  codigo: string;
  fecha: string;
  items: ItemCarrito[];
  total: number;
}
