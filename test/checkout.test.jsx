/* La compra completa con la tienda REAL (habla con /api/*). El servidor está simulado con mockApi. */
import { act, screen, waitFor, within } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { redirect } from '../src/lib/nav.js';
import { addFigure, cardOf, cartDialog, choosePayment, fillBuyer, goToPay, mockApi, openCart, renderShop } from './helpers.jsx';

vi.mock('../src/lib/nav.js', () => ({ redirect: vi.fn() }));
beforeEach(() => vi.mocked(redirect).mockClear());

const text = () => cartDialog().textContent.replace(/\s+/g, ' ');

describe('paso de datos', () => {
  it('sin completar nada marca los cuatro errores y no avanza', async () => {
    mockApi();
    const { user } = renderShop();
    await addFigure(user, /Jotaro/);
    await openCart(user);
    await user.click(within(cartDialog()).getByRole('button', { name: 'Continuar' }));
    await user.click(within(cartDialog()).getByRole('button', { name: 'Continuar al pago' }));
    const alerts = [...cartDialog().querySelectorAll('[data-err]')].map((p) => p.textContent).filter(Boolean);
    expect(alerts).toHaveLength(4);
    expect(within(cartDialog()).getByLabelText('Nombre y apellido').getAttribute('aria-invalid')).toBe('true');
    expect(document.activeElement).toBe(within(cartDialog()).getByLabelText('Nombre y apellido'));
    expect(text()).toContain('Tus datos');
  });

  it('un email mal escrito no pasa', async () => {
    mockApi();
    const { user } = renderShop();
    await addFigure(user, /Jotaro/);
    await openCart(user);
    await user.click(within(cartDialog()).getByRole('button', { name: 'Continuar' }));
    await fillBuyer(user, cartDialog());
    await user.clear(within(cartDialog()).getByLabelText('Email'));
    await user.type(within(cartDialog()).getByLabelText('Email'), 'esto-no-es-un-email');
    await user.click(within(cartDialog()).getByRole('button', { name: 'Continuar al pago' }));
    expect(within(cartDialog()).getByText(/email válido/)).toBeTruthy();
    expect(text()).toContain('Tus datos');
  });

  it('Enter pasa al campo siguiente y recién en el último valida', async () => {
    mockApi();
    const { user } = renderShop();
    await addFigure(user, /Jotaro/);
    await openCart(user);
    await user.click(within(cartDialog()).getByRole('button', { name: 'Continuar' }));
    const f = (l) => within(cartDialog()).getByLabelText(l);
    await user.click(f('Nombre y apellido'));
    await user.keyboard('{Enter}');
    expect(document.activeElement).toBe(f('Email'));
    expect(cartDialog().querySelectorAll('[data-err]:not(:empty)')).toHaveLength(0);
    expect(f('Ciudad').getAttribute('enterkeyhint')).toBe('go');
    expect(f('Nombre y apellido').getAttribute('enterkeyhint')).toBe('next');
    await user.click(f('Ciudad'));
    await user.keyboard('{Enter}');
    expect(cartDialog().querySelectorAll('[data-err]:not(:empty)').length).toBeGreaterThan(0);
  });

  it('con datos válidos pasa al pago con tres medios y Mercado Pago elegido', async () => {
    mockApi();
    const { user } = renderShop();
    const dlg = await goToPay(user);
    expect(text()).toContain('Medio de pago');
    expect(within(dlg).getAllByRole('radio')).toHaveLength(3);
    expect(within(dlg).getByRole('radio', { name: /Mercado Pago/ }).checked).toBe(true);
    expect(dlg.querySelectorAll('.step-primary')).toHaveLength(3);
  });

  it('volver desde el pago conserva lo que se escribió', async () => {
    mockApi();
    const { user } = renderShop();
    const dlg = await goToPay(user);
    await user.click(within(dlg).getByRole('button', { name: 'Volver' }));
    expect(within(cartDialog()).getByLabelText('Email').value).toBe('luka@example.com');
  });
});

describe('transferencia', () => {
  it('registra el pedido, muestra alias y referencia, vacía el carrito y descuenta stock', async () => {
    const calls = mockApi();
    const { user } = renderShop();
    const dlg = await goToPay(user, /Dio Brando/);          // la última unidad
    await choosePayment(user, 'Transferencia');
    await user.click(within(dlg).getByRole('button', { name: 'Confirmar pedido' }));
    await waitFor(() => expect(text()).toContain('Pedido recibido'));
    expect(text()).toContain('alias.test');
    expect(text()).toContain('GG-TR1');
    const sent = calls.find((c) => c.url === '/api/transfer').body;
    expect(sent.items).toEqual([{ id: '8', qty: 1 }]);
    expect(sent.buyer).toMatchObject({ name: 'Luka Prueba', email: 'luka@example.com' });
    expect(document.querySelector('#cnt').classList.contains('hidden')).toBe(true);
    await user.click(within(cartDialog()).getByRole('button', { name: 'Seguir comprando' }));
    expect(within(cardOf('Dio Brando y The World')).getByText('Agotada')).toBeTruthy();
  });
});

