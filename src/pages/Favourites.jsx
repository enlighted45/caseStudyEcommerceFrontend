import { useEffect, useState } from "react";
import { Alert, Button } from "@mui/material";
import { useAuth } from "../context/AuthContext";
import { emptyPage, pageQuery } from "../api/contracts";
import {
  Busy,
  DataTable,
  Empty,
  Failure,
  Pager,
  PageTitle,
} from "../components/Common";
export default function Favourites() {
  const auth = useAuth();
  const userId = auth.identity.userId;
  const [data, setData] = useState(emptyPage);
  const [page, setPage] = useState(0);
  const [size, setSize] = useState(10);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [reload, setReload] = useState(0);
  const [removing, setRemoving] = useState(null);
  useEffect(() => {
    if (!userId) {
      setData(emptyPage);
      return;
    }
    const controller = new AbortController();
    setBusy(true);
    setError(null);
    auth
      .api(`/users/${userId}/favourites?${pageQuery(page, size)}`, {
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
  async function remove(row) {
    setRemoving(row.id);
    setError(null);
    // Delete uses productId, not the favourite record ID.
    try {
      await auth.api(`/users/${userId}/favourites/${row.productId}`, {
        method: "DELETE",
      });
      if (data.content.length === 1 && page > 0) setPage(page - 1);
      else setReload((v) => v + 1);
    } catch (err) {
      setError(err);
    } finally {
      setRemoving(null);
    }
  }
  return (
    <>
      <PageTitle
        title="Favourites"
        text="Save products from the catalogue and remove them here."
        action={
          <Button
            variant="outlined"
            disabled={!userId}
            onClick={() => setReload((v) => v + 1)}
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
        <Empty text="No favourite products yet." />
      ) : (
        <DataTable
          rows={data.content}
          columns={[
            { key: "id", label: "Favourite ID" },
            { key: "productId", label: "Product ID" },
            { key: "productName", label: "Product" },
          ]}
          actions={(row) => (
            <Button
              color="error"
              disabled={removing !== null}
              onClick={() => remove(row)}
            >
              {removing === row.id ? "Removing…" : "Remove"}
            </Button>
          )}
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
    </>
  );
}

