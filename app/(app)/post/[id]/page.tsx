"use client";

import { useParams } from "next/navigation";
import { DisplayPostType } from "@/types/displayPost";
import Post from "@/components/Post/Post";
import { useUser } from '@/app/providers/UserProvider';
import axios from "axios";
import { useState, useEffect } from "react";

export default function PostPage() {
    const params = useParams<{ id: string }>();
    const id = Number(params.id);
    const { user } = useUser();
    const [postData, setPostData] = useState<DisplayPostType | null>(null);

    useEffect(() => {
        async function fetchPost() {
            let endpoint = `${process.env.NEXT_PUBLIC_API_URL}/api/post/${id}`
            let config = {}
            try {
                if (user?.accessToken) {
                    config = {
                        headers: {
                            Authorization: `Bearer ${user.accessToken}`,
                        },
                    };
                }
                const res = await axios.get(endpoint, config);
                setPostData(res.data);
            } catch (err) {
                console.error(err);
            }
        }
        fetchPost();
    }, [id, user]); // runs when id or user changes

    return (
        <div
            style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                minHeight: "100vh",
                border: "4px solid black",
            }}
        >
            <Post postData={postData} />
        </div>
    );

}