describe('Mercado Pago (Checkout Pro)', () => {
  it('pide la preferencia con los productos y va a la dirección que devuelve el servidor', async () => {
    const calls = mockApi();
    const { user } = renderShop();
    const dlg = await goToPay(user);
    await user.click(within(dlg).getByRole('button', { name: 'Pagar con Mercado Pago' }));
    await waitFor(() => expect(redirect).toHaveBeenCalledWith('https://mp.test/start?ref=GG-REF1'));
    const pref = calls.find((c) => c.url === '/api/preference');
    expect(pref.body.items).toEqual([{ id: '7', qty: 1 }]);
    expect(pref.body).not.toHaveProperty('total');           // el navegador no manda montos
    expect(JSON.parse(localStorage.getItem('gg_pending'))).toMatchObject({ ref: 'GG-REF1', items: [{ id: '7', qty: 1 }] });
    expect(document.querySelector('#cnt').textContent).toBe('1');   // el carrito sigue hasta confirmar el pago
  });

  it('si el servidor rechaza el pedido muestra el error y deja reintentar', async () => {
    mockApi({ '/api/preference': () => ({ __error: 'Falta configurar MP_ACCESS_TOKEN en el servidor (archivo .env).', status: 503 }) });
    const { user } = renderShop();
    const dlg = await goToPay(user);
    await user.click(within(dlg).getByRole('button', { name: 'Pagar con Mercado Pago' }));
    expect(await within(dlg).findByText(/MP_ACCESS_TOKEN/)).toBeTruthy();
    expect(redirect).not.toHaveBeenCalled();
    expect(within(dlg).getByRole('button', { name: 'Pagar con Mercado Pago' }).disabled).toBe(false);
  });

  it('con el servidor apagado explica cómo encenderlo', async () => {
    mockApi();
    const { user } = renderShop();
    const dlg = await goToPay(user);
    globalThis.fetch = vi.fn(() => Promise.reject(new TypeError('Failed to fetch')));
    await user.click(within(dlg).getByRole('button', { name: 'Pagar con Mercado Pago' }));
    expect(await within(dlg).findByText(/npm start/)).toBeTruthy();
    expect(within(dlg).getByRole('button', { name: 'Pagar con Mercado Pago' }).disabled).toBe(false);
  });
});

describe('vuelta desde Mercado Pago', () => {
  const comeBack = (qs) => window.history.replaceState({}, '', '/' + qs);
  const withCart = () => {
    localStorage.setItem('gg_cart', JSON.stringify({ 4: 1 }));
    localStorage.setItem('gg_pending', JSON.stringify({ ref: 'GG-REF1', items: [{ id: '4', qty: 1 }], total: 198400 }));
  };

  it('aprobado: verifica el pago, limpia la URL, vacía el carrito y descuenta stock', async () => {
    const calls = mockApi();
    withCart();
    comeBack('?collection_id=555&collection_status=approved&payment_id=555&status=approved&external_reference=GG-REF1');
    renderShop();
    await waitFor(() => expect(text()).toContain('Compra confirmada'));
    expect(text()).toContain('GG-REF1');
    expect(calls.map((c) => c.url)).toContain('/api/payment/555');   // se verificó con el servidor
    expect(window.location.search).toBe('');
    expect(document.querySelector('#cnt').classList.contains('hidden')).toBe(true);
    expect(JSON.parse(localStorage.getItem('gg_sold'))).toEqual({ 4: 1 });
    expect(localStorage.getItem('gg_pending')).toBe('null');
  });

  it('rechazado: explica el motivo y conserva el carrito', async () => {
    mockApi();
    withCart();
    comeBack('?payment_id=999&status=rejected');
    renderShop();
    await waitFor(() => expect(text()).toContain('No pudimos completar el pago'));
    expect(text()).toContain('La tarjeta no procesó el pago');
    expect(document.querySelector('#cnt').textContent).toBe('1');
    expect(within(cartDialog()).getByRole('button', { name: 'Elegir otro medio de pago' })).toBeTruthy();
  });

  it('volver sin pagar: mantiene el carrito', async () => {
    const calls = mockApi();
    withCart();
    comeBack('?status=null&payment_id=null&collection_status=null');
    renderShop();
    await waitFor(() => expect(text()).toContain('No se completó el pago'));
    expect(calls).toHaveLength(0);
    expect(document.querySelector('#cnt').textContent).toBe('1');
  });

  it('no confía en la URL: un "approved" inventado que el servidor no confirma no vacía el carrito', async () => {
    mockApi({ '/api/payment/777': () => ({ __error: 'No se pudo verificar el pago.', status: 502 }) });
    withCart();
    comeBack('?payment_id=777&status=approved');
    renderShop();
    await waitFor(() => expect(text()).toContain('No pudimos completar el pago'));
    expect(document.querySelector('#cnt').textContent).toBe('1');
  });
});

