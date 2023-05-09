fetch('http://localhost:3000/api/products')
  .then((res) => res.json())
  .then((kanapsFromAPI) => {
    displayProducts(kanapsFromAPI);
  });

const cart = [];

function retrieveProductsFromLocalStorage() {
  const kanapsJSON = localStorage.getItem('products');
  return JSON.parse(kanapsJSON);
}

function retrieveKanap(kanapFromLocalStorage, kanapsFromAPI) {
  let kanap = null;
  kanapsFromAPI.forEach(function (kanapFromAPI) {
    if (kanapFromAPI._id === kanapFromLocalStorage.id) {
      kanap = {
        id: kanapFromAPI._id,
        color: kanapFromLocalStorage.color,
        quantity: kanapFromLocalStorage.quantity,
        imageUrl: kanapFromAPI.imageUrl,
        altTxt: kanapFromAPI.altTxt,
        description: kanapFromAPI.description,
        name: kanapFromAPI.name,
        price: kanapFromAPI.price,
      };
    }
  });
  if (kanap === null) {
    throw 'Data is corrupted';
  }
  return kanap;
}

function displayProducts(kanapsFromAPI) {
  const kanapsFromLocalStorage = retrieveProductsFromLocalStorage();
  if (!kanapsFromLocalStorage) {
    return;
  }
  kanapsFromLocalStorage.forEach(function (kanapFromLocalStorage) {
    const kanap = retrieveKanap(kanapFromLocalStorage, kanapsFromAPI);
    const article = makeArticle(kanap);
    const div = makeImage(kanap);
    article.appendChild(div);
    const cardProductContent = makeCardContent(kanap, kanapsFromAPI);
    article.appendChild(cardProductContent);
    displayArticle(article);
    updateTotalPriceAndQuantity(kanapsFromAPI);
  });
}

function displayArticle(article) {
  let sameArticle = null;
  document.querySelectorAll('.cart__item').forEach(function (item) {
    if (item.dataset.id === article.dataset.id) {
      sameArticle = item;
    }
  });
  // If the article already exists with another color, add it after
  if (sameArticle) {
    sameArticle.after(article);
  } else {
    document.querySelector('#cart__items').appendChild(article);
  }
}

function makeArticle(kanap) {
  const article = document.createElement('article');
  article.classList.add('cart__item');
  article.dataset.id = kanap.id;
  article.dataset.color = kanap.color;
  return article;
}

function makeImage(kanap) {
  const div = document.createElement('div');
  div.classList.add('cart__item__img');

  const image = document.createElement('img');
  image.src = kanap.imageUrl;
  image.alt = kanap.altTxt;
  div.appendChild(image);
  return div;
}

function makeCardContent(kanap, kanapsFromAPI) {
  const cardItemContent = document.createElement('div');
  cardItemContent.classList.add('cart__item__content');

  const description = makeDescription(kanap);
  const settings = makeSettings(kanap, kanapsFromAPI);

  cardItemContent.appendChild(description);
  cardItemContent.appendChild(settings);
  return cardItemContent;
}

function makeDescription(kanap) {
  const description = document.createElement('div');
  description.classList.add('cart__item__content__description');

  const h2 = document.createElement('h2');
  h2.textContent = kanap.name;
  const p = document.createElement('p');
  p.textContent = kanap.color;
  const p2 = document.createElement('p');
  p2.textContent = kanap.price + ' €';

  description.appendChild(h2);
  description.appendChild(p);
  description.appendChild(p2);
  return description;
}

function makeSettings(kanap, kanapsFromAPI) {
  const settings = document.createElement('div');
  settings.classList.add('cart__item__content__settings');

  addQuantityToSettings(settings, kanap, kanapsFromAPI);
  deleteEvent(settings, kanapsFromAPI);
  return settings;
}

function addQuantityToSettings(settings, kanap, kanapsFromAPI) {
  const quantityEl = document.createElement('div');
  quantityEl.classList.add('cart__item__content__settings__quantity');
  const p = document.createElement('p');
  p.textContent = 'Qté : ';
  quantityEl.appendChild(p);
  const input = document.createElement('input');
  input.type = 'number';
  input.classList.add('itemQuantity');
  input.name = 'itemQuantity';
  input.min = '1';
  input.max = '100';
  input.value = kanap.quantity;
  // Event : modify quantity
  input.addEventListener('input', (e) => {
    updateTotalPriceAndQuantity(kanapsFromAPI);
    var quantity = e.target.value;
    updateProductInLocalStorage(kanap, quantity);
  });

  quantityEl.appendChild(input);
  settings.appendChild(quantityEl);
}

function deleteEvent(settings, kanapsFromAPI) {
  const div = document.createElement('div');
  div.classList.add('cart__item__content__settings__delete');
  div.addEventListener('click', function (e) {
    const btn = e.target;
    const article = btn.closest('.cart__item');
    let productsFromLocalStorage = retrieveProductsFromLocalStorage();
    const keyToDelete = findKanapKeyInLocalStorage(
      productsFromLocalStorage,
      article.dataset.color,
      article.dataset.id
    );
    deleteKanapInLocalStorage(productsFromLocalStorage, keyToDelete);
    article.remove();
    updateTotalPriceAndQuantity(kanapsFromAPI);
  });

  const p = document.createElement('p');
  p.textContent = 'Supprimer';
  div.appendChild(p);
  settings.appendChild(div);
}

