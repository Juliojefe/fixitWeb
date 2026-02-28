"use client";

import { useParams } from "next/navigation";

export default function PostPage() {
  const params = useParams<{ id: string }>();
  const idNumber = Number(params.id);

  console.log("Post ID as number:", idNumber);

  return <h1>Post {idNumber}</h1>;
}