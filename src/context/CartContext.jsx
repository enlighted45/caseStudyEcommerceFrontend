import { createContext, useContext, useState } from "react";
const Context = createContext(null);
export function CartProvider({ children }) {
  // There is no cart controller: this selection is local React state only.
  const [items, setItems] = useState([]);
  function add(product) {
    if (!product.quantity) throw new Error("This product is out of stock.");
    setItems((old) => {
      const found = old.find((item) => item.id === product.id);
      return found
        ? old.map((item) =>
            item.id === product.id
              ? {
                  ...item,
                  ...product,
                  cartQuantity: Math.min(
                    item.cartQuantity + 1,
                    product.quantity,
                  ),
                }
              : item,
          )
        : [...old, { ...product, cartQuantity: 1 }];
    });
  }
  function change(id, quantity) {
    setItems((old) =>
      old.map((item) =>
        item.id === id ? { ...item, cartQuantity: quantity } : item,
      ),
    );
  }
  const remove = (id) =>
    setItems((old) => old.filter((item) => item.id !== id));
  const clear = () => setItems([]);
  return (
    <Context.Provider value={{ items, add, change, remove, clear }}>
      {children}
    </Context.Provider>
  );
}
export const useCart = () => useContext(Context);
