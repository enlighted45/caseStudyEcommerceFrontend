import { useEffect, useState } from "react";
import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import {
  emptyPage,
  encode,
  pageQuery,
  profileBody,
  profileFields,
  signupFields,
  tenantUserBody,
} from "../api/contracts";
import {
  Busy,
  ConfirmDelete,
  DataTable,
  Detail,
  Editor,
  Empty,
  Failure,
  Pager,
  PageTitle,
} from "../components/Common";
const createFields = [
  ...signupFields,
  { name: "tenantName", label: "Existing tenant name", maxLength: 150 },
];
export default function TenantUsers() {
  const auth = useAuth();
  const [tenantName, setTenantName] = useState("");
  const [appliedTenant, setAppliedTenant] = useState("");
  const [data, setData] = useState(emptyPage);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [detail, setDetail] = useState(null);
  const [notice, setNotice] = useState("");
  const base = `/tenantUser/${encode(appliedTenant)}`;
  useEffect(() => {
    if (!appliedTenant) return;
    const controller = new AbortController();
    setBusy(true);
    setError(null);
    auth
      .api(`${base}?${pageQuery(page, size)}`, { signal: controller.signal })
      .then(setData)
      .catch((err) => {
        if (err.name !== "AbortError") setError(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [auth.token, appliedTenant, page, size, reload]);
  async function getUser(row, edit) {
    setError(null);
    try {
      const user = await auth.api(`${base}/${row.id}`);
      if (edit) setEditor(user);
      else setDetail(user);
    } catch (err) {
      setError(err);
    }
  }
  return (
    <>
      <PageTitle
        title="Tenant users"
        text="An ADMIN creates tenant accounts and manages users under a tenant."
        action={
          <Button
            variant="contained"
            onClick={() => setEditor({ tenantName: appliedTenant })}
          >
            Add tenant user
          </Button>
        }
      />
      <Stack
        component="form"
        direction={{ xs: "column", sm: "row" }}
        spacing={2}
        sx={{ mb: 3 }}
        onSubmit={(e) => {
          e.preventDefault();
          if (!tenantName.trim()) return;
          setAppliedTenant(tenantName.trim());
          setPage(0);
          setReload((v) => v + 1);
        }}
      >
        <TextField
          label="Exact tenant name"
          value={tenantName}
          onChange={(e) => setTenantName(e.target.value)}
          required
          size="small"
        />
        <Button variant="outlined" type="submit">
          Load users
        </Button>
      </Stack>
      <Failure error={error} />
      {notice && (
        <Alert severity="success" onClose={() => setNotice("")} sx={{ mb: 2 }}>
          {notice}
        </Alert>
      )}
      {busy ? (
        <Busy />
      ) : !data.content?.length ? (
        <Empty
          text={
            appliedTenant
              ? "No tenant users found."
              : "Enter an existing tenant name to list its users."
          }
        />
      ) : (
        <DataTable
          rows={data.content}
          columns={[
            { key: "id", label: "Database ID" },
            { key: "username", label: "Username" },
            { key: "email", label: "Email" },
            { key: "role", label: "Role" },
            { key: "tenantId", label: "Tenant ID" },
          ]}
          actions={(row) => (
            <>
              <Button onClick={() => getUser(row, false)}>View</Button>
              <Button onClick={() => getUser(row, true)}>Edit</Button>
              <Button color="error" onClick={() => setDeleting(row)}>
                Delete
              </Button>
            </>
          )}
        />
      )}
      {appliedTenant && !busy && (
        <Pager
          data={data}
          page={page}
          size={size}
          setPage={setPage}
          setSize={setSize}
        />
      )}
      {editor && (
        <Editor
          title={editor.id ? "Edit tenant user" : "Add tenant user"}
          fields={editor.id ? profileFields : createFields}
          initial={editor}
          onClose={() => setEditor(null)}
          onSave={async (values) => {
            // Only the three profile fields can be updated; role/username/tenant cannot be reassigned.
            const result = await auth.api(
              editor.id ? `${base}/${editor.id}` : "/tenantUser",
              {
                method: editor.id ? "PUT" : "POST",
                body: editor.id ? profileBody(values) : tenantUserBody(values),
              },
            );
            setNotice(
              `Tenant user ${result.username} ${editor.id ? "updated" : "created"}. Database user ID: ${result.id}.`,
            );
            if (!editor.id) {
              setTenantName(values.tenantName.trim());
              setAppliedTenant(values.tenantName.trim());
              setPage(0);
            }
            setReload((v) => v + 1);
          }}
        />
      )}{" "}
      {deleting && (
        <ConfirmDelete
          title="Delete tenant user?"
          text={`Delete ${deleting.username} from the database and Keycloak? Related orders and favourites are also removed.`}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            if (!Number.isSafeInteger(Number(deleting.id)) || Number(deleting.id) < 1) {
              throw new Error("This tenant user has an invalid database ID. Reload the user list before deleting.");
            }
            await auth.api(`${base}/${encode(deleting.id)}`, { method: "DELETE" });
            if (data.content.length === 1 && page > 0) setPage(page - 1);
            else setReload((v) => v + 1);
            setNotice("Tenant user deleted.");
          }}
        />
      )}{" "}
      {detail && (
        <Detail title={detail.username} onClose={() => setDetail(null)}>
          <Stack spacing={2}>
            {Object.entries(detail).map(([key, value]) => (
              <Typography key={key}>
                <strong>{key}:</strong> {String(value)}
              </Typography>
            ))}
          </Stack>
        </Detail>
      )}
    </>
  );
}

