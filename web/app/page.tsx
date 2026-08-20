import { hasValidSession } from "./lib/auth";
import Dashboard from "./dashboard";
import LoginPage from "./login";

export const dynamic = "force-dynamic";

export default async function Home() {
  return (await hasValidSession()) ? <Dashboard /> : <LoginPage />;
}
