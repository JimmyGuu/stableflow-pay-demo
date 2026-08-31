"use client";

import { WebhookEventsTable } from "@/components/WebhookEventsTable";
import { useRouter } from "next/navigation";

export default function WebhooksPage() {
  const router = useRouter();
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10">
      <div className="mb-6 w-full max-w-[920px]">
        <button
          type="button"
          className="cursor-pointer text-sm font-medium text-zinc-600 underline-offset-2 hover:text-zinc-950 hover:underline"
          onClick={() => router.back()}
        >
          &lt; Back to Add Credits
        </button>
      </div>
      <WebhookEventsTable />
    </main>
  );
}
