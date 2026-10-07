import { useEffect, useState } from "react";
import { Alert, Button, Stack, Typography } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { emptyPage, pageQuery } from "../api/contracts";
import {
  Busy,
  DataTable,
  date,
  Detail,
  Empty,
  Failure,
  money,
  Pager,
  PageTitle,
} from "../components/Common";
export default function Orders() {
  const auth = useAuth();
  const userId = auth.identity.userId;
  const [data, setData] = useState(emptyPage);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [reload, setReload] = useState(0);
  useEffect(() => {
    if (!userId) {
      setData(emptyPage);
      return;
    }
    const controller = new AbortController();
    setBusy(true);
    setError(null);
    auth
      .api(`/users/${userId}/orders?${pageQuery(page, size)}`, {
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
  }, [userId, auth.token, page, size, reload]);
  async function detail(order) {
    setError(null);
    try {
      setSelected(await auth.api(`/users/${userId}/orders/${order.id}`));
    } catch (err) {
      setError(err);
    }
  }
  return (
    <>
      <PageTitle
        title="My orders"
        text="Order history is returned newest first by the backend."
        action={
          <Button
            variant="outlined"
            onClick={() => setReload((v) => v + 1)}
            disabled={!userId}
          >
            Refresh
          </Button>
        }
      />
      <Failure error={error} />
      {!userId && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Your account is not ready. Check My account for loading or API errors.
        </Alert>
      )}
      {busy ? (
        <Busy />
      ) : !data.content?.length ? (
        <Empty text="No orders to display." />
      ) : (
        <DataTable
          rows={data.content}
          columns={[
            { key: "id", label: "Order ID" },
            {
              key: "createdAt",
              label: "Created",
              render: (row) => date(row.createdAt),
            },
            { key: "totalQuantity", label: "Total quantity" },
            {
              key: "totalAmount",
              label: "Total amount",
              render: (row) => money(row.totalAmount),
            },
          ]}
          actions={(row) => <Button onClick={() => detail(row)}>View</Button>}
        />
      )}
      {userId && !busy && (
        <Pager
          data={data}
          page={page}
          size={size}
          setPage={setPage}
          setSize={setSize}
        />
      )}
      {selected && (
        <Detail
          title={`Order #${selected.id}`}
          onClose={() => setSelected(null)}
        >
          <Stack spacing={2}>
            <Typography>
              {date(selected.createdAt)} · User #{selected.userId}
            </Typography>
            <Typography variant="h6">
              Total: {money(selected.totalAmount)} · Quantity:{" "}
              {selected.totalQuantity}
            </Typography>
            <DataTable
              rows={selected.items || []}
              columns={[
                { key: "productId", label: "Product ID" },
                { key: "productName", label: "Product" },
                { key: "quantity", label: "Quantity" },
                {
                  key: "price",
                  label: "Line total",
                  render: (row) => money(row.price),
                },
              ]}
            />
          </Stack>
        </Detail>
      )}
    </>
  );
}

