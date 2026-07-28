import { NexoraApp } from "../nexora-app";

export default async function RoutedPage({
  params,
}: {
  params: Promise<{ path: string[] }>;
}) {
  const resolved = await params;
  return <NexoraApp initialPath={`/${resolved.path.join("/")}`} />;
}
