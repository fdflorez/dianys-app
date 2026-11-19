import { TestBed } from '@angular/core/testing';
import { CarritoService } from './carrito.service';
import { CATALOGO_LOCAL } from './catalogo-local';

describe('CarritoService', () => {
  let carrito: CarritoService;
  const galaxy = { ...CATALOGO_LOCAL[0], stock: 2 };
  const mouse = CATALOGO_LOCAL[7];

  beforeEach(async () => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    carrito = TestBed.inject(CarritoService);
    await carrito.cargar();
  });

  it('agrega productos y calcula el total', async () => {
    await carrito.agregar(galaxy);
    await carrito.agregar(mouse);
    await carrito.agregar(mouse);
    expect(carrito.items().length).toBe(2);
    expect(carrito.cantidadTotal()).toBe(3);
    expect(carrito.total()).toBe(galaxy.precio + mouse.precio * 2);
  });

  it('no supera el stock disponible', async () => {
    expect(await carrito.agregar(galaxy)).toBe(true);
    expect(await carrito.agregar(galaxy)).toBe(true);
    expect(await carrito.agregar(galaxy)).toBe(false);
    await carrito.cambiarCantidad(galaxy.id, 10);
    expect(carrito.items()[0].cantidad).toBe(2);
  });

  it('confirma el pedido, lo guarda en el historial y vacía el carrito', async () => {
    await carrito.agregar(mouse);
    const pedido = await carrito.confirmarPedido();
    expect(pedido?.total).toBe(mouse.precio);
    expect(carrito.items().length).toBe(0);
    expect(carrito.pedidos()[0].codigo).toBe(pedido!.codigo);
    expect(carrito.mensajePedido(pedido!)).toContain(mouse.nombre);
  });

  it('quita productos del carrito', async () => {
    await carrito.agregar(mouse);
    await carrito.quitar(mouse.id);
    expect(carrito.items().length).toBe(0);
  });
});
