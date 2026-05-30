import Link from "next/link";
import { auth } from "@/auth";
import { logoutAction } from "./(auth)/actions";

export async function AuthNav() {
  const session = await auth();

  if (!session?.user) {
    return (
      <>
        <Link href="/login">Sign in</Link>
        <Link href="/register" className="btn">
          Sign up
        </Link>
      </>
    );
  }

  return (
    <>
      {session.user.role === "SELLER" && <Link href="/seller">Dashboard</Link>}
      <Link href="/account">Account</Link>
      <form action={logoutAction}>
        <button type="submit" className="linklike">
          Sign out
        </button>
      </form>
    </>
  );
}
