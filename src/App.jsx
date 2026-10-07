import { useEffect, useState } from "react";
import {
  Alert,
  AppBar,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import {
  FavoriteBorder,
  Inventory2Outlined,
  Menu,
  PeopleOutline,
  ReceiptLongOutlined,
  ShoppingBagOutlined,
  ShoppingCartOutlined,
  StorefrontOutlined,
  PersonOutline,
} from "@mui/icons-material";
import { Link, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import { useCart } from "./context/CartContext";
import Account from "./pages/Account";
import { Busy, Failure } from "./components/Common";
import Signup from "./pages/Signup";
import Products from "./pages/Products";
import Cart from "./pages/Cart";
import Orders from "./pages/Orders";
import Favourites from "./pages/Favourites";
import Profile from "./pages/Profile";
import TenantProducts from "./pages/TenantProducts";
import Tenants from "./pages/Tenants";
import TenantUsers from "./pages/TenantUsers";
function Guard({ roles, children }) {
  const auth = useAuth();
  if (!auth.token)
    return (
      <Alert
        severity="info"
        action={
          <Button onClick={auth.login} disabled={!auth.ready}>
            Log in
          </Button>
        }
      >
        Log in to open this page.
      </Alert>
    );
  if (!roles.some(auth.hasRole))
    return (
      <Alert severity="warning">
        Your account role cannot access this page under the backend’s current
        permissions.
      </Alert>
    );
  return children;
}
export default function App() {
  const auth = useAuth();
  const cart = useCart();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  // Clear the local cart when accounts change so one user's selection isn't reused by another.
  useEffect(() => {
    cart.clear();
  }, [auth.claims?.preferred_username]);
  const links = [
    { path: "/products", label: "Products", icon: <ShoppingBagOutlined /> },
  ];
  if (auth.hasRole("USER") || auth.hasRole("TENANT"))
    links.push(
      { path: "/cart", label: "Cart", icon: <ShoppingCartOutlined /> },
      { path: "/orders", label: "My orders", icon: <ReceiptLongOutlined /> },
    );
  if (auth.hasRole("USER"))
    links.push(
      { path: "/favourites", label: "Favourites", icon: <FavoriteBorder /> },
      { path: "/profile", label: "My profile", icon: <PersonOutline /> },
    );
  if (auth.hasRole("TENANT"))
    links.push({
      path: "/manage-products",
      label: "Manage products",
      icon: <Inventory2Outlined />,
    });
  if (auth.hasRole("ADMIN"))
    links.push(
      { path: "/tenants", label: "Tenants", icon: <StorefrontOutlined /> },
      { path: "/tenant-users", label: "Tenant users", icon: <PeopleOutline /> },
    );
  links.push({
    path: "/account",
    label: "My account",
    icon: <PersonOutline />,
  });
  if (!auth.token)
    links.push({
      path: "/signup",
      label: "Create account",
      icon: <PersonOutline />,
    });
  const navigation = (
    <Box sx={{ width: 232, p: 2 }}>
      <Typography variant="overline" color="text.secondary" sx={{ px: 2 }}>
        Workspace
      </Typography>
      <List>
        {links.map((link) => (
          <ListItemButton
            key={link.path}
            component={Link}
            to={link.path}
            selected={location.pathname === link.path}
            onClick={() => setMobileOpen(false)}
            sx={{ borderRadius: 1, my: 0.5 }}
          >
            <ListItemIcon sx={{ minWidth: 36 }}>{link.icon}</ListItemIcon>
            <ListItemText primary={link.label} />
            {link.path === "/cart" && cart.items.length > 0 && (
              <Chip size="small" label={cart.items.length} />
            )}
          </ListItemButton>
        ))}
      </List>
      <Divider sx={{ my: 2 }} />
      <Typography variant="body2" color="text.secondary" sx={{ px: 2 }}>
        {auth.claims ? auth.claims.preferred_username : "Not logged in"}
      </Typography>
      {auth.identity.userId && (
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ px: 2, mt: 1 }}
        >
          User #{auth.identity.userId}
        </Typography>
      )}
    </Box>
  );
  return (
    <>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{ bgcolor: "#174e72", zIndex: (theme) => theme.zIndex.drawer + 1 }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            sx={{ mr: 1, display: { md: "none" } }}
            aria-label="Open navigation"
            onClick={() => setMobileOpen(true)}
          >
            <Menu />
          </IconButton>
          <StorefrontOutlined sx={{ mr: 1.5 }} />
          <Typography
            variant="h6"
            component={Link}
            to="/products"
            sx={{
              textDecoration: "none",
              flexGrow: 1,
              fontSize: { xs: "1rem", sm: "1.2rem" },
            }}
          >
            Case Study Ecommerce
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            {auth.roles
              .filter((r) => ["ADMIN", "USER", "TENANT"].includes(r))
              .map((role) => (
                <Chip
                  key={role}
                  label={role}
                  size="small"
                  sx={{
                    color: "white",
                    bgcolor: "#ffffff25",
                    display: { xs: "none", sm: "inline-flex" },
                  }}
                />
              ))}
            {auth.token ? (
              <>
                <Button color="inherit" component={Link} to="/account">
                  Account
                </Button>
                <Button color="inherit" onClick={auth.logout}>
                  Log out
                </Button>
              </>
            ) : (
              <Button
                color="inherit"
                onClick={auth.login}
                disabled={!auth.ready}
              >
                Log in
              </Button>
            )}
          </Stack>
        </Toolbar>
      </AppBar>
      <Box component="nav">
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              width: 232,
              top: 64,
              height: "calc(100% - 64px)",
              borderColor: "divider",
            },
          }}
        >
          {navigation}
        </Drawer>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          sx={{ display: { md: "none" }, "& .MuiDrawer-paper": { pt: 8 } }}
        >
          {navigation}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ ml: { md: "232px" }, pt: { xs: 10, sm: 12 }, pb: 4 }}
      >
        <Container maxWidth="xl" sx={{ px: { xs: 2, md: 4 } }}>
          <Failure error={auth.authError} />
          {auth.hasRole("USER") && !auth.hasRole("TENANT") && <Failure error={auth.identityError} />}
          {!auth.ready && <Busy />}
          {auth.token &&
            !auth.identity.userId &&
            auth.hasRole("TENANT") &&
            location.pathname !== "/account" && (
              <Alert
                severity="info"
                sx={{ mb: 2 }}
                action={
                  <Button component={Link} to="/account">
                    My account
                  </Button>
                }
              >
                {auth.identityBusy
                  ? "Loading your account…"
                  : "Your account could not be loaded from the backend. Open My account to see the error."}
              </Alert>
            )}
          <Routes>
            <Route path="/" element={<Navigate to="/products" replace />} />
            <Route path="/products" element={<Products />} />
            <Route path="/account" element={<Account />} />
            <Route path="/signup" element={<Signup />} />
            <Route
              path="/cart"
              element={
                <Guard roles={["USER", "TENANT"]}>
                  <Cart />
                </Guard>
              }
            />
            <Route
              path="/orders"
              element={
                <Guard roles={["USER", "TENANT"]}>
                  <Orders />
                </Guard>
              }
            />
            <Route
              path="/favourites"
              element={
                <Guard roles={["USER"]}>
                  <Favourites />
                </Guard>
              }
            />
            <Route
              path="/profile"
              element={
                <Guard roles={["USER"]}>
                  <Profile />
                </Guard>
              }
            />
            <Route
              path="/manage-products"
              element={
                <Guard roles={["TENANT"]}>
                  <TenantProducts />
                </Guard>
              }
            />
            <Route
              path="/tenants"
              element={
                <Guard roles={["ADMIN"]}>
                  <Tenants />
                </Guard>
              }
            />
            <Route
              path="/tenant-users"
              element={
                <Guard roles={["ADMIN"]}>
                  <TenantUsers />
                </Guard>
              }
            />
            <Route
              path="*"
              element={
                <Alert severity="info">
                  Page not found.{" "}
                  <Button component={Link} to="/products">
                    Go to products
                  </Button>
                </Alert>
              }
            />
          </Routes>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 5 }}>
            Case Study Ecommerce · React + Material UI
          </Typography>
        </Container>
      </Box>
    </>
  );
}

