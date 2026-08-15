import { AuthProvider } from "./lib/auth";
import { websiteClientOptions } from "./lib/supabaseClient";
import { HomeEntry } from "./HomeEntry";

export default function Home() {
  return (
    <AuthProvider clientOptions={websiteClientOptions}>
      <HomeEntry />
    </AuthProvider>
  );
}
