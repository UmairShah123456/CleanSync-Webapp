import { AuthContainer } from "@/components/layout/AuthContainer";
import { UpdatePasswordForm } from "./UpdatePasswordForm";

export default async function UpdatePasswordPage() {
  return (
    <AuthContainer
      title="Update your password"
      subtitle="Enter your new password below"
    >
      <UpdatePasswordForm />
    </AuthContainer>
  );
}
