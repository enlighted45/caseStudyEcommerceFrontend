import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import { AuthProvider } from "./context/AuthContext";
import { CartProvider } from "./context/CartContext";
import App from "./App";
import "./styles.css";
const theme = createTheme({
  palette: {
    primary: { main: "#174e72" },
    secondary: { main: "#b54c20" },
    background: { default: "#f4f6f8" },
  },
  typography: {
    fontFamily: "Arial, Helvetica, sans-serif",
    h4: { fontSize: "1.9rem", fontWeight: 700 },
    h6: { fontWeight: 600 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiTableCell: {
      styleOverrides: {
        root: { padding: "14px 16px", fontSize: "0.875rem" },
        head: { background: "#edf2f6", fontWeight: 700 },
      },
    },
  },
});
// HashRouter makes every page refresh work on a static host without server rewrites.
ReactDOM.createRoot(document.getElementById("root")).render(
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <HashRouter>
      <AuthProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </AuthProvider>
    </HashRouter>
  </ThemeProvider>,
);
