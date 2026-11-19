import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CatalogoService, OrigenDatos } from '../services/catalogo.service';
import { Dispositivo } from '../models/dispositivo.model';
import { CarritoService } from '../services/carrito.service';
import { ToastController } from '@ionic/angular/lazy';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page implements OnInit {
  dispositivos: Dispositivo[] = [];
  origen: OrigenDatos = 'api';
  cargando = true;
  busqueda = '';
  seleccionado: Dispositivo | null = null;

  private catalogo = inject(CatalogoService);
  private cdr = inject(ChangeDetectorRef);
  private carrito = inject(CarritoService);
  private toast = inject(ToastController);

  ngOnInit() {
    this.cargar();
  }

  async cargar(event?: any) {
    this.cargando = !event;
    const r = await this.catalogo.listar(this.busqueda);
    this.dispositivos = r.datos;
    this.origen = r.origen;
    this.cargando = false;
    this.cdr.markForCheck(); // Angular sin zone.js: refrescar la vista
    event?.target?.complete();
  }

  buscar(ev: any) {
    this.busqueda = ev?.detail?.value ?? '';
    this.cargar();
  }

  imagen(d: Dispositivo): string {
    return d.imagen_url || 'assets/logo.png';
  }

  imagenRespaldo(ev: Event, d: Dispositivo) {
    const img = ev.target as HTMLImageElement;
    const local = 'assets/productos/' + (d.imagen ?? '').replace(/\.[a-z]+$/i, '.jpg');
    img.src = img.src.includes('assets/') ? 'assets/logo.png' : local;
  }

  async agregarAlCarrito(d: Dispositivo, ev?: Event) {
    ev?.stopPropagation(); // que el clic en "Agregar" no abra el detalle
    const ok = await this.carrito.agregar(d);
    const t = await this.toast.create({
      message: ok ? `${d.nombre} agregado al carrito` : `No hay más unidades disponibles de ${d.nombre}`,
      color: ok ? 'success' : 'warning', duration: 1500, position: 'top',
    });
    t.present();
  }

  pedirWhatsApp(d: Dispositivo) {
    const msg = encodeURIComponent(`Hola Dianys Technology, me interesa: ${d.nombre}`);
    window.open(`https://wa.me/573133463592?text=${msg}`, '_system');
  }
}
