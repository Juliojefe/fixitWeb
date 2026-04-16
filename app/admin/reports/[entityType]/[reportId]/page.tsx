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

  if (!user?.isAdmin) {
    return (
      <div className={styles.container}>
        <h1 className={styles.title}>Access Denied</h1>
        <p>Only admins can see this page.</p>
      </div>
    );
  }
  const fetchReport = async () => {
    if (!entityType || !reportId) return;

    setLoading(true);
    setError(null);

    const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/report/${entityType}/${reportId}`;

    try {
      const res = await axios.get(endpoint, {
        headers: {
          Authorization: `Bearer ${user?.accessToken}`,
        },
      });

      const data = res.data;
      setReport(data);
      console.log("✅ Report loaded:", data);
      setReportExists(true);
    } catch (err: any) {
      console.error(err);
      if (err.response?.status === 404) {
        setReportExists(false);
      } else {
        setError("Failed to load report.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [entityType, reportId, user?.accessToken]);

  const handleSubmitReview = async (newStatus: string, newExplanation: string) => {
    if (!user?.isAdmin || !reportId) return;

    try {
      const endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/report/${reportId}/review`;

      await axios.patch(
        endpoint,
        {
          status: newStatus,
          adminExplanation: newExplanation.trim() || null,
        },
        {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        }
      );

      console.log("✅ Review submitted successfully");
      await fetchReport(); // refresh everything
    } catch (err: any) {
      console.error("Review submission failed:", err);
      alert(err.response?.data?.message || "Failed to submit review. Please try again.");
    }
  };

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
      <ReportDetail 
        report={report} 
        user={user} 
        onReviewSubmitted={handleSubmitReview} 
      />
    </div>
  );
}