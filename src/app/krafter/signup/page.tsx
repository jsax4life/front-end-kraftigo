import { redirect } from "next/navigation";
import { KRAFTER_SIGNUP_URL } from "@/lib/krafterSignupIntent";

/** Short link for Krafter recruitment — account creation then straight to verification. */
export default function KrafterSignupRedirectPage() {
  redirect(KRAFTER_SIGNUP_URL);
}
