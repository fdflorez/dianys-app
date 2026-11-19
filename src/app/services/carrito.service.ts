/**
 * =========================================================
 *  Servicio del carrito de compras
 *  - Agrega, quita y cambia cantidades respetando el stock.
 *  - Calcula subtotal, cantidad de artículos y total.
 *  - Guarda el carrito y el historial de pedidos con
 *    Capacitor Preferences (almacenamiento local), por lo que
 *    el carrito sigue ahí aunque se cierre la app.
 * =========================================================
 */
import { Injectable, computed, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { Dispositivo, ItemCarrito, Pedido } from '../models/dispositivo.model';

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly CLAVE_CARRITO = 'dianys_carrito';
  private readonly CLAVE_PEDIDOS = 'dianys_pedidos';

  readonly items = signal<ItemCarrito[]>([]);
  readonly pedidos = signal<Pedido[]>([]);

  /** Número total de unidades en el carrito (para el distintivo de la pestaña) */
  readonly cantidadTotal = computed(() => this.items().reduce((n, i) => n + i.cantidad, 0));
  readonly total = computed(() => this.items().reduce((t, i) => t + i.precio * i.cantidad, 0));

  private cargado = false;

  /** Recupera el carrito y los pedidos guardados en el dispositivo */
  async cargar(): Promise<void> {
    if (this.cargado) return;
    this.items.set(await this.leer<ItemCarrito[]>(this.CLAVE_CARRITO, []));
    this.pedidos.set(await this.leer<Pedido[]>(this.CLAVE_PEDIDOS, []));
    this.cargado = true;
  }

  /**
   * Agrega un producto. Si ya está en el carrito suma una unidad.
   * Devuelve false si no hay stock suficiente.
   */
  async agregar(d: Dispositivo, cantidad = 1): Promise<boolean> {
    await this.cargar();
    if (d.stock <= 0) return false;
    const lista = [...this.items()];
    const existente = lista.find(i => i.id === d.id);
    if (existente) {
      if (existente.cantidad + cantidad > d.stock) return false;
      existente.cantidad += cantidad;
      existente.stock = d.stock;
      existente.precio = d.precio;
    } else {
      lista.push({
        id: d.id,
        nombre: d.nombre,
        precio: d.precio,
        imagen: d.imagen,
        imagen_url: d.imagen_url,
        stock: d.stock,
        cantidad: Math.min(cantidad, d.stock),
      });
    }
    await this.guardar(lista);
    return true;
  }

  /** Cambia la cantidad de un producto (entre 1 y el stock disponible) */
  async cambiarCantidad(id: number, cantidad: number): Promise<void> {
    const lista = this.items()
      .map(i => (i.id === id ? { ...i, cantidad: Math.max(1, Math.min(cantidad, i.stock)) } : i));
    await this.guardar(lista);
  }

  async quitar(id: number): Promise<void> {
    await this.guardar(this.items().filter(i => i.id !== id));
  }

  async vaciar(): Promise<void> {
    await this.guardar([]);
  }

  /**
   * Confirma el pedido: lo guarda en el historial local, vacía
   * el carrito y devuelve el pedido para enviarlo a la tienda.
   */
  async confirmarPedido(): Promise<Pedido | null> {
    const items = this.items();
    if (items.length === 0) return null;
    const pedido: Pedido = {
      codigo: 'DT-' + Date.now().toString(36).toUpperCase(),
      fecha: new Date().toISOString(),
      items: items.map(i => ({ ...i })),
      total: this.total(),
    };
    const historial = [pedido, ...this.pedidos()].slice(0, 20);
    this.pedidos.set(historial);
    await Preferences.set({ key: this.CLAVE_PEDIDOS, value: JSON.stringify(historial) });
    await this.vaciar();
    return pedido;
  }

  /** Texto del pedido para enviarlo por WhatsApp */
  mensajePedido(p: Pedido, cliente?: string): string {
    const pesos = (v: number) => '$' + v.toLocaleString('es-CO');
    const lineas = p.items.map(i => `• ${i.cantidad} x ${i.nombre} = ${pesos(i.precio * i.cantidad)}`);
    return [
      `Hola Dianys Technology, quiero hacer el pedido ${p.codigo}` + (cliente ? ` (cliente: ${cliente})` : '') + ':',
      ...lineas,
      `Total: ${pesos(p.total)}`,
    ].join('\n');
  }

  private async guardar(lista: ItemCarrito[]): Promise<void> {
    this.items.set(lista);
    await Preferences.set({ key: this.CLAVE_CARRITO, value: JSON.stringify(lista) });
  }

  private async leer<T>(clave: string, defecto: T): Promise<T> {
    const { value } = await Preferences.get({ key: clave });
    if (!value) return defecto;
    try {
      return JSON.parse(value) as T;
    } catch {
      return defecto;
    }
  }
}
