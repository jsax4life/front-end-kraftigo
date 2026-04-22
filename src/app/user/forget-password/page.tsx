import { redirect } from "next/navigation";

/** Legacy URL — “forget” typo; canonical route is `/user/forgot-password`. */
export default function Page() {
  redirect("/user/forgot-password");
}
