var express = require("express");
var { graphqlHTTP } = require("express-graphql");
var { buildSchema } = require("graphql");
const { default: fetch } = require("node-fetch");
const { title } = require("process");

// Construct a schema, using GraphQL schema language
var schema = buildSchema(`
  type Product {
    id: ID!
    name: String
    code: String
    stock: String
    message: String
  }
  type Query {
    products: [Product]
    product_by_id(id: ID!): Product
    product_by_name(name: String!): Product
  }
  type Mutation {
    insert_product(id: ID!, stock: Int!): Product
    increment_product(id: ID!, quantity: Int!): Product
    decrement_product(id: ID!, quantity: Int!): Product
    delete_product(id: ID!): Product
  }
`);

var root = {
  // Récupération de tous les produits
  products: async () => {
    const products_api =
    // appel api openfoodfacts
      "https://world.openfoodfacts.org/api/v2/search?fields=id,code,product_name";
      // appel de mon api
    const stock_api = "http://localhost:8080/api/products";

    const products_response = await fetch(products_api);
    const stock_response = await fetch(stock_api);

    const products_data = await products_response.json();
    const stock_data = await stock_response.json();

    return products_data.products.map((p) => {
      return {
        id: Number(p.id),
        name: p.product_name,
        code: p.code,
        stock:
          stock_data.find((s) => Number(s.id) === Number(p.id))?.stock || 0,
      };
    });
  },

  // Récupération d'un produit par son id
  product_by_id: async ({ id }) => {
    const product_api = `https://world.openfoodfacts.org/api/v2/search?fields=id,code,product_name&code=${id}`;
    const stock_api = `http://localhost:8080/api/products/${id}`;

    const product_response = await fetch(product_api);
    const stock_response = await fetch(stock_api);

    const product_data = await product_response.json();
    const stock_data = await stock_response.json();
    return {
      id: Number(product_data.products[0].id),
      name: product_data.products[0].product_name,
      code: product_data.products[0].code,
      stock: stock_data.stock || 0,
    };
  },

  // Récupération d'un produit par son nom
  product_by_name: async ({ name }) => {
    const product_api = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${name}&action=process&fields=id,code,product_name&json=1`;

    const product_response = await fetch(product_api);
    const product_data = await product_response.json();
    const stock_api = `http://localhost:8080/api/products/${product_data.products[0].id}`;

    const stock_response = await fetch(stock_api);

    const stock_data = await stock_response.json();
    return {
      id: Number(product_data.products[0].id),
      name: product_data.products[0].product_name,
      code: product_data.products[0].code,
      stock: stock_data.stock || 0,
    };
  },

  // Insertion d'un produit et de son stock
  insert_product: async ({ id, stock }) => {
    const product_api = `https://world.openfoodfacts.org/api/v2/search?fields=id,code,product_name&code=${id}`;
    const stock_api = `http://localhost:8080/api/products`;

    const product_response = await fetch(product_api);
    const stock_response = await fetch(stock_api, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id: id,
        stock: stock,
      }),
    });

    const product_data = await product_response.json();
    const stock_data = await stock_response.json();
    return {
      id: Number(stock_data.id),
      name: product_data.products[0].product_name,
      code: product_data.products[0].code,
      stock: stock_data.stock,
    };
  },

  // Modification du stock d'un produit
  increment_product: async ({ id, quantity }) => {
    const product_api = `https://world.openfoodfacts.org/api/v2/search?fields=id,code,product_name&code=${id}`;
    const stock_api = `http://localhost:8080/api/products/stock/${id}`;

    const product_response = await fetch(product_api);
    const stock_response = await fetch(stock_api, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        stock: quantity,
      }),
    });

    const product_data = await product_response.json();
    const stock_data = await stock_response.json();
    return {
      id: Number(stock_data.id),
      name: product_data.products[0].product_name,
      code: product_data.products[0].code,
      stock: stock_data.stock,
    };
  },
  
  // Suppression d'un produit 
  delete_product: async ({ id }) => {
    const product_api = `https://world.openfoodfacts.org/api/v2/search?fields=id,code,product_name&code=${id}`;
    const stock_api = `http://localhost:8080/api/products/${id}`;

    const product_response = await fetch(product_api);
    const stock_response = await fetch(stock_api, {
      method: "DELETE",
    });

    const product_data = await product_response.json();
    const stock_data = await stock_response.json();

    return {
      message: stock_data.message,
    };
  },
};


var app = express();
app.use(
  "/graphql",
  graphqlHTTP({
    schema: schema,
    rootValue: root,
    graphiql: true,
  })
);
app.listen(4000, () => {
  console.log("Running a GraphQL API server at localhost:4000/graphql");
});