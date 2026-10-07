import { useEffect, useState } from "react";
import { Alert, Button, Paper, Stack, Typography } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { profileBody, profileFields } from "../api/contracts";
import {
  Busy,
  ConfirmDelete,
  Editor,
  Failure,
  PageTitle,
} from "../components/Common";
export default function Profile() {
  const auth = useAuth();
  const userId = auth.identity.userId;
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!userId) return;
    const controller = new AbortController();
    setBusy(true);
    auth
      .api(`/users/${userId}`, { signal: controller.signal })
      .then(setUser)
      .catch((err) => {
        if (err.name !== "AbortError") setError(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [userId, auth.token]);
  return (
    <>
      <PageTitle
        title="My profile"
        text="Your username and role are read-only. Update your email and name."
      />
      <Failure error={error} />
      {notice && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {notice}
        </Alert>
      )}
      {!userId && (
        <Alert severity="info">
          Your account is not ready. Check My account for loading or API errors.
        </Alert>
      )}
      {busy ? (
        <Busy />
      ) : (
        user && (
          <Paper variant="outlined" sx={{ p: 3, maxWidth: 640 }}>
            <Stack spacing={2}>
              {[
                ["Database ID", user.id],
                ["Username", user.username],
                ["Email", user.email],
                ["First name", user.firstName],
                ["Last name", user.lastName],
                ["Role", user.role],
              ].map(([label, value]) => (
                <Typography key={label}>
                  <strong>{label}:</strong> {value}
                </Typography>
              ))}
              <Stack direction="row" spacing={2}>
                <Button variant="contained" onClick={() => setEditing(true)}>
                  Edit profile
                </Button>
                <Button color="error" onClick={() => setDeleting(true)}>
                  Delete account
                </Button>
              </Stack>
            </Stack>
          </Paper>
        )
      )}
      {editing && (
        <Editor
          title="Edit profile"
          fields={profileFields}
          initial={user}
          onClose={() => setEditing(false)}
          onSave={async (values) => {
            setUser(
              await auth.api(`/users/${userId}`, {
                method: "PUT",
                body: profileBody(values),
              }),
            );
            setNotice("Profile updated.");
          }}
        />
      )}{" "}
      {deleting && (
        <ConfirmDelete
          title="Delete your account?"
          text="This removes your account and related orders and favourites. This action cannot be undone."
          onClose={() => setDeleting(false)}
          onConfirm={async () => {
            await auth.api(`/users/${userId}`, { method: "DELETE" });
            setUser(null);
            await auth.logout();
          }}
        />
      )}{" "}
    </>
  );
}

