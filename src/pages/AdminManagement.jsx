import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, KeyRound, ShieldCheck } from "lucide-react";
import { apiErrorMessage } from "../api/client";
import { listProducts, createProduct, updateProduct, deleteProduct } from "../api/products";
import { listCategories, listDepartments } from "../api/lookups";
import {
  listUsers, createUser, updateUser, deleteUser, listSuppliers, createSupplier, updateSupplier,
  deleteSupplier, createSupplierAccount, setSupplierMpin, createCategory, updateCategory,
  deleteCategory, createDepartment, updateDepartment, deleteDepartment, listApprovalHierarchies,
  createApprovalHierarchy, updateApprovalHierarchy, deleteApprovalHierarchy,
} from "../api/resources";
import Topbar from "../components/Topbar";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { EmptyState, SkeletonRows } from "./Home";

const configs = {
  users: { label: "Users", key: "userId", list: listUsers, create: createUser, update: updateUser, remove: deleteUser, fields: [
    ["name", "Full name"], ["email", "Email", "email"], ["phoneNumber", "Phone"], ["designation", "Designation"], ["role", "Role", "select", ["EMPLOYEE", "MANAGER", "SUPPLIER"]], ["password", "Temporary password", "password"],
  ] },
  suppliers: { label: "Suppliers", key: "supplierId", list: listSuppliers, create: createSupplier, update: updateSupplier, remove: deleteSupplier, fields: [
    ["name", "Company name"], ["email", "Email", "email"], ["phone", "Phone"], ["address", "Address"], ["gstNumber", "GST number"], ["status", "Status", "select", ["ACTIVE", "INACTIVE"]], ["productId", "Supplied product", "product"],
  ] },
  products: { label: "Products", key: "productId", list: listProducts, create: createProduct, update: updateProduct, remove: deleteProduct, fields: [
    ["name", "Product name"], ["pricePerProduct", "Unit price", "number"], ["numberOfQuantities", "Available quantity", "number"], ["description", "Description", "textarea"], ["categoryId", "Category", "category"], ["departmentId", "Department", "department"],
  ] },
  categories: { label: "Categories", key: "categoryId", list: listCategories, create: createCategory, update: updateCategory, remove: deleteCategory, fields: [["categoryName", "Category name"]] },
  departments: { label: "Departments", key: "departmentId", list: listDepartments, create: createDepartment, update: updateDepartment, remove: deleteDepartment, fields: [["departmentName", "Department name"], ["managerName", "Manager name"], ["managerId", "Manager account", "user"]] },
  hierarchy: { label: "Approval hierarchy", key: "approvalHierarchyId", list: listApprovalHierarchies, create: createApprovalHierarchy, update: updateApprovalHierarchy, remove: deleteApprovalHierarchy, fields: [["departmentId", "Department", "department"], ["level", "Approval level", "number"]] },
};

function initialFor(config, item) {
  return config.fields.reduce((form, [name]) => {
    const relation = name === "productId" ? item?.product?.productId : name === "categoryId" ? item?.category?.categoryId : name === "departmentId" ? item?.department?.departmentId : name === "managerId" ? item?.manager?.userId : undefined;
    return { ...form, [name]: item?.[name] ?? relation ?? "" };
  }, {});
}

function toPayload(tab, form) {
  const number = (key) => (form[key] === "" ? null : Number(form[key]));
  if (tab === "products") return { name: form.name, pricePerProduct: number("pricePerProduct"), numberOfQuantities: number("numberOfQuantities"), description: form.description, category: form.categoryId ? { categoryId: number("categoryId") } : null, department: form.departmentId ? { departmentId: number("departmentId") } : null };
  if (tab === "suppliers") return { ...form, product: form.productId ? { productId: number("productId") } : null };
  if (tab === "departments") return { departmentName: form.departmentName, managerName: form.managerName, manager: form.managerId ? { userId: number("managerId") } : null };
  if (tab === "hierarchy") return { level: number("level"), department: form.departmentId ? { departmentId: number("departmentId") } : null };
  return form;
}

function cell(item, name) {
  const value = item[name] ?? (name === "productId" ? item.product?.name : name === "categoryId" ? item.category?.categoryName : name === "departmentId" ? item.department?.departmentName : undefined);
  return value === undefined || value === null || value === "" ? "—" : String(value);
}

