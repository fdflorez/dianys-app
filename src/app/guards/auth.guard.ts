/**
 * Guard de rutas: solo deja entrar a las pestañas de la tienda
 * si hay una sesión válida; si no, envía al usuario a /login.
 */
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return (await auth.estaAutenticado()) ? true : router.parseUrl('/login');
};

/** Evita volver a la pantalla de login si ya hay sesión */
export const invitadoGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return (await auth.estaAutenticado()) ? router.parseUrl('/tabs/tab1') : true;
};
