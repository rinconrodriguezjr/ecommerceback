function checkout() {
  let site = document.location;
  let link = new URL(site);
  let orderId = link.searchParams.get('order');

  const orderEl = document.getElementById('orderId');
  orderEl.innerHTML = orderId;
}
checkout();