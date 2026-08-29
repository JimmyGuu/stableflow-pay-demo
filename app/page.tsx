import { HomeClient } from "@/components/HomeClient";

type HomePageProps = {
  searchParams: Promise<{ full?: string | string[] }>;
};

function isFullMode(value: string | string[] | undefined): boolean {
  if (Array.isArray(value)) return value.includes("1");
  return value === "1";
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const params = await searchParams;
  return <HomeClient fullMode={isFullMode(params.full)} />;
}
