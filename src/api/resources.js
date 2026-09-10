import client from "./client";

const data = (request) => request.then((response) => response.data);

export const listUsers = () => data(client.get("/users"));
export const createUser = (payload) => data(client.post("/users", payload));
export const updateUser = (id, payload) => data(client.put(`/users/${id}`, payload));
export const deleteUser = (id) => client.delete(`/users/${id}`);

export const listSuppliers = () => data(client.get("/suppliers"));
export const createSupplier = (payload) => data(client.post("/suppliers", payload));
export const updateSupplier = (id, payload) => data(client.put(`/suppliers/${id}`, payload));
export const deleteSupplier = (id) => client.delete(`/suppliers/${id}`);
export const createSupplierAccount = (id, password) => data(client.post(`/suppliers/${id}/account`, { password }));
export const setSupplierMpin = (id, mpin) => data(client.put(`/suppliers/${id}/mpin`, { mpin }));

export const createCategory = (payload) => data(client.post("/categories", payload));
export const updateCategory = (id, payload) => data(client.put(`/categories/${id}`, payload));
export const deleteCategory = (id) => client.delete(`/categories/${id}`);

export const createDepartment = (payload) => data(client.post("/departments", payload));
export const updateDepartment = (id, payload) => data(client.put(`/departments/${id}`, payload));
export const deleteDepartment = (id) => client.delete(`/departments/${id}`);

export const listApprovalHierarchies = () => data(client.get("/approval-hierarchies"));
export const createApprovalHierarchy = (payload) => data(client.post("/approval-hierarchies", payload));
export const updateApprovalHierarchy = (id, payload) => data(client.put(`/approval-hierarchies/${id}`, payload));
export const deleteApprovalHierarchy = (id) => client.delete(`/approval-hierarchies/${id}`);

export const processPayment = (payload) => data(client.post("/payments", payload));
export const listPayments = () => data(client.get("/payments"));
export const listSupplierOrders = () => data(client.get("/supplier/orders"));
export const updateSupplierOrderStatus = (id, status) => data(client.put(`/supplier/orders/${id}/status`, { status }));
export const getOrderTracking = (id) => data(client.get(`/orders/${id}/tracking`));

export const downloadBlob = (url) => client.get(url, { responseType: "blob" }).then((response) => response.data);
