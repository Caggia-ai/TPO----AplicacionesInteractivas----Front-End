/* Catálogo y reglas de precio.
   Un único archivo para los dos lados: React lo importa para mostrar el catálogo y el servidor
   lo importa para calcular el total con SUS precios, nunca con los que manda el navegador. */

export const SHIP = 8500;          // costo de envío en pesos
export const FREE_FROM = 250000;   // envío gratis desde este subtotal

function P(id,title,saga,scale,height,price,rating,sales,stock,pose,bg,sfx,stats,desc,tag){
  return {id:String(id),title:title,saga:saga,scale:scale,height:height,price:price,rating:rating,sales:sales,stock:stock,pose:pose,bg:bg,sfx:sfx,stats:stats,desc:desc,tag:tag||''};
}
export const PRODUCTS = [
  P(1,'Lü Bu Fengxian, Fang Tian Hua Ji','val','1/7',26,219900,4.9,212,3,'b','ink','ズシン',[5,5,4,4,5,3],'El guerrero más fuerte de la humanidad con su alabarda. Viene con los efectos de energía y base numerada.','Edición limitada'),
  P(2,'Brunhilde, la Valquiria mayor','val','1/8',23,159900,4.8,98,4,'a','focus','ドン',[4,5,4,3,5,4],'Escultura de Brunhilde con armadura y capa desmontable. Incluye base de Valhalla.'),
  P(3,'Thor con el martillo Uller','val','1/6',30,249000,4.7,64,2,'b','speed','ゴゴゴ',[5,4,3,5,4,3],'Thor en pose de combate con el martillo sobre el hombro. Espuma interior para guardarlo.'),
  P(4,'Sasaki Kojirō, el espadachín','val','1/8',24,98500,4.5,31,5,'c','tone','ババッ',[3,4,3,2,3,5],'El espadachín con su katana larga en pleno corte. Accesorios completos.'),
  P(5,'Adán, el primer hombre','val','1/7',27,175000,4.8,77,3,'c','ink','ズシン',[4,5,5,3,5,4],'Pose de combate con efecto de puñetazo. Pintura prolija y base numerada.'),
  P(6,'Poseidón con el tridente','val','1/6',31,189500,4.6,45,2,'a','tone','ドン',[4,4,3,4,4,3],'Tridente y capa de agua traslúcida. Se arma sin pegamento.'),
  P(7,'Jotaro Kujo y Star Platinum','jojo','1/7',28,189900,4.9,340,4,'c','focus','ゴゴゴゴ',[5,5,4,4,5,4],'Jotaro con su Stand en plena ráfaga. Incluye manos intercambiables y base con efecto de golpes.','Más pedida'),
  P(8,'Dio Brando y The World','jojo','1/6',32,235000,4.8,156,1,'a','ink','ドドド',[5,5,3,5,4,3],'Dio en su pose más famosa con The World detrás. Última unidad en stock.'),
  P(9,'Giorno Giovanna y Gold Experience','jojo','1/8',24,164900,4.7,121,4,'a','speed','ズギュン',[4,5,4,3,5,4],'Giorno con las mariposas doradas. Caja original con póster.'),
  P(10,'Josuke Higashikata y Crazy Diamond','jojo','1/8',23,92000,4.4,27,6,'c','tone','オラ',[3,4,3,2,3,5],'Josuke junto a Crazy Diamond en pleno ataque. Accesorios completos.'),
  P(11,'Jolyne Cujoh y Stone Free','jojo','1/7',26,172500,4.9,88,3,'a','focus','ゴゴゴゴ',[5,4,4,4,5,4],'Jolyne con los hilos del Stand extendidos. Edición de tienda con póster de regalo.'),
  P(12,'Kira Yoshikage y Killer Queen','jojo','1/8',24,118000,4.6,52,2,'a','ink','ドドド',[4,4,3,3,4,4],'Kira con el traje morado y la mano que activa la bomba.'),
  P(13,'Satoru Gojo, Jujutsu Kaisen','otro','1/7',25,149900,4.8,190,3,'a','speed','キラ',[5,5,4,4,5,3],'Gojo con la venda subida y el efecto del Infinito. Caja sellada.'),
  P(14,'Levi Ackerman, Shingeki no Kyojin','otro','1/7',24,138000,4.7,73,2,'c','focus','シュッ',[4,4,5,3,4,4],'Levi en pleno giro con las dos espadas. Cables articulados.'),
  P(15,'Roronoa Zoro, One Piece','otro','1/8',22,84900,4.5,39,5,'b','tone','ババーン',[3,4,3,3,3,5],'Zoro con las tres espadas en la pose de Santoryu. Espadas firmes y completas.')
];

export function byId(id) {
  return PRODUCTS.find((p) => p.id === id) || null;
}

function fail(msg, status) {
  const e = new Error(msg);
  e.status = status || 400;
  return e;
}

/* items: [{ id, qty }]   sold: { id: cantidad ya vendida } (opcional)
   Devuelve { lines, subtotal, shipping, total } o lanza un error con .status */
export function quote(items, sold = {}) {
  if (!Array.isArray(items) || items.length === 0 || items.length > 50) throw fail('El carrito está vacío.');
  const seen = {};
  const lines = [];
  let subtotal = 0;
  items.forEach((i) => {
    const id = String((i && i.id) ?? '');
    const qty = Number(i && i.qty);
    const p = byId(id);
    if (!p) throw fail('Una figura del carrito ya no existe.');
    if (seen[id]) throw fail('Hay una figura repetida en el carrito.');
    seen[id] = 1;
    if (!Number.isInteger(qty) || qty < 1) throw fail('Cantidad inválida para "' + p.title + '".');
    const left = Math.max(0, p.stock - (sold[id] || 0));
    if (qty > left) throw fail('No hay stock suficiente de "' + p.title + '" (quedan ' + left + ').', 409);
    lines.push({ product: p, qty });
    subtotal += p.price * qty;
  });
  const shipping = subtotal >= FREE_FROM ? 0 : SHIP;
  return { lines, subtotal, shipping, total: subtotal + shipping };
}
