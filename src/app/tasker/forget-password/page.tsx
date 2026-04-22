import { redirect } from "next/navigation";

/** Old link target — canonical route is `/tasker/forgot-password`. */
export default function Page() {
  redirect("/tasker/forgot-password");
}
