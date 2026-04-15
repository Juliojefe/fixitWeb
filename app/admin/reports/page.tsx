'use client';

import { useUser } from '@/app/providers/UserProvider';

export default function AdminReportsPage() {
  const { user } = useUser();

  if (!user?.isAdmin) {
    return <div style={{ padding: '80px', textAlign: 'center' }}>Access Denied — Only admins can view reports.</div>;
  }

  return (
    <div style={{ padding: '40px', fontFamily: 'DM Sans, sans-serif' }}>
      <h1>Reports Management</h1>
      <p style={{ fontSize: '1.1rem', color: '#555' }}>
        This is the admin reports page.<br />
        (Currently empty — we will build the full reports list and review UI next)
      </p>
    </div>
  );
}