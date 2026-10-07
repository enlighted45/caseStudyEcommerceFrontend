import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import { Inventory2Outlined } from "@mui/icons-material";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { emptyPage, productSearchPath } from "../api/contracts";
import {
  Busy,
  Detail,
  Empty,
  Failure,
  money,
  Pager,
  PageTitle,
} from "../components/Common";
export default function Products() {
  const auth = useAuth();
  const cart = useCart();
  const [filters, setFilters] = useState({ name: "", category: "" });
  const [applied, setApplied] = useState(filters);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [sort, setSort] = useState("name,asc");
  const [data, setData] = useState(emptyPage);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [notice, setNotice] = useState("");
  const [selected, setSelected] = useState(null);
  const [reload, setReload] = useState(0);
  const canBrowse = auth.hasRole("USER") || auth.hasRole("TENANT");
  useEffect(() => {
    if (!auth.token || !canBrowse) {
      setData(emptyPage);
      return;
    }
    const controller = new AbortController();
    setBusy(true);
    setError(null);
    auth
      .api(
        productSearchPath(applied.name, applied.category, page, size, sort),
        { signal: controller.signal },
      )
      .then(setData)
      .catch((err) => {
        if (err.name !== "AbortError") setError(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [auth.token, canBrowse, applied, page, size, sort, reload]);
  async function favourite(product) {
    setError(null);
    try {
      await auth.api(
        `/users/${auth.identity.userId}/favourites/${product.id}`,
        { method: "POST" },
      );
      setNotice(`${product.name} added to favourites.`);
    } catch (err) {
      setError(err);
    }
  }
  return (
    <>
      <PageTitle
        title="Products"
        text="Browse available stock, search products, and build your order."
        action={
          <Button
            variant="outlined"
            disabled={!canBrowse}
            onClick={() => setReload((v) => v + 1)}
          >
            Refresh
          </Button>
        }
      />
      {!auth.token && (
        <Alert
          severity="info"
          sx={{ mb: 3 }}
          action={
            <Button onClick={auth.login} disabled={!auth.ready}>
              Log in
            </Button>
          }
        >
          Log in to load available products.
        </Alert>
      )}
      {auth.token && !canBrowse && (
        <Alert severity="info" sx={{ mb: 3 }}>
          The backend requires USER or TENANT access for the product catalogue.
          Your ADMIN account can manage tenants and tenant users.
        </Alert>
      )}
      <Box
        component="form"
        onSubmit={(e) => {
          e.preventDefault();
          setApplied({ ...filters });
          setPage(0);
        }}
        sx={{
          p: 2,
          bgcolor: "background.paper",
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          mb: 3,
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <TextField
            label="Search product name"
            size="small"
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            sx={{ flex: 1 }}
          />
          <TextField
            label="Exact category"
            size="small"
            value={filters.category}
            onChange={(e) =>
              setFilters({ ...filters, category: e.target.value })
            }
            sx={{ flex: 1 }}
          />
          <TextField
            select
            label="Sort"
            size="small"
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(0);
            }}
            sx={{ minWidth: 160 }}
          >
            {[
              ["name,asc", "Name A–Z"],
              ["price,asc", "Price low to high"],
              ["price,desc", "Price high to low"],
              ["quantity,desc", "Stock high to low"],
            ].map(([value, label]) => (
              <MenuItem key={value} value={value}>
                {label}
              </MenuItem>
            ))}
          </TextField>
          <Button variant="contained" type="submit" disabled={!canBrowse}>
            Search
          </Button>
          <Button
            onClick={() => {
              setFilters({ name: "", category: "" });
              setApplied({ name: "", category: "" });
              setPage(0);
            }}
          >
            Clear
          </Button>
        </Stack>
      </Box>
      <Failure error={error} />
      {notice && (
        <Alert onClose={() => setNotice("")} severity="success" sx={{ mb: 2 }}>
          {notice}
        </Alert>
      )}
      {busy ? (
        <Busy />
      ) : !data.content?.length ? (
        <Empty
          text={
            auth.token && canBrowse
              ? "No matching products. Try another name or category."
              : "Products will appear here after you log in with a USER or TENANT account."
          }
        />
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            },
            gap: 2,
          }}
        >
          {data.content.map((product) => (
            <Card
              key={product.id}
              variant="outlined"
              sx={{ display: "flex", flexDirection: "column" }}
            >
              <CardContent sx={{ flex: 1 }}>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  sx={{ mb: 2 }}
                >
                  <Inventory2Outlined color="primary" />
                  <Chip label={product.category} size="small" />
                </Stack>
                <Typography variant="h6">{product.name}</Typography>
                <Typography color="text.secondary" sx={{ my: 1 }}>
                  Product #{product.id} · Tenant #{product.tenantId}
                </Typography>
                <Typography variant="h6">{money(product.price)}</Typography>
                <Typography
                  sx={{ mt: 1 }}
                  color={product.quantity ? "text.secondary" : "error"}
                >
                  {product.quantity
                    ? `${product.quantity} in stock`
                    : "Out of stock"}
                </Typography>
              </CardContent>
              <CardActions sx={{ px: 2, pb: 2, flexWrap: "wrap", gap: 1 }}>
                <Button
                  size="small"
                  variant="contained"
                  disabled={!product.quantity}
                  onClick={() => {
                    cart.add(product);
                    setNotice(`${product.name} added to your cart.`);
                  }}
                >
                  Add to cart
                </Button>
                <Button size="small" onClick={() => setSelected(product)}>
                  Details
                </Button>
                {auth.hasRole("USER") && (
                  <Button
                    size="small"
                    disabled={!auth.identity.userId}
                    onClick={() => favourite(product)}
                  >
                    Favourite
                  </Button>
                )}
              </CardActions>
            </Card>
          ))}
        </Box>
      )}
      {canBrowse && !busy && (
        <Pager
          data={data}
          page={page}
          size={size}
          setPage={setPage}
          setSize={setSize}
        />
      )}
      {selected && (
        <Detail title={selected.name} onClose={() => setSelected(null)}>
          <Stack spacing={2}>
            <Typography>{selected.description}</Typography>
            <Typography>Category: {selected.category}</Typography>
            <Typography>Price: {money(selected.price)}</Typography>
            <Typography>Stock: {selected.quantity}</Typography>
            <Typography color="text.secondary">
              Product ID: {selected.id} · Tenant ID: {selected.tenantId}
            </Typography>
          </Stack>
        </Detail>
      )}
    </>
  );
}


