import { Component, OnInit, inject } from '@angular/core';
import { AlertController, ToastController } from '@ionic/angular/lazy';
import { CarritoService } from '../services/carrito.service';
import { AuthService } from '../services/auth.service';
import { ItemCarrito } from '../models/dispositivo.model';

@Component({
  selector: 'app-tab4',
  templateUrl: 'tab4.page.html',
  styleUrls: ['tab4.page.scss'],
  standalone: false,
})
export class Tab4Page implements OnInit {
  carrito = inject(CarritoService);
  private auth = inject(AuthService);
  private alerta = inject(AlertController);
  private toast = inject(ToastController);

  ngOnInit() {
    this.carrito.cargar();
  }

  imagen(i: ItemCarrito): string {
    return i.imagen_url || 'assets/logo.png';
  }

  /** Si la imagen del servidor no carga, usa la copia incluida en la app */
  imagenRespaldo(ev: Event, i: ItemCarrito) {
    const img = ev.target as HTMLImageElement;
    const local = 'assets/productos/' + (i.imagen ?? '').replace(/\.[a-z]+$/i, '.jpg');
    img.src = img.src.includes('assets/') || !i.imagen ? 'assets/logo.png' : local;
  }

  sumar(i: ItemCarrito) {
    if (i.cantidad >= i.stock) {
      this.aviso(`Solo hay ${i.stock} unidades disponibles`, 'warning');
      return;
    }
    this.carrito.cambiarCantidad(i.id, i.cantidad + 1);
  }

  restar(i: ItemCarrito) {
    if (i.cantidad <= 1) {
      this.quitar(i);
      return;
    }
    this.carrito.cambiarCantidad(i.id, i.cantidad - 1);
  }

  async quitar(i: ItemCarrito) {
    await this.carrito.quitar(i.id);
    this.aviso(`${i.nombre} se quitó del carrito`, 'medium');
  }

  async vaciar() {
    const a = await this.alerta.create({
      header: 'Vaciar carrito',
      message: '¿Seguro que quieres quitar todos los productos?',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Vaciar', role: 'destructive', handler: () => this.carrito.vaciar() },
      ],
    });
    await a.present();
  }

  async finalizar() {
    const a = await this.alerta.create({
      header: 'Confirmar pedido',
      message: `Total a pagar: $${this.carrito.total().toLocaleString('es-CO')}. ` +
        'El pedido se enviará a la tienda por WhatsApp para coordinar el pago y la entrega.',
      buttons: [
        { text: 'Cancelar', role: 'cancel' },
        { text: 'Confirmar', handler: () => this.confirmar() },
      ],
    });
    await a.present();
  }

  private async confirmar() {
    const pedido = await this.carrito.confirmarPedido();
    if (!pedido) return;
    const texto = this.carrito.mensajePedido(pedido, this.auth.usuario()?.nombre);
    window.open(`https://wa.me/573133463592?text=${encodeURIComponent(texto)}`, '_system');
    this.aviso(`Pedido ${pedido.codigo} registrado`, 'success');
  }

  private async aviso(message: string, color: string) {
    const t = await this.toast.create({ message, color, duration: 1800, position: 'top' });
    t.present();
  }
}