export default function AdminManagement({ supplierMode = false }) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const availableConfigs = supplierMode ? { products: configs.products } : configs;
  const [tab, setTab] = useState(supplierMode ? "products" : "users");
  const [items, setItems] = useState([]); const [lookups, setLookups] = useState({ products: [], categories: [], departments: [], users: [] });
  const [loading, setLoading] = useState(true); const [editing, setEditing] = useState(null); const [form, setForm] = useState({}); const [saving, setSaving] = useState(false); const [query, setQuery] = useState(""); const [secret, setSecret] = useState(null);
  const config = availableConfigs[tab];
  async function load() { setLoading(true); try { const [rows, products, categories, departments, users] = await Promise.all([config.list(), listProducts(), listCategories(), listDepartments(), supplierMode ? Promise.resolve([]) : listUsers()]); setItems(supplierMode ? rows.filter((row) => row.user?.userId === user?.userId) : rows); setLookups({ products, categories, departments, users }); } catch (err) { showToast(apiErrorMessage(err), "error"); } finally { setLoading(false); } }
  useEffect(() => { setEditing(null); setSecret(null); setQuery(""); load(); }, [tab]);
  const filtered = useMemo(() => items.filter((item) => JSON.stringify(item).toLowerCase().includes(query.toLowerCase())), [items, query]);
  function open(item) { setEditing(item || {}); setForm(initialFor(config, item)); }
  async function save(e) { e.preventDefault(); setSaving(true); try { const payload = { ...toPayload(tab, form), ...(supplierMode && tab === "products" ? { user: { userId: user?.userId } } : {}) }; if (editing?.[config.key]) await config.update(editing[config.key], payload); else await config.create(payload); showToast(`${config.label.slice(0, -1)} saved.`, "success"); setEditing(null); load(); } catch (err) { showToast(apiErrorMessage(err), "error"); } finally { setSaving(false); } }
  async function remove(item) { if (!window.confirm(`Delete this ${config.label.slice(0, -1).toLowerCase()}? This cannot be undone.`)) return; try { await config.remove(item[config.key]); showToast("Record deleted.", "success"); load(); } catch (err) { showToast(apiErrorMessage(err), "error"); } }
  async function supplierSecret(kind) { const value = secret?.value?.trim(); if (!value) return; try { if (kind === "account") await createSupplierAccount(secret.item.supplierId, value); else await setSupplierMpin(secret.item.supplierId, value); showToast(kind === "account" ? "Supplier account created." : "Supplier MPIN updated.", "success"); setSecret(null); load(); } catch (err) { showToast(apiErrorMessage(err), "error"); } }
  return <div><Topbar title={supplierMode ? "My products" : "Administration"} subtitle={supplierMode ? "Manage products listed under your supplier account." : "Manage live procurement data, accounts, catalog records, and approval setup."} />
    {!supplierMode && <div className="flex gap-2 overflow-x-auto pb-2 mb-5">{Object.entries(availableConfigs).map(([key, value]) => <button key={key} onClick={() => setTab(key)} className={`shrink-0 px-3 py-2 rounded-lg text-xs font-medium ${tab === key ? "bg-ink text-white" : "bg-white border border-ink/10 text-slate"}`}>{value.label}</button>)}</div>}
    <div className="bg-card rounded-card shadow-card border border-ink/5 overflow-hidden"><div className="p-4 flex gap-3 justify-between flex-wrap border-b border-ink/5"><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${config.label.toLowerCase()}…`} className="rounded-lg border border-ink/10 px-3 py-2 text-sm flex-1 min-w-48 outline-none focus:border-signal" /><button onClick={() => open(null)} className="bg-signal text-white rounded-lg px-3 py-2 text-sm font-medium flex items-center gap-1"><Plus size={15}/> Add {config.label.slice(0, -1)}</button></div>
      {loading ? <div className="p-5"><SkeletonRows /></div> : filtered.length === 0 ? <EmptyState icon={ShieldCheck} title={`No ${config.label.toLowerCase()} found`} body="Create a record to get started." /> : <div className="overflow-x-auto"><table className="min-w-full text-sm"><thead className="bg-paper text-left text-xs text-slate"><tr>{config.fields.slice(0, 4).map(([, label]) => <th key={label} className="px-4 py-3 font-medium">{label}</th>)}<th className="px-4 py-3">Actions</th></tr></thead><tbody className="divide-y divide-ink/5">{filtered.map((item) => <tr key={item[config.key]}>{config.fields.slice(0, 4).map(([name]) => <td key={name} className="px-4 py-3 text-ink max-w-48 truncate">{cell(item, name)}</td>)}<td className="px-4 py-3"><div className="flex gap-1"><button onClick={() => open(item)} title="Edit" className="p-1.5 text-signal hover:bg-signal-light rounded"><Pencil size={14}/></button>{tab === "suppliers" && <button onClick={() => setSecret({ item, kind: "account", value: "" })} title="Create account" className="p-1.5 text-good hover:bg-good-light rounded"><KeyRound size={14}/></button>}{tab === "suppliers" && <button onClick={() => setSecret({ item, kind: "mpin", value: "" })} title="Set MPIN" className="p-1.5 text-amber hover:bg-amber-light rounded"><ShieldCheck size={14}/></button>}<button onClick={() => remove(item)} title="Delete" className="p-1.5 text-coral hover:bg-coral-light rounded"><Trash2 size={14}/></button></div></td></tr>)}</tbody></table></div>}</div>
    {editing && <Modal title={`${editing?.[config.key] ? "Edit" : "Add"} ${config.label.slice(0, -1)}`} onClose={() => setEditing(null)}><form onSubmit={save} className="space-y-3">{config.fields.map(([name, label, type, options]) => <Field key={name} name={name} label={label} type={type} options={options} required={!editing?.[config.key] || name !== "password"} value={form[name] ?? ""} lookups={lookups} onChange={(value) => setForm({ ...form, [name]: value })} />)}<button disabled={saving} className="w-full bg-signal text-white rounded-lg py-2.5 text-sm font-medium disabled:opacity-50">{saving ? "Saving…" : "Save changes"}</button></form></Modal>}
    {secret && <Modal title={secret.kind === "account" ? "Create supplier account" : "Set supplier MPIN"} onClose={() => setSecret(null)}><form onSubmit={(e) => { e.preventDefault(); supplierSecret(secret.kind); }} className="space-y-4"><p className="text-sm text-slate">{secret.kind === "account" ? `Set a password for ${secret.item.name}'s supplier login.` : "Enter exactly four digits. This is required before admin can process payment."}</p><input autoFocus required type={secret.kind === "account" ? "password" : "password"} pattern={secret.kind === "mpin" ? "[0-9]{4}" : undefined} maxLength={secret.kind === "mpin" ? 4 : undefined} value={secret.value} onChange={(e) => setSecret({ ...secret, value: e.target.value })} className="w-full rounded-lg border border-ink/10 px-3 py-2.5 text-sm outline-none focus:border-signal" /><button className="w-full bg-signal text-white rounded-lg py-2.5 text-sm font-medium">Confirm</button></form></Modal>}
  </div>;
}
function Field({ name, label, type, options, value, lookups, onChange, required }) { const list = type === "product" ? lookups.products : type === "category" ? lookups.categories : type === "department" ? lookups.departments : type === "user" ? lookups.users : options; if (type === "textarea") return <label className="block text-xs font-medium text-slate">{label}<textarea value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full rounded-lg border border-ink/10 px-3 py-2 text-sm min-h-20 outline-none focus:border-signal"/></label>; if (list) return <label className="block text-xs font-medium text-slate">{label}<select required={required && name !== "productId" && name !== "managerName" && name !== "managerId"} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full rounded-lg border border-ink/10 px-3 py-2 text-sm outline-none focus:border-signal"><option value="">Select {label.toLowerCase()}</option>{list.map((item) => <option key={typeof item === "string" ? item : item.productId ?? item.categoryId ?? item.departmentId ?? item.userId} value={typeof item === "string" ? item : item.productId ?? item.categoryId ?? item.departmentId ?? item.userId}>{typeof item === "string" ? item : item.name ?? item.categoryName ?? item.departmentName}</option>)}</select></label>; return <label className="block text-xs font-medium text-slate">{label}<input required={required && name !== "phoneNumber" && name !== "designation" && name !== "gstNumber"} type={type || "text"} min={type === "number" ? "0" : undefined} value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5 w-full rounded-lg border border-ink/10 px-3 py-2 text-sm outline-none focus:border-signal"/></label>; }
function Modal({ title, children, onClose }) { return <div className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4"><div className="bg-white rounded-card shadow-card max-h-[90vh] overflow-y-auto w-full max-w-md p-6"><div className="flex justify-between gap-3 mb-5"><h2 className="font-display font-semibold text-ink">{title}</h2><button onClick={onClose} className="text-slate">×</button></div>{children}</div></div>; }
