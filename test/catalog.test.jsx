import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { addFigure, cardOf, cartDialog, openCart, productDialog, renderShop } from './helpers.jsx';

const titles = () => screen.getAllByRole('heading', { level: 3 }).filter((h) => h.closest('article')).map((h) => h.textContent);

describe('catálogo', () => {
  it('muestra las 15 figuras', () => {
    renderShop();
    expect(titles()).toHaveLength(15);
    expect(screen.getByText('15 figuras')).toBeTruthy();
  });

  it('filtra por obra con las pestañas', async () => {
    const { user } = renderShop();
    await user.click(screen.getByRole('tab', { name: 'JoJo' }));
    expect(titles()).toHaveLength(6);
    expect(screen.getByRole('tab', { name: 'JoJo' }).getAttribute('aria-selected')).toBe('true');
    await user.click(screen.getByRole('tab', { name: 'Valkyrie' }));
    expect(titles()).toHaveLength(6);
    await user.click(screen.getByRole('tab', { name: 'Otros' }));
    expect(titles()).toHaveLength(3);
  });

  it('busca sin importar tildes ni mayúsculas y muestra un aviso si no hay resultados', async () => {
    const { user } = renderShop();
    await user.type(screen.getByLabelText('Buscar figuras'), 'KOJIRO');
    expect(titles()).toEqual(['Sasaki Kojirō, el espadachín']);
    expect(screen.getByText('1 figura')).toBeTruthy();
    await user.clear(screen.getByLabelText('Buscar figuras'));
    await user.type(screen.getByLabelText('Buscar figuras'), 'zzzz');
    expect(screen.getByText('No hay figuras con ese filtro')).toBeTruthy();
    await user.click(screen.getByRole('button', { name: 'Ver todas' }));
    expect(titles()).toHaveLength(15);
    expect(screen.getByLabelText('Buscar figuras').value).toBe('');
  });

  it('filtra por rango de precio y ordena', async () => {
    const { user } = renderShop();
    await user.selectOptions(screen.getByLabelText('Rango de precio'), 'lt120');
    expect(titles()).toHaveLength(4);
    await user.selectOptions(screen.getByLabelText('Rango de precio'), 'gt200');
    expect(titles()).toHaveLength(3);
    await user.selectOptions(screen.getByLabelText('Rango de precio'), 'all');
    await user.selectOptions(screen.getByLabelText('Ordenar'), 'asc');
    expect(titles()[0]).toBe('Roronoa Zoro, One Piece');
    await user.selectOptions(screen.getByLabelText('Ordenar'), 'desc');
    expect(titles()[0]).toBe('Thor con el martillo Uller');
    await user.selectOptions(screen.getByLabelText('Ordenar'), 'rating');
    expect(titles()[0]).toMatch(/Jotaro|Lü Bu|Jolyne/);
  });

  it('marca la última unidad y el "solo con stock" oculta lo agotado', async () => {
    localStorage.setItem('gg_sold', JSON.stringify({ 8: 1, 3: 1 }));
    const { user } = renderShop();
    const dio = cardOf('Dio Brando y The World');
    expect(within(dio).getByText('Agotada')).toBeTruthy();
    expect(within(dio).getByRole('button', { name: 'Agregar' }).disabled).toBe(true);
    expect(within(cardOf('Thor con el martillo Uller')).getByText('Última')).toBeTruthy();
    await user.click(screen.getByLabelText('Solo con stock'));
    expect(titles()).toHaveLength(14);
    expect(screen.queryByText('Dio Brando y The World')).toBeNull();
  });
});

