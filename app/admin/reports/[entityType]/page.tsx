'use client';

import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "@/app/providers/UserProvider";
import Link from "next/link";
import styles from "./page.module.css";

export default function ReportsListPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const entityType = params.entityType as string;

  const { user } = useUser();

  if (!user?.isAdmin) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Access Denied</h1>
        <p>Only admins can see this page.</p>
      </div>
    );
  }

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!entityType || !user?.accessToken) return;

    async function fetchList() {
      setLoading(true);
      setError(null);

      try {
        const res = await axios.get(
          `${process.env.NEXT_PUBLIC_API_URL}/api/report?entityType=${entityType}&page=0&size=20`,
          { headers: { Authorization: `Bearer ${user?.accessToken}` } }
        );
        setReports(res.data.content || res.data);
      } catch (err: any) {
        console.error(err);
        setError("Failed to load reports.");
      } finally {
        setLoading(false);
      }
    }

    fetchList();
  }, [entityType, user?.accessToken]);

  if (loading) return <div className={styles.container}><h2 className={styles.header}>Loading reports...</h2></div>;
  if (error) return <div className={styles.container}><h2 className={styles.error}>{error}</h2></div>;
  if (reports.length === 0) return <div className={styles.container}><h2 className={styles.header}>No reports found for {entityType}.</h2></div>;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Reports — {entityType}</h1>

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
              <td>{r.reporterName}</td>
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
    </div>
  );
}