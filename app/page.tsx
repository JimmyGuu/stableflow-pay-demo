import { HomeClient } from "@/components/HomeClient";

type HomePageProps = {
  searchParams: Promise<{ test?: string | string[] }>;
};

function isTestMode(value: string | string[] | undefined): boolean {
  if (Array.isArray(value)) return value.includes("1");
  return value === "1";
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  return <HomeClient testMode={isTestMode(params.test)} />;
}
