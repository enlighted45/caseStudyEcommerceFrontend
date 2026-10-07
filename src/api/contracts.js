// These payload builders match the backend DTOs exactly; never send generated fields.
export const encode = (value) => encodeURIComponent(String(value));
export const profileBody = (form) => ({
  email: form.email.trim(),
  firstName: form.firstName.trim(),
  lastName: form.lastName.trim(),
});
export const signupBody = (form) => ({
  username: form.username.trim(),
  ...profileBody(form),
  password: form.password,
});
export const tenantUserBody = (form) => ({
  ...signupBody(form),
  tenantName: form.tenantName.trim(),
});
export const productBody = (form) => ({
  name: form.name.trim(),
  price: Number(form.price),
  quantity: Number(form.quantity),
  category: form.category.trim(),
  description: form.description.trim(),
});
export const orderBody = (cart) => ({
  items: cart.map((item) => ({
    productId: item.id,
    quantity: item.cartQuantity,
  })),
});
export function pageQuery(page = 0, size = 10, sort = "") {
  const query = new URLSearchParams({ page: String(page), size: String(size) });
  if (sort) query.set("sort", sort);
  return query.toString();
}
// Search uses four different controller methods. Do not send an empty combined search.
export function productSearchPath(name, category, page, size, sort) {
  const query = pageQuery(page, size, sort);
  if (name.trim() && category.trim())
    return `/products/search?${query}&${new URLSearchParams({ name: name.trim(), category: category.trim() })}`;
  if (name.trim()) return `/products/name/${encode(name.trim())}?${query}`;
  if (category.trim())
    return `/products/category/${encode(category.trim())}?${query}`;
  return `/products?${query}`;
}
export function decodeClaims(token) {
  try {
    const part = token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(atob(part), (c) => c.charCodeAt(0)),
      ),
    );
  } catch {
    throw new Error("Enter a valid JWT access token.");
  }
}
export function validateForm(values, fields) {
  const errors = {};
  for (const field of fields) {
    const value = values[field.name];
    if (
      field.required !== false &&
      (value === undefined || value === null || String(value).trim() === "")
    )
      errors[field.name] = "This field is required.";
    else if (
      field.type === "email" &&
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    )
      errors[field.name] = "Enter a valid email address.";
    else if (
      field.type === "number" &&
      (!Number.isFinite(Number(value)) ||
        Number(value) < (field.min ?? 1) ||
        (field.integer && !Number.isInteger(Number(value))))
    )
      errors[field.name] = field.integer
        ? "Enter a whole number of at least 1."
        : "Enter a number of at least 1.";
    else if (field.max !== undefined && Number(value) > field.max)
      errors[field.name] = `Use a value no greater than ${field.max}.`;
    else if (field.maxLength && String(value).length > field.maxLength)
      errors[field.name] = `Use ${field.maxLength} characters or fewer.`;
    else if (
      field.decimals !== undefined &&
      !/^\d+(\.\d{1,2})?$/.test(String(value))
    )
      errors[field.name] = "Use a price with at most two decimal places.";
  }
  return errors;
}
export const profileFields = [
  { name: "email", label: "Email", type: "email", maxLength: 150 },
  { name: "firstName", label: "First name", maxLength: 150 },
  { name: "lastName", label: "Last name", maxLength: 150 },
];
export const signupFields = [
  { name: "username", label: "Username", maxLength: 50 },
  ...profileFields,
  { name: "password", label: "Password", type: "password" },
];
export const productFields = [
  { name: "name", label: "Product name", maxLength: 150 },
  {
    name: "price",
    label: "Price",
    type: "number",
    min: 1,
    max: 9999999999999.99,
    decimals: 2,
  },
  {
    name: "quantity",
    label: "Stock quantity",
    type: "number",
    min: 1,
    max: 2147483647,
    integer: true,
  },
  { name: "category", label: "Category" },
  { name: "description", label: "Description", multiline: true },
];
export const emptyPage = {
  content: [],
  totalElements: 0,
  totalPages: 0,
  number: 0,
};