function findKanapKeyInLocalStorage(productsFromLocalStorage, color, id) {
  let key = null;
  productsFromLocalStorage.forEach(function (productFromLocalStorage, i) {
    if (
      productFromLocalStorage.id === id &&
      productFromLocalStorage.color === color
    ) {
      key = i;
    }
  });
  return key;
}

function deleteKanapInLocalStorage(productsFromLocalStorage, keyToDelete) {
  productsFromLocalStorage.splice(keyToDelete, 1);
  localStorage.setItem('products', JSON.stringify(productsFromLocalStorage));
}

function updateProductInLocalStorage(kanap, quantity) {
  let productFromLocalStorage = retrieveProductsFromLocalStorage();
  let productKeyToLocalStorage = findProductKeyToLocalStorage(
    kanap,
    productFromLocalStorage
  );

  productFromLocalStorage[productKeyToLocalStorage].quantity = quantity;

  localStorage.setItem('products', JSON.stringify(productFromLocalStorage));
}

function findProductKeyToLocalStorage(productToAdd, products) {
  let productKeyFound = null;

  products.forEach(function (kanap, key) {
    if (kanap.id === productToAdd.id && kanap.color === productToAdd.color) {
      productKeyFound = key;
    }
  });
  return productKeyFound;
}

function updateTotalPriceAndQuantity(kanapsFromAPI) {
  let kanapsAsObject = convertKanapsToObject(kanapsFromAPI);
  let totalPrice = 0;
  let totalQuantity = 0;
  // Loop on each element in the cart
  const cartItems = document.querySelectorAll('.cart__item');
  cartItems.forEach(function (cartItem) {
    let cartItemId = cartItem.dataset.id;
    let price = kanapsAsObject[cartItemId].price;
    let quantity = parseInt(cartItem.querySelector('.itemQuantity').value);
    totalQuantity += quantity;
    totalPrice += price * quantity;
  });

  let updatePriceAndQuantity = document.getElementById('totalPrice');
  let productUpdatePriceAndQuantity = document.getElementById('totalQuantity');
  updatePriceAndQuantity.innerHTML = totalPrice;
  productUpdatePriceAndQuantity.textContent = totalQuantity;
}

const convertKanapsToObject = (kanapsFromAPI) => {
  var kanaps = {};
  kanapsFromAPI.forEach(function (kanapFromAPI) {
    kanaps[kanapFromAPI._id] = kanapFromAPI;
  });
  return kanaps;
};

const schemas = {
  letters: {
    regex: /^[A-Za-zÀ-ÿ-' ]{3,}$/g,
    message: 'Select minimum 3 characters, letters only',
  },
  lettersDigits: {
    regex: /^[0-9A-Za-zÀ-ÿ-', ]{3,}$/g,
    message: 'Select minimum 3 characters, numbers and letters only',
  },
  email: {
    regex:
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
    message: 'Email address Invalid',
  },
};

// Validate an input and display message if error
const validateInput = (e, schema) => {
  const inputElem = e.target;
  const inputErrorElem = inputElem.nextElementSibling;
  const inputValue = inputElem.value.trim();

  let isValid = false;
  let errorMessage = schema.message;

  if (inputValue && inputValue.match(schema.regex)) {
    isValid = true;
    errorMessage = '';
  }

  inputElem.valid = isValid;
  inputErrorElem.textContent = errorMessage;
};

const getOrderData = () => {
  let kanapsFromLocalStorage = retrieveProductsFromLocalStorage();
  // Build an array with the kanap ids only
  const products = kanapsFromLocalStorage.map((i) => i.id);
  const contact = {
    firstName: firstNameInputElem.value.trim(),
    lastName: lastNameInputElem.value.trim(),
    address: addressInputElem.value.trim(),
    city: cityInputElem.value.trim(),
    email: emailInputElem.value.trim(),
  };
  return { products, contact };
};

const sendOrder = async () => {
  try {
    const order = getOrderData();

    if (order.products.length < 1)
      throw Error('Please note that your basket must contain at least 1 item');

    fetch('http://localhost:3000/api/products/order', {
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      method: 'POST',
      body: JSON.stringify(order),
    })
      .then(function (stream) {
        return stream.json();
      })
      .then(function (response) {
        localStorage.removeItem('products');
        window.location.replace(`confirmation.html?order=${response.orderId}`);
      });
  } catch (e) {
    alert(e.message);
  }
};

const orderFormElem = document.querySelector('.cart__order__form');
const firstNameInputElem = document.querySelector('#firstName');
const lastNameInputElem = document.querySelector('#lastName');
const addressInputElem = document.querySelector('#address');
const cityInputElem = document.querySelector('#city');
const emailInputElem = document.querySelector('#email');

orderFormElem.addEventListener('submit', function (e) {
  e.preventDefault();

  const inputElems = Array.from(
    e.target.querySelectorAll('input:not([type=submit])')
  );
  const hasErrors = inputElems.map((i) => i.valid).includes(false);

  if (hasErrors) return;

  sendOrder();
});

firstNameInputElem.addEventListener('input', (e) =>
  validateInput(e, schemas.letters)
);

lastNameInputElem.addEventListener('input', (e) =>
  validateInput(e, schemas.letters)
);
addressInputElem.addEventListener('input', (e) =>
  validateInput(e, schemas.lettersDigits)
);
cityInputElem.addEventListener('input', (e) =>
  validateInput(e, schemas.letters)
);
emailInputElem.addEventListener('input', (e) =>
  validateInput(e, schemas.email)
)