describe('tarjeta (formulario seguro de Mercado Pago)', () => {
  function fakeBrick() {
    const state = { created: null, unmounted: 0 };
    window.MercadoPago = function MercadoPago(key, opts) {
      state.key = key;
      state.locale = opts.locale;
      this.bricks = () => ({
        create: async (type, container, settings) => {
          state.created = { type, container, settings };
          settings.callbacks.onReady();
          return { unmount: () => { state.unmounted += 1; } };
        },
      });
    };
    return state;
  }

  it('crea el formulario con el total y el email, y con un pago aprobado confirma la compra', async () => {
    const calls = mockApi();
    const brick = fakeBrick();
    const { user } = renderShop();
    const dlg = await goToPay(user, /Brunhilde/);
    await choosePayment(user, 'Tarjeta');
    await waitFor(() => expect(brick.created).not.toBeNull());
    expect(brick.key).toBe('TEST-pk');
    expect(brick.locale).toBe('es-AR');
    expect(brick.created.type).toBe('cardPayment');
    expect(brick.created.container).toBe('cardBrick');
    expect(brick.created.settings.initialization).toEqual({ amount: 159900 + 8500, payer: { email: 'luka@example.com' } });
    expect(dlg.querySelector('#cardBrick')).toBeTruthy();

    const formData = { token: 'tok', payment_method_id: 'master', issuer_id: '24', installments: 1, payer: { email: 'luka@example.com', identification: { type: 'DNI', number: '12345678' } } };
    await act(async () => { await brick.created.settings.callbacks.onSubmit({ formData }); });
    await waitFor(() => expect(text()).toContain('Compra confirmada'));
    const paid = calls.find((c) => c.url === '/api/pay').body;
    expect(paid.items).toEqual([{ id: '2', qty: 1 }]);
    expect(paid.formData.token).toBe('tok');
    expect(paid.formData).not.toHaveProperty('transaction_amount');
    expect(brick.unmounted).toBeGreaterThan(0);          // el formulario se desmonta al cambiar de pantalla
  });

  it('pago rechazado: muestra el motivo, conserva el carrito y deja reintentar', async () => {
    mockApi({ '/api/pay': () => ({ ref: 'GG-C2', id: '778', status: 'rejected', status_detail: 'cc_rejected_insufficient_amount', total: 168400 }) });
    const brick = fakeBrick();
    const { user } = renderShop();
    const dlg = await goToPay(user, /Brunhilde/);
    await choosePayment(user, 'Tarjeta');
    await waitFor(() => expect(brick.created).not.toBeNull());
    let rejected = false;
    await act(async () => { await brick.created.settings.callbacks.onSubmit({ formData: { token: 't' } }).catch(() => { rejected = true; }); });
    expect(rejected).toBe(true);                             // el formulario se entera y habilita reintentar
    expect(await within(dlg).findByText('La tarjeta no tiene fondos suficientes.')).toBeTruthy();
    expect(text()).toContain('Medio de pago');
    expect(document.querySelector('#cnt').textContent).toBe('1');
  });

  it('sin MP_PUBLIC_KEY en el servidor lo avisa en lugar de quedarse cargando', async () => {
    mockApi({ '/api/config': () => ({ configured: false, publicKey: '', transferAlias: 'x' }) });
    fakeBrick();
    const { user } = renderShop();
    const dlg = await goToPay(user);
    await choosePayment(user, 'Tarjeta');
    expect(await within(dlg).findByText(/MP_PUBLIC_KEY/)).toBeTruthy();
    expect(within(dlg).queryByText('Cargando formulario de tarjeta…')).toBeNull();
  });

  it('cambiar de medio de pago desmonta el formulario', async () => {
    mockApi();
    const brick = fakeBrick();
    const { user } = renderShop();
    const dlg = await goToPay(user);
    await choosePayment(user, 'Tarjeta');
    await waitFor(() => expect(brick.created).not.toBeNull());
    await choosePayment(user, 'Transferencia');
    expect(dlg.querySelector('#cardBrick')).toBeNull();
    expect(brick.unmounted).toBeGreaterThan(0);
  });
});
