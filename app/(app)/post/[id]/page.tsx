"use client";

import { useParams } from "next/navigation";
import { DisplayPostType } from "@/types/displayPost";
import Post from "@/components/Post/Post";
import { useUser } from '@/app/providers/UserProvider';
import axios from "axios";
import { useState } from "react";

export default function PostPage() {
    const params = useParams<{ id: string }>();
    const id = Number(params.id);
    const { user } = useUser();
    const [postData, setPostData] = useState<DisplayPostType | null>(null);

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

    return (
        <Post postData={postData}></Post>
    );
    
}