describe('detalle de una figura', () => {
  it('abre la ficha con descripción, tabla y parámetros', async () => {
    const { user } = renderShop();
    await user.click(screen.getByRole('button', { name: /Ver detalle de Jotaro/ }));
    const dlg = productDialog();
    expect(dlg.hasAttribute('open')).toBe(true);
    expect(within(dlg).getByRole('heading', { name: /Jotaro Kujo/ })).toBeTruthy();
    expect(within(dlg).getByText('PVC y ABS')).toBeTruthy();
    expect(within(dlg).getByRole('img', { name: /Parámetros de la figura: Detalle A/ })).toBeTruthy();
    expect(within(dlg).getByRole('img', { name: /Valoración 4.9 de 5/ })).toBeTruthy();
    await user.click(within(dlg).getByRole('button', { name: 'Cerrar' }));
    await waitFor(() => expect(dlg.hasAttribute('open')).toBe(false));
  });

  it('agregar desde el detalle muestra el aviso adentro de la ventana y bloquea al llegar al stock', async () => {
    const { user } = renderShop();
    await user.click(screen.getByRole('button', { name: /Ver detalle de Dio Brando/ }));   // stock 1
    const dlg = productDialog();
    await user.click(within(dlg).getByRole('button', { name: 'Agregar al carrito' }));
    // el aviso vive dentro del diálogo abierto, si no quedaría tapado
    await waitFor(() => expect(within(dlg).getByText('Agregada al carrito')).toBeTruthy());
    const btn = within(dlg).getByRole('button', { name: 'Stock en carrito' });
    expect(btn.disabled).toBe(true);
  });

  it('"Comprar ahora" agrega la figura y abre el carrito', async () => {
    const { user } = renderShop();
    await user.click(screen.getByRole('button', { name: /Ver detalle de Zoro|Ver detalle de Roronoa/ }));
    await user.click(within(productDialog()).getByRole('button', { name: 'Comprar ahora' }));
    await waitFor(() => expect(cartDialog().hasAttribute('open')).toBe(true));
    expect(within(cartDialog()).getByText('Roronoa Zoro, One Piece')).toBeTruthy();
    expect(productDialog().hasAttribute('open')).toBe(false);
  });
});

describe('carrito', () => {
  it('cuenta, suma, resta, quita y muestra el vacío', async () => {
    const { user } = renderShop();
    await addFigure(user, /Jotaro/);
    await addFigure(user, /Jotaro/);
    expect(screen.getByText('2', { selector: '#cnt' })).toBeTruthy();
    await openCart(user);
    const dlg = cartDialog();
    expect(within(dlg).getByText('Subtotal').nextSibling.textContent).toBe('$379.800');   // envío gratis
    expect(within(dlg).getByText('Envío').nextSibling.textContent).toBe('Gratis');
    expect(within(dlg).getByText('¡Tenés envío gratis!')).toBeTruthy();
    await user.click(within(dlg).getByRole('button', { name: 'Una menos' }));
    expect(within(dlg).getByText('Envío').nextSibling.textContent).toBe('$8.500');
    expect(within(dlg).getByText(/Te faltan \$60\.100 para el envío gratis/)).toBeTruthy();
    await user.click(within(dlg).getByRole('button', { name: 'Quitar' }));
    expect(within(dlg).getByText('Tu carrito está vacío')).toBeTruthy();
    expect(document.querySelector('#cnt').classList.contains('hidden')).toBe(true);
  });

  it('no deja pasar del stock disponible', async () => {
    const { user } = renderShop();
    await addFigure(user, /Dio Brando/);   // stock 1
    await openCart(user);
    expect(within(cartDialog()).getByRole('button', { name: 'Una más' }).disabled).toBe(true);
  });

  it('el carrito se recuerda al recargar', async () => {
    const first = renderShop();
    await addFigure(first.user, /Zoro|Roronoa/);
    first.unmount();
    renderShop();
    expect(screen.getByText('1', { selector: '#cnt' })).toBeTruthy();
  });
});

describe('tema y tinta', () => {
  it('cambia el modo claro/oscuro y el estilo de tinta, y lo recuerda', async () => {
    const { user } = renderShop();
    await user.click(screen.getByLabelText('Cambiar entre modo claro y oscuro'));
    expect(document.documentElement.getAttribute('data-theme')).toBe('mangadark');
    expect(JSON.parse(localStorage.getItem('gg_theme'))).toBe('mangadark');
    await user.selectOptions(screen.getByLabelText('Estilo de tinta'), 'ragnarok');
    expect(document.documentElement.getAttribute('data-saga')).toBe('ragnarok');
    expect(JSON.parse(localStorage.getItem('gg_saga'))).toBe('ragnarok');
  });
});
