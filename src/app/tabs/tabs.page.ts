import { Component, OnInit, inject } from '@angular/core';
import { CarritoService } from '../services/carrito.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  standalone: false,
})
export class TabsPage implements OnInit {
  carrito = inject(CarritoService);
  private auth = inject(AuthService);

  ngOnInit() {
    this.carrito.cargar();
    // Valida el token con la API al abrir la app (si venció, se cierra la sesión)
    this.auth.verificarToken();
  }
}
