'use client';

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import { useUser } from "@/app/providers/UserProvider";
import ReportDetail from "@/components/ReportDetail/ReportDetail";
import styles from "./page.module.css";

export default function SingleReportPage() {
  const params = useParams();
  const entityType = params.entityType as string;
  const reportId = params.reportId as string;

  const { user } = useUser();

  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reportExists, setReportExists] = useState(true);

  useEffect(() => {
    if (!entityType || !reportId) return;

    let cancelled = false;

    async function fetchReport() {
      setLoading(true);
      setError(null);

      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/report/${entityType}/${reportId}`;

      try {
        const res = await axios.get(endpoint, {
          headers: {
            Authorization: `Bearer ${user?.accessToken}`,
          },
        });

        if (!cancelled) {
          setReport(res.data);
          setReportExists(true);
        }
      } catch (err: any) {
        console.error(err);
        if (!cancelled) {
          if (err.response?.status === 404) {
            setReportExists(false);
          } else {
            setError("Failed to load report.");
          }
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchReport();

    return () => {
      cancelled = true;
    };
  }, [entityType, reportId, user?.accessToken]);

  if (loading) {
    return (
      <div className={styles.container}>
        <h2 className={styles.header}>Loading report...</h2>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <h2 className={styles.error}>{error}</h2>
      </div>
    );
  }

  if (!report || !reportExists) {
    return (
      <div className={styles.container}>
        <h2 className={styles.header}>Report not found.</h2>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <ReportDetail report={report} />
    </div>
  );
}