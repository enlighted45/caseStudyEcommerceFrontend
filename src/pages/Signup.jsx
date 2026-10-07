import { useState } from "react";
import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { signupBody, signupFields, validateForm } from "../api/contracts";
import { Failure, FormFields, PageTitle } from "../components/Common";
export default function Signup() {
  const { api, login, ready } = useAuth();
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(null);
  const [created, setCreated] = useState(null);
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    const invalid = validateForm(values, signupFields);
    setErrors(invalid);
    if (Object.keys(invalid).length) return;
    setError(null);
    setBusy(true);
    try {
      const user = await api("/auth/signup", {
        method: "POST",
        body: signupBody(values),
        publicRequest: true,
      });
      setCreated(user);
      setValues({});
    } catch (err) {
      setError(err);
      setErrors(err.fieldErrors || {});
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageTitle
        title="Create a customer account"
        text="Signup creates a USER account in the database and Keycloak."
      />
      <Paper variant="outlined" sx={{ p: 3, maxWidth: 620 }}>
        <Failure error={error} />
        {created && (
          <Alert severity="success" sx={{ mb: 3 }}>
            Account created for {created.username}. Log in to start shopping.
          </Alert>
        )}
        <Box component="form" onSubmit={submit} noValidate>
          <FormFields
            fields={signupFields}
            values={values}
            setValues={setValues}
            errors={errors}
          />
          <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
            <Button type="submit" variant="contained" disabled={busy}>
              {busy ? "Creating…" : "Create account"}
            </Button>
            <Button onClick={login} disabled={!ready}>
              Log in
            </Button>
          </Stack>
        </Box>
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          Tenant accounts are created by an ADMIN from the Tenant users page.
        </Typography>
      </Paper>
    </>
  );
}

