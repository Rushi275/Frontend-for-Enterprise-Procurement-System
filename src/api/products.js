import client from "./client";

export const listProducts = () => client.get("/products").then((r) => r.data);
export const createProduct = (payload) => client.post("/products", payload).then((r) => r.data);
export const updateProduct = (id, payload) => client.put(`/products/${id}`, payload).then((r) => r.data);
export const deleteProduct = (id) => client.delete(`/products/${id}`);
