import useAdminClient from "@/hooks/useAdminClient";
import UsersAdmin from "./users";

const Admin = () => {
  const client = useAdminClient();

  if (!client) {
    return null; // Not Expected
  }

  return (
    <div className="flex-grow p-5">
      <h1 className="mb-4 text-3xl">ממשק ניהול</h1>
      <UsersAdmin client={client} />
    </div>
  );
};

export default Admin;
