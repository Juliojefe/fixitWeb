'use client';

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "@/app/providers/UserProvider";
import Link from "next/link";
import styles from "./page.module.css";

export default function ReportsListPage() {
  const params = useParams();
  const entityType = params.entityType as string;

  const { user } = useUser();

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const pageSize = 10;   // you can change this

  async function fetchReports(currentPage: number, append = false) {
    if (!user?.accessToken) return;

    const isInitialLoad = !append;
    if (isInitialLoad) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/api/report?entityType=${entityType}&page=${currentPage}&size=${pageSize}`,
        { headers: { Authorization: `Bearer ${user.accessToken}` } }
      );

      const newReports = res.data.content || res.data;

      if (append) {
        setReports(prev => [...prev, ...newReports]);
      } else {
        setReports(newReports);
      }

      // Check if there are more pages
      setHasMore(!res.data.last && newReports.length === pageSize);

    } catch (err: any) {
      console.error(err);
      setError("Failed to load reports.");
    } finally {
      if (isInitialLoad) setLoading(false);
      else setLoadingMore(false);
    }
  }

  // Initial load
  useEffect(() => {
    if (!entityType || !user?.isAdmin) return;
    setPage(0);
    setReports([]);
    setHasMore(true);
    fetchReports(0, false);
  }, [entityType, user?.accessToken]);

  const loadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchReports(nextPage, true);
  };

  if (!user?.isAdmin) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Access Denied</h1>
        <p>Only admins can see this page.</p>
      </div>
    );
  }

  if (loading) {
    return <div className={styles.container}><h2 className={styles.header}>Loading reports...</h2></div>;
  }

  if (error) {
    return <div className={styles.container}><h2 className={styles.error}>{error}</h2></div>;
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Reports — {entityType}</h1>

      {reports.length === 0 ? (
        <h2 className={styles.header}>No reports found for {entityType}.</h2>
      ) : (
        <>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Report ID</th>
                <th>Reporter</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r.reportId}>
                  <td>#{r.reportId}</td>
                  <td>{r.reporterName || "—"}</td>
                  <td>{r.status}</td>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                  <td>
                    <Link href={`/admin/reports/${entityType}/${r.reportId}`} className={styles.viewLink}>
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {hasMore && (
            <div style={{ textAlign: "center", marginTop: "30px" }}>
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className={styles.loadMoreBtn}
              >
                {loadingMore ? "Loading..." : "Load More Reports"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}