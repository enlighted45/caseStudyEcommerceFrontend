import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { validateForm } from "../api/contracts";
export const money = (value) =>
  new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
export const date = (value) => (value ? new Date(value).toLocaleString() : "—");
export function PageTitle({ title, text, action }) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      justifyContent="space-between"
      spacing={2}
      sx={{ mb: 3 }}
    >
      <Box>
        <Typography variant="h4" component="h1">
          {title}
        </Typography>
        {text && (
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            {text}
          </Typography>
        )}
      </Box>
      {action && <Box>{action}</Box>}
    </Stack>
  );
}
export function Failure({ error }) {
  return error ? (
    <Alert severity="error" sx={{ mb: 2 }}>
      {error.status ? `HTTP ${error.status}: ` : ""}
      {error.message || String(error)}
    </Alert>
  ) : null;
}
export function Busy() {
  return (
    <Box sx={{ p: 5, textAlign: "center" }}>
      <CircularProgress size={28} />
      <Typography sx={{ mt: 1 }}>Loading…</Typography>
    </Box>
  );
}
export function Empty({ text = "No records found." }) {
  return (
    <Paper variant="outlined" sx={{ p: 5, textAlign: "center" }}>
      <Typography color="text.secondary">{text}</Typography>
    </Paper>
  );
}
export function Pager({ data, page, size, setPage, setSize }) {
  return (
    <TablePagination
      component="div"
      count={data.totalElements || 0}
      page={page}
      rowsPerPage={size}
      rowsPerPageOptions={[5, 10, 20]}
      onPageChange={(_, value) => setPage(value)}
      onRowsPerPageChange={(event) => {
        setSize(Number(event.target.value));
        setPage(0); 
      }}
    />
  );
}
export function DataTable({ columns, rows, actions, rowKey = "id" }) {
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead>
          <TableRow>
            {columns.map((c) => (
              <TableCell key={c.key}>{c.label}</TableCell>
            ))}
            {actions && <TableCell align="right">Actions</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row[rowKey]} hover>
              {columns.map((c) => (
                <TableCell key={c.key}>
                  {c.render ? c.render(row) : (row[c.key] ?? "—")}
                </TableCell>
              ))}
              {actions && (
                <TableCell align="right">
                  <Stack
                    direction="row"
                    justifyContent="flex-end"
                    spacing={1}
                    sx={{ flexWrap: "wrap" }}
                  >
                    {actions(row)}
                  </Stack>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
// Shared form renders ordinary MUI text fields; each page owns its submit function.
export function FormFields({ fields, values, setValues, errors = {} }) {
  return (
    <Stack spacing={2} sx={{ pt: 1 }}>
      {fields.map((field) => (
        <TextField
          key={field.name}
          label={field.label}
          type={field.type || "text"}
          value={values[field.name] ?? ""}
          onChange={(event) =>
            setValues({ ...values, [field.name]: event.target.value })
          }
          required={field.required !== false}
          multiline={field.multiline}
          minRows={field.multiline ? 3 : undefined}
          error={!!errors[field.name]}
          helperText={errors[field.name]}
          fullWidth
          slotProps={{
            htmlInput: {
              maxLength: field.maxLength,
              min: field.min,
              step:
                field.type === "number"
                  ? field.integer
                    ? 1
                    : "0.01"
                  : undefined,
            },
          }}
        />
      ))}
    </Stack>
  );
}
export function Editor({ title, fields, initial, onSave, onClose }) {
  const [values, setValues] = useState(initial || {});
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const invalid = validateForm(values, fields);
    setErrors(invalid);
    if (Object.keys(invalid).length) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(values);
      onClose();
    } catch (err) {
      setError(err);
      setErrors(err.fieldErrors || {});
    } finally {
      setSaving(false);
    }
  }
  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="sm">
      <Box component="form" onSubmit={submit} noValidate>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <Failure error={error} />
          <FormFields
            fields={fields}
            values={values}
            setValues={setValues}
            errors={errors}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}
export function ConfirmDelete({ title, text, onConfirm, onClose }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  async function confirm() {
    setSaving(true);
    try {
      await onConfirm();
      onClose();
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  }
  return (
    <Dialog open onClose={saving ? undefined : onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Failure error={error} />
        <Typography>{text}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button
          color="error"
          variant="contained"
          onClick={confirm}
          disabled={saving}
        >
          {saving ? "Deleting…" : "Delete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
export function Detail({ title, children, onClose }) {
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
