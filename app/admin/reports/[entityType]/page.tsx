'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function ReportsListPage() {
  const params = useParams();
  const entityType = params.entityType as string;

  useEffect(() => {
    console.log(`✅ Admin selected entity type to filter reports: ${entityType}`);
    // Future: Fetch filtered reports here based on entityType
  }, [entityType]);

  return (
    <div style={{ padding: '40px', fontFamily: 'DM Sans, sans-serif' }}>
      <h1>Reports for: <strong>{entityType}</strong></h1>
      <p style={{ fontSize: '1.1rem', color: '#555' }}>
        This page will list all reports for the selected entity type.<br />
        (Currently just logging the choice — full list coming next)
      </p>
    </div>
  );
}
