import Link from "next/link";

import { WebhookEventsTable } from "@/components/WebhookEventsTable";

export default function WebhooksPage() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-10">
      <div className="mb-6 w-full max-w-[920px]">
        <Link
          href="/"
          className="text-sm font-medium text-zinc-600 underline-offset-2 hover:text-zinc-950 hover:underline"
        >
          Back to Add Credits
        </Link>
      </div>
      <WebhookEventsTable />
    </main>
  );
}
