import { useState } from "react";
import {
  Alert,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { orderBody } from "../api/contracts";
import {
  DataTable,
  Empty,
  Failure,
  money,
  PageTitle,
} from "../components/Common";
export default function Cart() {
  const auth = useAuth();
  const cart = useCart();
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [order, setOrder] = useState(null);
  const total = cart.items.reduce(
    (sum, item) => sum + Number(item.price) * item.cartQuantity,
    0,
  );
  async function checkout() {
    setError(null);
    if (!auth.identity.userId) {
      setError(new Error("Your account is not ready. Check My account for loading or API errors."));
      return;
    }
    if (
      !cart.items.length ||
      cart.items.some(
        (item) =>
          !Number.isInteger(item.cartQuantity) ||
          item.cartQuantity < 1 ||
          item.cartQuantity > item.quantity,
      )
    ) {
      setError(
        new Error("Use whole quantities between 1 and the available stock."),
      );
      return;
    }
    setBusy(true);
    // Only productId and quantity are sent. The backend calculates prices and stock.
    try {
      const result = await auth.api(`/users/${auth.identity.userId}/orders`, {
        method: "POST",
        body: orderBody(cart.items),
      });
      setOrder(result);
      cart.clear();
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        title="Cart"
        text="Review quantities before placing an order."
      />
      <Failure error={error} />
      {order && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Order #{order.id} created. Backend total: {money(order.totalAmount)} ·{" "}
          {order.totalQuantity} items.{" "}
          <Button component={Link} to="/orders">
            View orders
          </Button>
        </Alert>
      )}
      {!auth.identity.userId && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Your account is not ready. Check My account for loading or API errors.
        </Alert>
      )}
      {!cart.items.length ? (
        <Empty text="Your cart is empty. Add products from the catalogue." />
      ) : (
        <>
          <DataTable
            rows={cart.items}
            columns={[
              { key: "name", label: "Product" },
              {
                key: "price",
                label: "Unit price",
                render: (row) => money(row.price),
              },
              { key: "quantity", label: "Available stock" },
              {
                key: "cartQuantity",
                label: "Order quantity",
                render: (row) => (
                  <TextField
                    aria-label={`Quantity for ${row.name}`}
                    type="number"
                    size="small"
                    value={row.cartQuantity}
                    disabled={busy}
                    onChange={(e) =>
                      cart.change(row.id, Number(e.target.value))
                    }
                    inputProps={{ min: 1, max: row.quantity, step: 1 }}
                    sx={{ width: 100 }}
                  />
                ),
              },
              {
                key: "subtotal",
                label: "Estimated subtotal",
                render: (row) => money(row.price * row.cartQuantity),
              },
            ]}
            actions={(row) => (
              <Button
                color="error"
                disabled={busy}
                onClick={() => cart.remove(row.id)}
              >
                Remove
              </Button>
            )}
          />
          <Paper variant="outlined" sx={{ p: 3, mt: 2 }}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              justifyContent="space-between"
              spacing={2}
            >
              <Typography variant="h6">
                Estimated total: {money(total)}
              </Typography>
              <Button
                variant="contained"
                disabled={busy || !auth.identity.userId}
                onClick={checkout}
              >
                {busy ? "Placing order…" : "Place order"}
              </Button>
            </Stack>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              The confirmed amount comes from the backend. Stock is checked when
              the order is submitted.
            </Typography>
          </Paper>
        </>
      )}
    </>
  );
}

