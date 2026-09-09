import client from "./client";

export const listRequests = () => client.get("/requests").then((r) => r.data);
export const getRequest = (id) => client.get(`/requests/${id}`).then((r) => r.data);
export const raiseRequest = (payload) => client.post("/requests", payload).then((r) => r.data);
export const updateRequestStatus = (id, status) =>
  client.put(`/requests/${id}/status`, { status }).then((r) => r.data);
export const deleteRequest = (id) => client.delete(`/requests/${id}`);

export const downloadMyRequestsCsv = () =>
  client.get("/requests/my/download", { responseType: "blob" }).then((r) => r.data);
