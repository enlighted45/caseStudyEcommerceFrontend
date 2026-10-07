import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useAuth } from "../context/AuthContext";
import {
  emptyPage,
  encode,
  pageQuery,
  productBody,
  productFields,
} from "../api/contracts";
import {
  Busy,
  ConfirmDelete,
  DataTable,
  Detail,
  Editor,
  Empty,
  Failure,
  money,
  Pager,
  PageTitle,
} from "../components/Common";
export default function TenantProducts() {
  const auth = useAuth();
  const tenantName = auth.identity.tenantName;
  const base = `/${encode(tenantName)}/products`;
  const [data, setData] = useState(emptyPage);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [sort, setSort] = useState("name,asc");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);
  const [editor, setEditor] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [detail, setDetail] = useState(null);
  const [notice, setNotice] = useState("");
  useEffect(() => {
    if (!tenantName) {
      setData(emptyPage);
      return;
    }
    const controller = new AbortController();
    setBusy(true);
    setError(null);
    auth
      .api(`${base}?${pageQuery(page, size, sort)}`, {
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
  }, [tenantName, auth.token, page, size, sort, reload]);
  async function fetchProduct(row, edit) {
    setError(null);
    try {
      const product = await auth.api(`${base}/${row.id}`);
      if (edit) setEditor(product);
      else setDetail(product);
    } catch (err) {
      setError(err);
    }
  }
  async function save(values) {
    const editing = !!editor.id;
    // tenantName is a path variable; tenantId is never included in the product body.
    await auth.api(editing ? `${base}/${editor.id}` : base, {
      method: editing ? "PUT" : "POST",
      body: productBody(values),
    });
    setNotice(editing ? "Product updated." : "Product created.");
    setReload((v) => v + 1);
  }
  return (
    <>
      <PageTitle
        title="Manage products"
        text={
          tenantName
            ? `Tenant: ${tenantName}`
            : "Your tenant account is not ready. Check My account for loading or API errors."
        }
        action={
          <Button
            variant="contained"
            disabled={!tenantName}
            onClick={() => setEditor({})}
          >
            Add product
          </Button>
        }
      />
      <Failure error={error} />
      {notice && (
        <Alert severity="success" onClose={() => setNotice("")} sx={{ mb: 2 }}>
          {notice}
        </Alert>
      )}
      {!tenantName && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Only your own tenant’s products can be managed.
        </Alert>
      )}
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField
          select
          size="small"
          label="Sort"
          value={sort}
          onChange={(e) => {
            setSort(e.target.value);
            setPage(0);
          }}
          sx={{ minWidth: 180 }}
        >
          {[
            ["name,asc", "Name A–Z"],
            ["price,asc", "Price ascending"],
            ["price,desc", "Price descending"],
            ["quantity,desc", "Stock descending"],
          ].map(([value, label]) => (
            <MenuItem key={value} value={value}>
              {label}
            </MenuItem>
          ))}
        </TextField>
        <Button onClick={() => setReload((v) => v + 1)} disabled={!tenantName}>
          Refresh
        </Button>
      </Stack>
      {busy ? (
        <Busy />
      ) : !data.content?.length ? (
        <Empty text="No products to display." />
      ) : (
        <DataTable
          rows={data.content}
          columns={[
            { key: "id", label: "ID" },
            { key: "name", label: "Name" },
            { key: "category", label: "Category" },
            { key: "price", label: "Price", render: (row) => money(row.price) },
            { key: "quantity", label: "Stock" },
          ]}
          actions={(row) => (
            <>
              <Button onClick={() => fetchProduct(row, false)}>View</Button>
              <Button onClick={() => fetchProduct(row, true)}>Edit</Button>
              <Button color="error" onClick={() => setDeleting(row)}>
                Delete
              </Button>
            </>
          )}
        />
      )}
      {tenantName && !busy && (
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
          title={editor.id ? "Edit product" : "Add product"}
          fields={productFields}
          initial={editor}
          onSave={save}
          onClose={() => setEditor(null)}
        />
      )}
      {deleting && (
        <ConfirmDelete
          title="Delete product?"
          text={`Remove ${deleting.name} from active product listings? The backend uses soft deletion.`}
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await auth.api(`${base}/${deleting.id}`, { method: "DELETE" });
            if (data.content.length === 1 && page > 0) setPage(page - 1);
            else setReload((v) => v + 1);
            setNotice("Product deleted.");
          }}
        />
      )}{" "}
      {detail && (
        <Detail title={detail.name} onClose={() => setDetail(null)}>
          <Stack spacing={2}>
            <Chip label={detail.category} sx={{ alignSelf: "flex-start" }} />
            <Typography>{detail.description}</Typography>
            <Typography>
              Price: {money(detail.price)} · Stock: {detail.quantity}
            </Typography>
            <Typography>
              Product #{detail.id} · Tenant #{detail.tenantId}
            </Typography>
          </Stack>
        </Detail>
      )}
    </>
  );
}

