import {
  Alert,
  Button,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { Failure, PageTitle } from "../components/Common";
export default function Account() {
  const auth = useAuth();
  return (
    <>
      <PageTitle title="My account" />
      <Paper variant="outlined" sx={{ p: 3, maxWidth: 640 }}>
        {!auth.token ? (
          <>
            <Typography sx={{ mb: 2 }}>
              Log in to access your account.
            </Typography>
            <Button
              variant="contained"
              onClick={auth.login}
              disabled={!auth.ready}
            >
              Log in
            </Button>
          </>
        ) : (
          <Stack spacing={2}>
            <Typography>Username: {auth.claims.preferred_username}</Typography>
            <Typography>
              Roles:{" "}
              {auth.roles
                .filter((r) => ["USER", "TENANT", "ADMIN"].includes(r))
                .join(", ")}
            </Typography>
            {auth.identity.userId && (
              <Alert severity="success">
                Account ready. User #{auth.identity.userId}
                {auth.identity.tenantName && ` · ${auth.identity.tenantName}`}
              </Alert>
            )}
            {!auth.identity.userId && (auth.hasRole("USER") || auth.hasRole("TENANT")) && (
              <>
                {auth.identityBusy && <Typography>Loading your account...</Typography>}
                <Failure error={auth.identityError} />
              </>
            )}
            <Button
              variant="outlined"
              onClick={auth.logout}
              sx={{ alignSelf: "flex-start" }}
            >
              Log out
            </Button>
          </Stack>
        )}
      </Paper>
    </>
  );
}


