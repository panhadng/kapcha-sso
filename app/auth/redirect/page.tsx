"use client";

import { useEffect } from "react";
import { useMsal } from "@azure/msal-react";
import { useRouter } from "next/navigation";

export default function Redirect() {
  const { instance } = useMsal();
  const router = useRouter();

  useEffect(() => {
    instance.handleRedirectPromise().then(() => {
      router.push("/");
    });
  }, [instance, router]);

  return <p className="p-5">Redirecting...</p>;
}
