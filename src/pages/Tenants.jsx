import { useEffect, useState } from "react";
import { Alert, Button, Stack, Typography } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { emptyPage, pageQuery } from "../api/contracts";
import {
  Busy,
  ConfirmDelete,
  DataTable,
  date,
  Detail,
  Editor,
  Empty,
  Failure,
  Pager,
  PageTitle,
} from "../components/Common";
const fields = [{ name: "name", label: "Tenant name", maxLength: 150 }];
export default function Tenants() {
  const auth = useAuth();
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
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    setError(null);
    auth
      .api(`/tenants?${pageQuery(page, size, "name,asc")}`, {
        signal: controller.signal,
      })
      .then(setData)
      .catch((err) => {
        if (err.name !== "AbortError") setError(err);
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [auth.token, page, size, reload]);
  async function getTenant(row, edit) {
    setError(null);
    try {
      const tenant = await auth.api(`/tenants/${row.id}`);
      if (edit) setEditor(tenant);
      else setDetail(tenant);
    } catch (err) {
      setError(err);
    }
  }
  return (
    <>
      <PageTitle
        title="Tenants"
        text="Create brands and manage their names."
        action={
          <Button variant="contained" onClick={() => setEditor({})}>
            Add tenant
          </Button>
        }
      />
      <Failure error={error} />
      {notice && (
        <Alert severity="success" onClose={() => setNotice("")} sx={{ mb: 2 }}>
          {notice}
        </Alert>
      )}
      <Button sx={{ mb: 2 }} onClick={() => setReload((v) => v + 1)}>
        Refresh
      </Button>
      {busy ? (
        <Busy />
      ) : !data.content?.length ? (
        <Empty text="No tenants yet." />
      ) : (
        <DataTable
          rows={data.content}
          columns={[
            { key: "id", label: "ID" },
            { key: "name", label: "Name" },
            {
              key: "createdAt",
              label: "Created",
              render: (row) => date(row.createdAt),
            },
            {
              key: "updatedAt",
              label: "Updated",
              render: (row) => date(row.updatedAt),
            },
          ]}
          actions={(row) => (
            <>
              <Button onClick={() => getTenant(row, false)}>View</Button>
              <Button onClick={() => getTenant(row, true)}>Edit</Button>
              <Button color="error" onClick={() => setDeleting(row)}>
                Delete
              </Button>
            </>
          )}
        />
      )}
      {!busy && (
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
          title={editor.id ? "Edit tenant" : "Add tenant"}
          fields={fields}
          initial={editor}
          onClose={() => setEditor(null)}
          onSave={async (values) => {
            // Creation and update both accept only { name }. IDs/timestamps are read-only.
            await auth.api(editor.id ? `/tenants/${editor.id}` : "/tenants", {
              method: editor.id ? "PUT" : "POST",
              body: { name: values.name.trim() },
            });
            setNotice(editor.id ? "Tenant updated." : "Tenant created.");
            setReload((v) => v + 1);
          }}
        />
      )}{" "}
      {deleting && (
        <ConfirmDelete
          title="Delete tenant?"
          text={`Delete ${deleting.name}? The backend cascades deletion to its database users and products. Use a disposable test tenant.`}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await auth.api(`/tenants/${deleting.id}`, { method: "DELETE" });
            if (data.content.length === 1 && page > 0) setPage(page - 1);
            else setReload((v) => v + 1);
            setNotice("Tenant deleted.");
          }}
        />
      )}{" "}
      {detail && (
        <Detail title={detail.name} onClose={() => setDetail(null)}>
          <Stack spacing={2}>
            <Typography>ID: {detail.id}</Typography>
            <Typography>Created: {date(detail.createdAt)}</Typography>
            <Typography>Updated: {date(detail.updatedAt)}</Typography>
          </Stack>
        </Detail>
      )}
    </>
  );
}
