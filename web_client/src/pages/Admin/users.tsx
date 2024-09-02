import { useEffect, useState } from "react";

import { User } from "@/types/user";
import AdminClient from "@/client/admin";

type Props = {
  client: AdminClient;
};

const UsersAdmin = ({ client }: Props) => {
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  useEffect(() => {
    client
      .getAllUsers()
      .then((users) => {
        setUsers(users.data);
      })
      .finally(() => setLoading(false));
  }, [client, setUsers]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-stretch justify-center">
        <div className="loading loading-infinity loading-lg" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl">משתמשים</h1>
      <div dir="rtl" className="overflow-x-auto">
        <table className="table table-auto">
          <thead>
            <tr>
              <th></th>
              <th>שם</th>
              <th>אימייל</th>
              <th>קבוצה</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="cursor-pointer hover:bg-base-200">
                <td>{user.id}</td>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>{user.group}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersAdmin;
