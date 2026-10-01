/* La versión DEMO: los pagos se simulan dentro de la página, sin ninguna llamada de red. */
import { screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { addFigure, cartDialog, choosePayment, goToPay, mpDialog, renderShop } from './helpers.jsx';

const text = () => cartDialog().textContent.replace(/\s+/g, ' ');
let fetchSpy;

beforeEach(() => {
  globalThis.__DEMO__ = true;
  fetchSpy = vi.fn(() => Promise.reject(new Error('la demo no debe usar la red')));
  globalThis.fetch = fetchSpy;
});

async function payWithMP(user, title = /Sasaki/) {
  const dlg = await goToPay(user, title);
  await user.click(within(dlg).getByRole('button', { name: 'Pagar con Mercado Pago' }));
  await waitFor(() => expect(mpDialog().hasAttribute('open')).toBe(true));
  return mpDialog();
}

describe('demo: cartel', () => {
  it('avisa que los pagos son simulados', () => {
    renderShop();
    expect(screen.getByRole('note').textContent).toContain('MODO DEMO');
  });
});

describe('demo: Mercado Pago simulado', () => {
  it('abre la pantalla simulada con el detalle y el total', async () => {
    const { user } = renderShop();
    const mp = await payWithMP(user);
    expect(mp.textContent).toContain('SIMULACIÓN');
    expect(mp.textContent).toContain('Sasaki Kojirō, el espadachín × 1');
    expect(within(mp).getByText('Total').nextSibling.textContent).toBe('$107.000');    // 98.500 + envío 8.500
  });

  it('aprobado: vuelve a la tienda, confirma, vacía el carrito y descuenta stock', async () => {
    const { user } = renderShop();
    const mp = await payWithMP(user);
    await user.click(within(mp).getByRole('button', { name: 'Pagar (aprobado)' }));
    await waitFor(() => expect(text()).toContain('Compra confirmada'));
    expect(mp.hasAttribute('open')).toBe(false);
    expect(document.querySelector('#cnt').classList.contains('hidden')).toBe(true);
    expect(JSON.parse(localStorage.getItem('gg_sold'))).toEqual({ 4: 1 });
  });

  it('rechazado: explica el motivo y conserva el carrito', async () => {
    const { user } = renderShop();
    const mp = await payWithMP(user);
    await user.click(within(mp).getByRole('button', { name: 'Simular pago rechazado' }));
    await waitFor(() => expect(text()).toContain('No pudimos completar el pago'));
    expect(document.querySelector('#cnt').textContent).toBe('1');
  });

  it('pendiente: muestra "Pedido recibido"', async () => {
    const { user } = renderShop();
    const mp = await payWithMP(user);
    await user.click(within(mp).getByRole('button', { name: 'Simular pago pendiente (efectivo)' }));
    await waitFor(() => expect(text()).toContain('Pedido recibido'));
    expect(text()).toContain('pendiente de acreditación');
  });

  it('volver sin pagar: mantiene el carrito', async () => {
    const { user } = renderShop();
    const mp = await payWithMP(user);
    await user.click(within(mp).getByRole('button', { name: 'Volver al sitio sin pagar' }));
    await waitFor(() => expect(text()).toContain('No se completó el pago'));
    expect(document.querySelector('#cnt').textContent).toBe('1');
  });
});

describe('demo: tarjeta simulada', () => {
  async function toCard(user, title = /Brunhilde/) {
    const dlg = await goToPay(user, title);
    await choosePayment(user, 'Tarjeta');
    await waitFor(() => expect(within(dlg).getByText(/SIMULACIÓN: no escribas datos/)).toBeTruthy());
    return dlg;
  }
  const submit = (user, dlg) => user.click(within(dlg).getByRole('button', { name: /^Pagar \$/ }));

  it('muestra el formulario con el total y el aviso', async () => {
    const { user } = renderShop();
    const dlg = await toCard(user);
    expect(within(dlg).getByRole('button', { name: 'Pagar $168.400' })).toBeTruthy();
    expect(within(dlg).getByRole('option', { name: '3 cuotas de $56.133' })).toBeTruthy();
  });

  it('no acepta una tarjeta que no sea de prueba (protege de escribir una real)', async () => {
    const { user } = renderShop();
    const dlg = await toCard(user);
    await user.type(within(dlg).getByPlaceholderText('5031 7557 3453 0604'), '4111 1111 1111 1111');
    await user.type(within(dlg).getByPlaceholderText('11/30'), '11/30');
    await user.type(within(dlg).getByPlaceholderText('123'), '123');
    await user.type(within(dlg).getByPlaceholderText('APRO'), 'APRO');
    await user.type(within(dlg).getByPlaceholderText('12345678'), '12345678');
    await submit(user, dlg);
    expect(within(dlg).getByText(/solo se aceptan las tarjetas de prueba/)).toBeTruthy();
    expect(text()).toContain('Medio de pago');
  });

  it('valida titular desconocido y tarjeta vencida', async () => {
    const { user } = renderShop();
    const dlg = await toCard(user);
    await user.selectOptions(within(dlg).getByLabelText('Completar con datos de prueba'), 'approved');
    await user.clear(within(dlg).getByPlaceholderText('APRO'));
    await user.type(within(dlg).getByPlaceholderText('APRO'), 'JUAN PEREZ');
    await submit(user, dlg);
    expect(within(dlg).getByText(/Poné como titular APRO/)).toBeTruthy();
    await user.clear(within(dlg).getByPlaceholderText('APRO'));
    await user.type(within(dlg).getByPlaceholderText('APRO'), 'APRO');
    await user.clear(within(dlg).getByPlaceholderText('11/30'));
    await user.type(within(dlg).getByPlaceholderText('11/30'), '01/20');
    await submit(user, dlg);
    expect(within(dlg).getByText('La tarjeta está vencida.')).toBeTruthy();
  });

  it('fondos insuficientes: muestra el motivo, deja reintentar, y con APRO confirma la compra', async () => {
    const { user } = renderShop();
    const dlg = await toCard(user);
    await user.selectOptions(within(dlg).getByLabelText('Completar con datos de prueba'), 'funds');
    await submit(user, dlg);
    expect(await within(dlg).findByText('La tarjeta no tiene fondos suficientes.')).toBeTruthy();
    await waitFor(() => expect(within(dlg).getByRole('button', { name: /^Pagar \$/ }).disabled).toBe(false));
    expect(document.querySelector('#cnt').textContent).toBe('1');
    await user.selectOptions(within(dlg).getByLabelText('Completar con datos de prueba'), 'approved');
    await submit(user, dlg);
    await waitFor(() => expect(text()).toContain('Compra confirmada'));
    expect(document.querySelector('#cnt').classList.contains('hidden')).toBe(true);
  });

  it('pendiente (CONT): muestra "Pedido recibido"', async () => {
    const { user } = renderShop();
    const dlg = await toCard(user);
    await user.selectOptions(within(dlg).getByLabelText('Completar con datos de prueba'), 'pending');
    await submit(user, dlg);
    await waitFor(() => expect(text()).toContain('Pedido recibido'));
  });

  it('Enter en un campo envía el formulario', async () => {
    const { user } = renderShop();
    const dlg = await toCard(user);
    await user.selectOptions(within(dlg).getByLabelText('Completar con datos de prueba'), 'approved');
    await user.click(within(dlg).getByPlaceholderText('12345678'));
    await user.keyboard('{Enter}');
    await waitFor(() => expect(text()).toContain('Compra confirmada'));
  });
});

describe('demo: transferencia, stock y red', () => {
  it('transferencia: alias y referencia', async () => {
    const { user } = renderShop();
    const dlg = await goToPay(user, /Zoro|Roronoa/);
    await choosePayment(user, 'Transferencia');
    await user.click(within(dlg).getByRole('button', { name: 'Confirmar pedido' }));
    await waitFor(() => expect(text()).toContain('gogogo.market'));
    expect(text()).toContain('Pedido recibido');
  });

  it('la última unidad de "Dio Brando" se puede comprar una sola vez', async () => {
    const { user } = renderShop();
    const mp = await payWithMP(user, /Dio Brando/);
    await user.click(within(mp).getByRole('button', { name: 'Pagar (aprobado)' }));
    await waitFor(() => expect(text()).toContain('Compra confirmada'));
    await user.click(within(cartDialog()).getByRole('button', { name: 'Seguir comprando' }));
    expect(within(screen.getByRole('heading', { name: 'Dio Brando y The World' }).closest('article')).getByText('Agotada')).toBeTruthy();
  });

  it('nunca usa la red', async () => {
    const { user } = renderShop();
    await addFigure(user, /Kira/);
    const mp = await payWithMP(user, /Sasaki/);
    await user.click(within(mp).getByRole('button', { name: 'Pagar (aprobado)' }));
    await waitFor(() => expect(text()).toContain('Compra confirmada'));
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
