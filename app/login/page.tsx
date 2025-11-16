'use client';
import { Button } from 'react-bootstrap';
import { useRouter } from 'next/navigation';


export default function Home() {
  const router = useRouter();

  return (
      <Button onClick={async() => router.push("/signUp")}>Sign Up</Button>
  );
}