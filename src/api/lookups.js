import client from "./client";

export const listCategories = () => client.get("/categories").then((r) => r.data);
export const listDepartments = () => client.get("/departments").then((r) => r.data);
export const listNotifications = (userId) =>
  client.get(`/notifications/user/${userId}`).then((r) => r.data);
export const listUnreadNotifications = (userId) =>
  client.get(`/notifications/user/${userId}/unread`).then((r) => r.data);
export const markNotificationRead = (id) =>
  client.put(`/notifications/${id}/read`).then((r) => r.data);
